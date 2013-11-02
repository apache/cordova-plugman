
var path = require('path'),
    fs   = require('fs'),
    et   = require('elementtree'),
    shell= require('shelljs'),
    config_changes = require('./util/config-changes'),
    xml_helpers = require('./util/xml-helpers'),
    action_stack = require('./util/action-stack'),
    n = require('ncallbacks'),
    dependencies = require('./util/dependencies'),
    underscore = require('underscore'),
    Q = require('q'),
    plugins = require('./util/plugins'),
	events = require('./events');
    platform_modules = require('./platforms');

// possible options: cli_variables, www_dir
// Returns a promise.
module.exports = function(platform, project_dir, id, plugins_dir, options) {
    return module.exports.uninstallPlatform(platform, project_dir, id, plugins_dir, options)
    .then(function(uninstalled) {
        return module.exports.uninstallPlugin(id, plugins_dir, options);
    });
}

// Returns a promise.
module.exports.uninstallPlatform = function(platform, project_dir, id, plugins_dir, options) {
    if (!platform_modules[platform]) {
        return Q.reject(new Error(platform + " not supported."));
    }

    var plugin_dir = path.join(plugins_dir, id);

    if (!fs.existsSync(plugin_dir)) {
        return Q.reject(new Error('Plugin "' + id + '" not found. Already uninstalled?'));
    }

    var current_stack = new action_stack();

    options.is_top_level = true;
    return runUninstall(current_stack, platform, project_dir, plugin_dir, plugins_dir, options);
};

// Returns a promise.
module.exports.uninstallPlugin = function(id, plugins_dir, options) {
    var plugin_dir = path.join(plugins_dir, id);
	var quoteId = "'" + id + "'";

    // If already removed, skip.
    if (!fs.existsSync(plugin_dir)) {
        return Q();
    }
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , plugin_et    = xml_helpers.parseElementtreeSync(xml_path);

    events.emit('log', 'Deleting ' + quoteId);
	options = options || {};

    var doDelete = function(id) {
        var plugin_dir = path.join(plugins_dir, id);
        if (!fs.existsSync(plugin_dir)) return;
        shell.rm('-rf', plugin_dir);
        events.emit('verbose', quoteId + ' deleted.');
    };

    // We've now lost the metadata for the plugins that have been uninstalled, so we can't use that info.
    // Instead, we list all dependencies of the target plugin, and check the remaining metadata to see if
    // anything depends on them, or if they're listed as top-level.
    // If neither, they can be deleted.
    var toDelete = plugin_et.findall('dependency');
    toDelete = toDelete && toDelete.length ? toDelete.map(function(p) { return p.attrib.id; }) : [];
    toDelete.push(id);

    // Okay, now we check if any of these are depended on, or top-level.
    // Find the installed platforms by whether they have a metadata file.
    var platforms = Object.keys(platform_modules).filter(function(platform) {
        return fs.existsSync(path.join(plugins_dir, platform + '.json'));
    });

    var dependList = {};
    platforms.forEach(function(platform) {
		var depsInfo = dependencies.generate_dependency_info(plugins_dir, platform, 'remove');
        var tlps = depsInfo.top_level_plugins,
		    deps;

        toDelete.forEach(function(plugin) {
            if (tlps.indexOf(plugin) >= 0 ) {
                dependList[plugin] = tlps.join(',');
            } else if( (deps = dependencies.dependents(plugin, depsInfo)) && deps.length ) {
				dependList[plugin] = deps.join(',');
			}
        });
    });

	var forced = (options.indexOf('-f') + options.indexOf('--force') > -2);   
    var i, plugin_id, msg;
	for(i in toDelete) {
		plugin_id = toDelete[i];

		if( dependList[plugin_id] ) {
			msg = quoteId + ' is required by ('+ dependList[plugin_id] + ')';
			if(forced) {
				events.emit('log', msg +' but forcing removal.');
			} else {
				events.emit('log', msg +' and cannot be removed (hint: use -f or --force)');
				continue;
			}
		}

		doDelete(plugin_id);
	}

    return Q();
};

// possible options: cli_variables, www_dir, is_top_level
// Returns a promise
function runUninstall(actions, platform, project_dir, plugin_dir, plugins_dir, options) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , plugin_et    = xml_helpers.parseElementtreeSync(xml_path);
    var plugin_id    = plugin_et._root.attrib['id'];
    options = options || {};

    // Check that this plugin has no dependents.
    var dependents = dependencies.dependents(plugin_id, plugins_dir, platform);
    if(options.is_top_level && dependents && dependents.length > 0) {
        events.emit('verbose', 'Other top-level plugins (' + dependents.join(', ') + ') depend on ' + plugin_id + ', skipping uninstallation.');
        return Q();
    }

    // Check how many dangling dependencies this plugin has.
    var dependency_info = dependencies.generate_dependency_info(plugins_dir, platform);
    var deps = dependency_info.graph.getChain(plugin_id);
    var danglers = dependencies.danglers(plugin_id, plugins_dir, platform);

    var promise;
    if (deps && deps.length && danglers && danglers.length) {
        events.emit('log', 'Uninstalling ' + danglers.length + ' dangling dependent plugins.');
        promise = Q.all(
            danglers.map(function(dangler) {
                var dependent_path = path.join(plugins_dir, dangler);
                var opts = {
                    www_dir: options.www_dir,
                    cli_variables: options.cli_variables,
                    is_top_level: dependency_info.top_level_plugins.indexOf(dangler) > -1
                };
                return runUninstall(actions, platform, project_dir, dependent_path, plugins_dir, opts);
            })
        );
    } else {
        promise = Q();
    }

    return promise.then(function() {
        return handleUninstall(actions, platform, plugin_id, plugin_et, project_dir, options.www_dir, plugins_dir, plugin_dir, options.is_top_level);
    });
}

// Returns a promise.
function handleUninstall(actions, platform, plugin_id, plugin_et, project_dir, www_dir, plugins_dir, plugin_dir, is_top_level) {
    var platform_modules = require('./platforms');
    var handler = platform_modules[platform];
    var platformTag = plugin_et.find('./platform[@name="'+platform+'"]');
    www_dir = www_dir || handler.www_dir(project_dir);
    events.emit('log', 'Uninstalling ' + plugin_id + ' from ' + platform);

    var assets = plugin_et.findall('./asset');
    if (platformTag) {
        var sourceFiles = platformTag.findall('./source-file'),
            headerFiles = platformTag.findall('./header-file'),
            libFiles = platformTag.findall('./lib-file'),
            resourceFiles = platformTag.findall('./resource-file');
        assets = assets.concat(platformTag.findall('./asset'));

        // queue up native stuff
        sourceFiles && sourceFiles.forEach(function(source) {
            actions.push(actions.createAction(handler["source-file"].uninstall, [source, project_dir, plugin_id], handler["source-file"].install, [source, plugin_dir, project_dir, plugin_id]));
        });

        headerFiles && headerFiles.forEach(function(header) {
            actions.push(actions.createAction(handler["header-file"].uninstall, [header, project_dir, plugin_id], handler["header-file"].install, [header, plugin_dir, project_dir, plugin_id]));
        });

        resourceFiles && resourceFiles.forEach(function(resource) {
            actions.push(actions.createAction(handler["resource-file"].uninstall, [resource, project_dir], handler["resource-file"].install, [resource, plugin_dir, project_dir]));
        });

        libFiles && libFiles.forEach(function(source) {
            actions.push(actions.createAction(handler["lib-file"].uninstall, [source, project_dir, plugin_id], handler["lib-file"].install, [source, plugin_dir, project_dir, plugin_id]));
        });
    }

    // queue up asset installation
    var common = require('./platforms/common');
    assets && assets.forEach(function(asset) {
        actions.push(actions.createAction(common.asset.uninstall, [asset, www_dir, plugin_id], common.asset.install, [asset, plugin_dir, www_dir]));
    });

    // run through the action stack
    return actions.process(platform, project_dir)
    .then(function() {
        // WIN!
        events.emit('verbose', plugin_id + ' uninstalled from ' + platform + '.');
        // queue up the plugin so prepare can remove the config changes
        config_changes.add_uninstalled_plugin_to_prepare_queue(plugins_dir, path.basename(plugin_dir), platform, is_top_level);
        // call prepare after a successful uninstall
        events.prepare(project_dir, platform, plugins_dir);
    });
}


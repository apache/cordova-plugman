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
    platform_modules = require('./platforms');

// possible options: cli_variables, www_dir
// Returns a promise.
module.exports = function(platform, project_dir, id, plugins_dir, options) {
    return module.exports.uninstallPlatform(platform, project_dir, id, plugins_dir, options)
    .then(function() {
        return module.exports.uninstallPlugin(id, plugins_dir);
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
module.exports.uninstallPlugin = function(id, plugins_dir) {
    var plugin_dir = path.join(plugins_dir, id);
    // If already removed, skip.
    if (!fs.existsSync(plugin_dir)) {
        return Q();
    }
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , plugin_et    = xml_helpers.parseElementtreeSync(xml_path);

    require('../plugman').emit('log', 'Deleting plugin ' + id);
    // Check for dependents
    var dependencies = plugin_et.findall('dependency');
    if (dependencies && dependencies.length) {
        require('../plugman').emit('verbose', 'Dependencies detected, iterating through them and removing them first.');
        return dependencies.reduce(function(soFar, dep) {
            return soFar.then(function() {
                return module.exports.uninstallPlugin(dep.attrib.id, plugins_dir);
            });
        }, Q())
        .then(function() {
            shell.rm('-rf', plugin_dir);
            require('../plugman').emit('verbose', id + ' deleted.');
        });
    } else {
        // axe the directory
        shell.rm('-rf', plugin_dir);
        require('../plugman').emit('verbose', 'Deleted "' + plugin_dir + '".');
        return Q();
    }
};

// possible options: cli_variables, www_dir, is_top_level
// Returns a promise.
function runUninstall(actions, platform, project_dir, plugin_dir, plugins_dir, options) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , plugin_et    = xml_helpers.parseElementtreeSync(xml_path);
    var plugin_id    = plugin_et._root.attrib['id'];
    options = options || {};

    var dependency_info = dependencies.generate_dependency_info(plugins_dir, platform);
    var graph = dependency_info.graph;
    var dependents = graph.getChain(plugin_id);

    var tlps = dependency_info.top_level_plugins;
    var diff_arr = [];
    tlps.forEach(function(tlp) {
        if (tlp != plugin_id) {
            var ds = graph.getChain(tlp);
            if (options.is_top_level && ds.indexOf(plugin_id) > -1) {
                throw new Error('Another top-level plugin (' + tlp + ') relies on plugin ' + plugin_id + ', therefore aborting uninstallation.');
            }
            diff_arr.push(ds);
        }
    });

    // if this plugin has dependencies, do a set difference to determine which dependencies are not required by other existing plugins
    diff_arr.unshift(dependents);
    var danglers = underscore.difference.apply(null, diff_arr);
    if (dependents.length && danglers && danglers.length) {
        require('../plugman').emit('log', 'Uninstalling ' + danglers.length + ' dangling dependent plugins.');
        return Q.all(
            danglers.map(function(dangler) {
                var dependent_path = path.join(plugins_dir, dangler);
                var opts = {
                    www_dir: options.www_dir,
                    cli_variables: options.cli_variables,
                    is_top_level: false /* TODO: should this "is_top_level" param be false for dependents? */
                };
                return runUninstall(actions, platform, project_dir, dependent_path, plugins_dir, opts);
            })
        ).then(function() {
            return handleUninstall(actions, platform, plugin_id, plugin_et, project_dir, options.www_dir, plugins_dir, plugin_dir, options.is_top_level);
        });
    } else {
        // this plugin can get axed by itself, gogo!
        return handleUninstall(actions, platform, plugin_id, plugin_et, project_dir, options.www_dir, plugins_dir, plugin_dir, options.is_top_level);
    }
}

// Returns a promise.
function handleUninstall(actions, platform, plugin_id, plugin_et, project_dir, www_dir, plugins_dir, plugin_dir, is_top_level) {
    var platform_modules = require('./platforms');
    var handler = platform_modules[platform];
    var platformTag = plugin_et.find('./platform[@name="'+platform+'"]');
    www_dir = www_dir || handler.www_dir(project_dir);
    require('../plugman').emit('log', 'Uninstalling ' + plugin_id + ' from ' + platform);

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
        require('../plugman').emit('verbose', plugin_id + ' uninstalled from ' + platform + '.');
        // queue up the plugin so prepare can remove the config changes
        config_changes.add_uninstalled_plugin_to_prepare_queue(plugins_dir, path.basename(plugin_dir), platform, is_top_level);
        // call prepare after a successful uninstall
        require('./../plugman').prepare(project_dir, platform, plugins_dir);
    });
}

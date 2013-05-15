var path = require('path'),
    fs   = require('fs'),
    et   = require('elementtree'),
    shell= require('shelljs'),
    config_changes = require('./util/config-changes'),
    action_stack = require('./util/action-stack'),
    n = require('ncallbacks'),
    dependencies = require('./util/dependencies'),
    underscore = require('underscore'),
    platform_modules = require('./platforms');

module.exports = function uninstallPlugin(platform, project_dir, id, plugins_dir, cli_variables, www_dir, is_top_level, callback) {
    if (!platform_modules[platform]) {
        var err = new Error(platform + " not supported.");
        if (callback) callback(err);
        else throw err;
        return;
    }

    var plugin_dir = path.join(plugins_dir, id);

    if (!fs.existsSync(plugin_dir)) {
        var err = new Error('Plugin "' + name + '" not found. Already uninstalled?');
        if (callback) callback(err);
        else throw err;
        return;
    }

    runUninstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, is_top_level, callback);
};

function runUninstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, is_top_level, callback) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , xml_text     = fs.readFileSync(xml_path, 'utf-8')
      , plugin_et    = new et.ElementTree(et.XML(xml_text))
    var name         = plugin_et.findall('name').text;
    var plugin_id    = plugin_et._root.attrib['id'];

    var dependency_info = dependencies.generate_dependency_info(plugins_dir, platform);
    var graph = dependency_info.graph;
    var dependents = graph.getChain(plugin_id);

    var tlps = dependency_info.top_level_plugins;
    var diff_arr = [];
    tlps.forEach(function(tlp) {
        if (tlp != plugin_id) {
            var ds = graph.getChain(tlp);
            if (is_top_level && ds.indexOf(plugin_id) > -1) {
                var err = new Error('Another top-level plugin (' + tlp + ') relies on plugin ' + plugin_id + ', therefore aborting uninstallation.');
                if (callback) callback(err);
                else throw err;
                return;
            }
            diff_arr.push(ds);
        }
    });

    // if this plugin has dependencies, do a set difference to determine which dependencies are not required by other existing plugins
    diff_arr.unshift(dependents);
    var danglers = underscore.difference.apply(null, diff_arr);
    if (dependents.length && danglers && danglers.length) {
        var end = n(danglers.length, function() {
            handleUninstall(platform, plugin_id, plugin_et, project_dir, www_dir, plugins_dir, plugin_dir, is_top_level, callback);
        });
        danglers.forEach(function(dangler) {
            module.exports(platform, project_dir, dangler, plugins_dir, cli_variables, www_dir, false /* TODO: should this "is_top_level" param be false for dependents? */, end);
        });
    } else {
        // this plugin can get axed by itself, gogo!
        handleUninstall(platform, plugin_id, plugin_et, project_dir, www_dir, plugins_dir, plugin_dir, is_top_level, callback);
    }
}

function handleUninstall(platform, plugin_id, plugin_et, project_dir, www_dir, plugins_dir, plugin_dir, is_top_level, callback) {
    var platform_modules = require('./platforms');
    var handler = platform_modules[platform];
    var platformTag = plugin_et.find('./platform[@name="'+platform+'"]');
    www_dir = www_dir || handler.www_dir(project_dir);

    var assets = plugin_et.findall('./asset');
    if (platformTag) {
        var sourceFiles = platformTag.findall('./source-file'),
            headerFiles = platformTag.findall('./header-file'),
            resourceFiles = platformTag.findall('./resource-file'),
            frameworks = platformTag.findall('./framework');
        assets = assets.concat(platformTag.findall('./asset'));

        // queue up native stuff
        sourceFiles && sourceFiles.forEach(function(source) {
            action_stack.push(action_stack.createAction(handler["source-file"].uninstall, [source, project_dir], handler["source-file"].install, [source, plugin_dir, project_dir]));
        });

        headerFiles && headerFiles.forEach(function(header) {
            action_stack.push(action_stack.createAction(handler["header-file"].uninstall, [header, project_dir], handler["header-file"].install, [header, plugin_dir, project_dir]));
        });

        resourceFiles && resourceFiles.forEach(function(resource) {
            action_stack.push(action_stack.createAction(handler["resource-file"].uninstall, [resource, project_dir], handler["resource-file"].install, [resource, plugin_dir, project_dir]));
        });

        frameworks && frameworks.forEach(function(framework) {
            action_stack.push(action_stack.createAction(handler["framework"].uninstall, [framework, project_dir], handler["framework"].install, [framework, plugin_dir, project_dir]));
        });
    }

    // queue up asset installation
    var common = require('./platforms/common');
    assets && assets.forEach(function(asset) {
        action_stack.push(action_stack.createAction(common.asset.uninstall, [asset, www_dir, plugin_id], common.asset.install, [asset, plugin_dir, www_dir]));
    });

    // run through the action stack
    action_stack.process(platform, project_dir, function(err) {
        if (err) {
            if (callback) callback(err);
            else throw err;
        } else {
            // WIN!
            // queue up the plugin so prepare can remove the config changes
            config_changes.add_uninstalled_plugin_to_prepare_queue(plugins_dir, path.basename(plugin_dir), platform, is_top_level);
            // call prepare after a successful uninstall
            require('./../plugman').prepare(project_dir, platform, plugins_dir);
            // axe the directory
            shell.rm('-rf', plugin_dir);
            console.log(plugin_id + ' uninstalled.');
            if (callback) callback();
        }
    });
}

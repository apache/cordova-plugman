var path = require('path'),
    fs   = require('fs'),
    et   = require('elementtree'),
    n    = require('ncallbacks'),
    config_changes = require('./util/config-changes'),
    action_stack = require('./util/action-stack'),
    platform_modules = require('./platforms');

module.exports = function installPlugin(platform, project_dir, id, plugins_dir, subdir, cli_variables, www_dir, callback) {
    if (!platform_modules[platform]) {
        var err = new Error(platform + " not supported.");
        if (callback) {
            callback(err);
            return;
        }
        else throw err;
    }

    var plugin_dir = path.join(plugins_dir, id);

    // Check that the plugin has already been fetched.
    if (!fs.existsSync(plugin_dir)) {
        // if plugin doesnt exist, use fetch to get it.
        require('../plugman').fetch(id, plugins_dir, false, subdir, function(err, plugin_dir) {
            if (err) {
                callback(err);
            } else {
                // update ref to plugin_dir after successful fetch, via fetch callback
                runInstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, callback);
            }
        });
    } else {
        runInstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, callback);
    }
};

function runInstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, callback) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , xml_text     = fs.readFileSync(xml_path, 'utf-8')
      , plugin_et    = new et.ElementTree(et.XML(xml_text))
      , filtered_variables = {};
    var name         = plugin_et.findall('name').text;
    var plugin_id    = plugin_et._root.attrib['id'];

    // check if platform has plugin installed already.
    var platform_config = config_changes.get_platform_json(plugins_dir, platform);
    var plugin_basename = path.basename(plugin_dir);
    var is_fully_installed = false;
    Object.keys(platform_config.installed_plugins).forEach(function(installed_plugin_id) {
        if (installed_plugin_id == plugin_id) {
            is_fully_installed = true;
        }
    });
    if (is_fully_installed) {
        console.log('Plugin "' + plugin_id + '" already installed. Carry on.');
        if (callback) callback();
        return;
    }
    
    // checking preferences, if certain variables are not provided, we should throw.
    prefs = plugin_et.findall('./preference') || [];
    prefs = prefs.concat(plugin_et.findall('./platform[@name="'+platform+'"]/preference'));
    var missing_vars = [];
    prefs.forEach(function (pref) {
        var key = pref.attrib["name"].toUpperCase();
        if (cli_variables[key] == undefined)
            missing_vars.push(key)
        else
            filtered_variables[key] = cli_variables[key]
    });
    if (missing_vars.length > 0) {
        var err = new Error('Variable(s) missing: ' + missing_vars.join(", "));
        if (callback) callback(err);
        else throw err;
        return;
    }

    // Check for dependencies, (co)recurse to install each one
    var dependencies = plugin_et.findall('dependency');
    if (dependencies && dependencies.length) {
        var end = n(dependencies.length, function() {
            handleInstall(plugin_id, plugin_et, platform, project_dir, plugins_dir, plugin_basename, plugin_dir, filtered_variables, www_dir, callback);
        });
        dependencies.forEach(function(dep) {
            var dep_plugin_id = dep.attrib.id;
            var dep_subdir = dep.attrib.subdir;
            var dep_url = dep.attrib.url;
            if (dep_subdir) {
                dep_subdir = path.join.apply(null, dep_subdir.split('/'));
            }

            if (fs.existsSync(path.join(plugins_dir, dep_plugin_id))) {
                console.log('Dependent plugin ' + dep.attrib.id + ' already fetched, using that version.');
                module.exports(platform, project_dir, dep_plugin_id, plugins_dir, dep_subdir, filtered_variables, www_dir, end);
            } else {
                console.log('Dependent plugin ' + dep.attrib.id + ' not fetched, retrieving then installing.');
                module.exports(platform, project_dir, dep_url, plugins_dir, dep_subdir, filtered_variables, www_dir, end);
            }
        });
    } else {
        handleInstall(plugin_id, plugin_et, platform, project_dir, plugins_dir, plugin_basename, plugin_dir, filtered_variables, www_dir, callback);
    }
}

function handleInstall(plugin_id, plugin_et, platform, project_dir, plugins_dir, plugin_basename, plugin_dir, filtered_variables, www_dir, callback) {
    var handler = platform_modules[platform];
    www_dir = www_dir || handler.www_dir(project_dir);

    var platformTag = plugin_et.find('./platform[@name="'+platform+'"]');
    var assets = plugin_et.findall('asset');
    if (platformTag) {
        var sourceFiles = platformTag.findall('./source-file'),
            headerFiles = platformTag.findall('./header-file'),
            resourceFiles = platformTag.findall('./resource-file'),
            frameworks = platformTag.findall('./framework');
        assets = assets.concat(platformTag.findall('./asset'));

        // queue up native stuff
        sourceFiles && sourceFiles.forEach(function(source) {
            action_stack.push(action_stack.createAction(handler["source-file"].install, [source, plugin_dir, project_dir], handler["source-file"].uninstall, [source, project_dir]));
        });

        headerFiles && headerFiles.forEach(function(header) {
            action_stack.push(action_stack.createAction(handler["header-file"].install, [header, plugin_dir, project_dir], handler["header-file"].uninstall, [header, project_dir]));
        });

        resourceFiles && resourceFiles.forEach(function(resource) {
            action_stack.push(action_stack.createAction(handler["resource-file"].install, [resource, plugin_dir, project_dir], handler["resource-file"].uninstall, [resource, project_dir]));
        });

        frameworks && frameworks.forEach(function(framework) {
            action_stack.push(action_stack.createAction(handler["framework"].install, [framework, plugin_dir, project_dir], handler["framework"].uninstall, [framework, project_dir]));
        });
    }

    // queue up asset installation
    var common = require('./platforms/common');
    assets && assets.forEach(function(asset) {
        action_stack.push(action_stack.createAction(common.asset.install, [asset, plugin_dir, www_dir], common.asset.uninstall, [asset, www_dir, plugin_id]));
    });

    // run through the action stack
    action_stack.process(function(err) {
        if (err) {
            console.error(err.message, err.stack);
            console.error('Plugin installation failed :(');
        } else {
            // WIN!
            // Log out plugin INFO element contents in case additional install steps are necessary
            var info = (platformTag ? platformTag.findall('./info') : '');
            if(info.length) {
                console.log(info[0].text);
            }

            finalizeInstall(project_dir, plugins_dir, platform, plugin_basename, filtered_variables, callback);
        }
    });
}

function finalizeInstall(project_dir, plugins_dir, platform, plugin_name, variables, callback) {
    // queue up the plugin so prepare knows what to do.
    config_changes.add_installed_plugin_to_prepare_queue(plugins_dir, plugin_name, platform, variables);
    // call prepare after a successful install
    require('./../plugman').prepare(project_dir, platform, plugins_dir);

    if (callback) callback();
}

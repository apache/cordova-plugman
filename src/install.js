var path = require('path'),
    fs   = require('fs'),
    et   = require('elementtree'),
    n    = require('ncallbacks'),
    config_changes = require('./util/config-changes'),
    action_stack = require('./util/action-stack'),
    platform_modules = require('./platforms');

module.exports = function installPlugin(platform, project_dir, id, plugins_dir, subdir, cli_variables, www_dir, callback) {
    console.log('===========\n\nwww_dir = ' + www_dir + '\n\n==================');
    if (!platform_modules[platform]) {
        var err = new Error(platform + " not supported.");
        if (callback) callback(err);
        else throw err;
        return;
    }

    var current_stack = new action_stack();

    possiblyFetch(current_stack, platform, project_dir, id, plugins_dir, subdir, cli_variables, www_dir, undefined /* git_ref */, true, callback);
};

function possiblyFetch(actions, platform, project_dir, id, plugins_dir, subdir, cli_variables, www_dir, git_ref, is_top_level, callback) {
    console.log('f1');
    console.log(plugins_dir, id);
    var plugin_dir = path.join(plugins_dir, id);
    console.log('f2');

    // Check that the plugin has already been fetched.
    if (!fs.existsSync(plugin_dir)) {
        // if plugin doesnt exist, use fetch to get it.
        // TODO: Actual value for git_ref.
        require('../plugman').fetch(id, plugins_dir, false, '.', git_ref, function(err, plugin_dir) {
            if (err) {
                callback(err);
            } else {
                // update ref to plugin_dir after successful fetch, via fetch callback
                runInstall(actions, platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, is_top_level, callback);
            }
        });
    } else {
        runInstall(actions, platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, is_top_level, callback);
    }
}

function runInstall(actions, platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, is_top_level, callback) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , xml_text     = fs.readFileSync(xml_path, 'utf-8')
      , plugin_et    = new et.ElementTree(et.XML(xml_text))
      , filtered_variables = {};
    var name         = plugin_et.findall('name').text;
    var plugin_id    = plugin_et._root.attrib['id'];

    // check if platform has plugin installed already.
    var platform_config = config_changes.get_platform_json(plugins_dir, platform);
    var plugin_basename = path.basename(plugin_dir);
    var is_installed = false;
    Object.keys(platform_config.installed_plugins).forEach(function(installed_plugin_id) {
        if (installed_plugin_id == plugin_id) {
            is_installed = true;
        }
    });
    Object.keys(platform_config.dependent_plugins).forEach(function(installed_plugin_id) {
        if (installed_plugin_id == plugin_id) {
            is_installed = true;
        }
    });
    if (is_installed) {
        console.log('Plugin "' + plugin_id + '" already installed, \'sall good.');
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
            handleInstall(actions, plugin_id, plugin_et, platform, project_dir, plugins_dir, plugin_basename, plugin_dir, filtered_variables, www_dir, is_top_level, callback);
        });
        dependencies.forEach(function(dep) {
            var dep_plugin_id = dep.attrib.id;
            var dep_subdir = dep.attrib.subdir;
            var dep_url = dep.attrib.url;
            var dep_git_ref = dep.attrib.commit;
            if (dep_subdir) {
                dep_subdir = path.join.apply(null, dep_subdir.split('/'));
            }
            var dep_plugin_dir = path.join(plugins_dir, dep_plugin_id);
            if (fs.existsSync(dep_plugin_dir)) {
                console.log('Dependent plugin ' + dep_plugin_id + ' already fetched, using that version.');
                runInstall(actions, platform, project_dir, dep_plugin_dir, plugins_dir, filtered_variables, www_dir, false, end);
            } else {
                console.log('Dependent plugin ' + dep_plugin_id + ' not fetched, retrieving then installing.');
                try {
                    possiblyFetch(actions, platform, project_dir, dep_url, plugins_dir, dep_subdir, filtered_variables, www_dir, dep_git_ref, false, end);
                } catch (e) {
                    console.log(e);
                }
            }
        });
    } else {
        handleInstall(actions, plugin_id, plugin_et, platform, project_dir, plugins_dir, plugin_basename, plugin_dir, filtered_variables, www_dir, is_top_level, callback);
    }
}

function handleInstall(actions, plugin_id, plugin_et, platform, project_dir, plugins_dir, plugin_basename, plugin_dir, filtered_variables, www_dir, is_top_level, callback) {
    var handler = platform_modules[platform];
    www_dir = www_dir || handler.www_dir(project_dir);

    var platformTag = plugin_et.find('./platform[@name="'+platform+'"]');
    var assets = plugin_et.findall('asset');
    if (platformTag) {
        var sourceFiles = platformTag.findall('./source-file'),
            headerFiles = platformTag.findall('./header-file'),
            resourceFiles = platformTag.findall('./resource-file'),
            libFiles = platformTag.findall('./lib-file'),
            frameworks = platformTag.findall('./framework');
        assets = assets.concat(platformTag.findall('./asset'));

        // queue up native stuff
        sourceFiles && sourceFiles.forEach(function(source) {
            actions.push(actions.createAction(handler["source-file"].install, [source, plugin_dir, project_dir, plugin_id], handler["source-file"].uninstall, [source, project_dir, plugin_id]));
        });

        headerFiles && headerFiles.forEach(function(header) {
            actions.push(actions.createAction(handler["header-file"].install, [header, plugin_dir, project_dir, plugin_id], handler["header-file"].uninstall, [header, project_dir, plugin_id]));
        });

        resourceFiles && resourceFiles.forEach(function(resource) {
            actions.push(actions.createAction(handler["resource-file"].install, [resource, plugin_dir, project_dir], handler["resource-file"].uninstall, [resource, project_dir]));
        });

        frameworks && frameworks.forEach(function(framework) {
            actions.push(actions.createAction(handler["framework"].install, [framework, plugin_dir, project_dir], handler["framework"].uninstall, [framework, project_dir]));
        });

        libFiles && libFiles.forEach(function(lib) {
            actions.push(actions.createAction(handler["lib-file"].install, [lib, plugin_dir, project_dir], handler["lib-file"].uninstall, [lib, project_dir]));
        });
    }

    // queue up asset installation
    var common = require('./platforms/common');
    assets && assets.forEach(function(asset) {
        actions.push(actions.createAction(common.asset.install, [asset, plugin_dir, www_dir], common.asset.uninstall, [asset, www_dir, plugin_id]));
    });

    // run through the action stack
    actions.process(platform, project_dir, function(err) {
        if (err) {
            if (callback) callback(err);
            else throw err;
        } else {
            // WIN!
            // Log out plugin INFO element contents in case additional install steps are necessary
            var info = (platformTag ? platformTag.findall('./info') : '');
            if(info.length) {
                console.log(info[0].text);
            }

            // queue up the plugin so prepare knows what to do.
            config_changes.add_installed_plugin_to_prepare_queue(plugins_dir, plugin_basename, platform, filtered_variables, is_top_level);
            // call prepare after a successful install
            require('./../plugman').prepare(project_dir, platform, plugins_dir);

            console.log(plugin_id + ' installed.');
            if (callback) callback();
        }
    });
}

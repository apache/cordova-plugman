var path = require('path'),
    fs   = require('fs'),
    et   = require('elementtree'),
    config_changes = require('./util/config-changes');
    platform_modules = require('./platforms');

// TODO: is name necessary as a param ehre?
module.exports = function installPlugin(platform, project_dir, name, plugins_dir, cli_variables, www_dir, callback) {
    if (!platform_modules[platform]) {
        var err = new Error(platform + " not supported.");
        if (callback) {
            callback(err);
            return;
        }
        else throw err;
    }

    var plugin_dir = path.join(plugins_dir, name);

    // Check that the plugin has already been fetched.
    if (!fs.existsSync(plugin_dir)) {
        // if plugin doesnt exist, use fetch to get it.
        require('../plugman').fetch(name, plugins_dir, false, '.', function(err, plugin_dir) {
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

    // check if platform has plugin fully installed or queued already.
    var platform_config = config_changes.get_platform_json(plugins_dir, platform);
    var plugin_basename = path.basename(plugin_dir);
    if (platform_config.prepare_queue.installed.indexOf(plugin_basename) > -1) {
        var err = new Error('plugin "' + plugin_basename + '" is already installed (but needs to be prepared)');
        if (callback) callback(err);
        else throw err;
        return;
    }
    var is_fully_installed = false;
    Object.keys(platform_config.installed_plugins).forEach(function(installed_plugin_id) {
        if (installed_plugin_id == plugin_id) {
            is_fully_installed = true;
        }
    });
    if (is_fully_installed) {
        var err = new Error('plugin "' + plugin_basename + '" (id: '+plugin_id+') is already installed');
        if (callback) callback(err);
        else throw err;
        return;
    }
    // TODO: if plugin does not have platform tag but has platform-agnostic config changes, should we queue it up?
    var platformTag = plugin_et.find('./platform[@name="'+platform+'"]');
    if (!platformTag) {
        // Either this plugin doesn't support this platform, or it's a JS-only plugin.
        // Either way, return now.
        // should call prepare probably!
        finalizeInstall(project_dir, plugins_dir, platform, plugin_basename, filtered_variables, callback);
        return;
    }

    // parse plugin.xml into transactions
    var handler = platform_modules[platform];
    var txs = [];
    var sourceFiles = platformTag.findall('./source-file'),
        headerFiles = platformTag.findall('./header-file'),
        resourceFiles = platformTag.findall('./resource-file'),
        assets = platformTag.findall('./asset'),
        frameworks = platformTag.findall('./framework');

    assets = assets.concat(plugin_et.findall('./asset'));

    // asset installation
    var installedAssets = [];
    var common = require('./platforms/common');
    www_dir = www_dir || handler.www_dir(project_dir);
    try {
        for(var i = 0, j = assets.length ; i < j ; i++) {
            var src = assets[i].attrib['src'],
                target = assets[i].attrib['target'];
            common.copyFile(plugin_dir, src, www_dir, target);
            installedAssets.push(assets[i]);
        }
    } catch(err) {
        var issue = 'asset installation failed\n'+err.stack+'\n';
        try {
            // removing assets and reverting install
            for(var i = 0, j = installedAssets.length ; i < j ; i++) {
               common.removeFile(www_dir, installedAssets[i].attrib.target);
            }
            common.removeFileF(path.resolve(www_dir, 'plugins', plugin_id));
            issue += 'but successfully reverted\n';
        } catch(err2) {
            issue += 'and reversion failed :(\n' + err2.stack;
        }
        var error = new Error(issue);
        if (callback) callback(error);
        else throw error;
    }
    txs = txs.concat(sourceFiles, headerFiles, resourceFiles, frameworks);
    // pass platform-specific transactions into install
    handler.install(txs, plugin_id, project_dir, plugin_dir, filtered_variables, function(err) {
        if (err) {
            // FAIL
            var issue = '';
            try {
                for(var i = 0, j = installedAssets.length ; i < j ; i++) {
                   common.removeFile(www_dir, installedAssets[i].attrib.target);
                }
                common.removeFileF(path.resolve(www_dir, 'plugins', plugin_id));
            } catch(err2) {
                issue += 'Could not revert assets' + err2.stack + '\n';
            }
            if (err.transactions) {
                handler.uninstall(err.transactions.executed, plugin_id, project_dir, plugin_dir, function(superr) {

                    if (superr) {
                        // Even reversion failed. super fail.
                        issue += 'Install failed, then reversion of installation failed. Sorry :(. Instalation issue: ' + err.stack + ', reversion issue: ' + superr.stack;
                    } else {
                        issue += 'Install failed, plugin reversion successful so you should be good to go. Installation issue: ' + err.stack;
                    }
                    var error = new Error(issue);
                    if (callback) callback(error);
                    else throw error;
                });
            } else {
                if (callback) callback(err);
                else throw err;
            }
        } else {

            // WIN!
            // Log out plugin INFO element contents in case additional install steps are necessary
            var info = platformTag.findall('./info');
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

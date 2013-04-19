var path = require('path'),
    fs   = require('fs'),
    et   = require('elementtree'),
    platform_modules = require('./platforms');

function runInstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, callback) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , xml_text     = fs.readFileSync(xml_path, 'utf-8')
      , plugin_et    = new et.ElementTree(et.XML(xml_text))
      , filtered_variables = {}
      , info;

    // checking preferences
    prefs = plugin_et.findall('./preference') || [];
    prefs = prefs.concat(plugin_et.findall('./platform[@name="'+platform+'"]/preference'));
    var missing_vars = [];
    prefs.forEach(function (pref) {
        var key = pref.attrib["name"].toUpperCase();
        if (cli_variables[key] == undefined)
            missing_vars.push(key)
        else
            filtered_variables[key] = cli_variables[key]
    })
    if (missing_vars.length > 0) {
        var err = new Error('Variable(s) missing: ' + missing_vars.join(", "));
        if (callback) {
            callback(err);
            return;
        }
        else throw err;
    }

    // Log out plugin INFO element contents in case additional install steps are necessary
    if((info = plugin_et.find('./platform[@name="'+platform+'"]/info'))) {
        console.log(info.text);
    }

    // run the platform-specific function
    try {
        platform_modules[platform].handleInstall(project_dir, plugin_dir, plugin_et, filtered_variables);
        require('./../plugman').prepare(project_dir, platform, plugins_dir);
        if (callback) callback();
    } catch(e) {
        var err;
        try {
            platform_modules[platform].forceUninstall(project_dir, plugin_dir, plugin_et, filtered_variables);
            err = new Error('Error during installation of plugin, reverted all changes. Install error: ' + e.message + '\n' + e.stack + '\n----');
        } catch(etwo) {
            err = new Error('Error during installation of plugin, reverting changes also caused issues! Reversion probably incomplete. Install error: ' + e.message + '\n' + e.stack + ', reversion error: ' + etwo.message + '\n' + etwo.stack + '\n----');
        }
        if (callback) callback(err);
        else throw err;
    }
}

module.exports = function installPlugin(platform, project_dir, name, plugins_dir, cli_variables, callback) {
    if (!platform_modules[platform]) {
        var err = new Error(platform + " not supported.");
        if (callback) { 
            callback(err);
            return;
        }
        else throw err;
    }

    var plugin_dir = path.join(plugins_dir, name);
    var plugin_xml_path = path.join(plugin_dir, 'plugin.xml');

    // Check that the plugin has already been fetched.
    if (!fs.existsSync(plugin_dir) || !fs.existsSync(plugin_xml_path)) {
        // try querying the plugin database
        plugins.getPluginInfo(plugin_dir,
            function(err, plugin_info) {
                if (err) {
                    var err_obj = new Error('install failed. plugin.xml at "' + plugin_xml_path + '" not found and couldnt query remote server for information about the plugin because ' + err.message);
                    if (callback) callback(err_obj);
                    else throw err_obj;
                } else {
                    plugins.clonePluginGitRepo(plugin_info.url, plugins_dir, function(err, plugin_dir) {
                        if (err) {
                            var err_obj = new Error('install failed. plugin.xml at "' + plugin_xml_path + '" not found and couldnt clone plugin repo because ' + err.message);
                            if (callback) callback(err_obj);
                            else throw err_obj;
                        } else {
                            runInstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, callback);
                        }
                    });
                }
            }
        );
    } else {
        runInstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, callback);
    }
};

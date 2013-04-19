var path = require('path'),
    fs   = require('fs'),
    platform_modules = require('./platforms');

function runUninstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, callback) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , xml_text     = fs.readFileSync(xml_path, 'utf-8')
      , plugin_et    = new et.ElementTree(et.XML(xml_text))

    // run the platform-specific function
    try {
        platform_modules[platform].handleUninstall(project_dir, plugin_dir, plugin_et);
        require('./../plugman').prepare(project_dir, platform, plugins_dir);
        if (callback) callback();
    } catch(e) {
        var err;
        try {
            platform_modules[platform].forceInstall(project_dir, plugin_dir, plugin_et, {});
            err = new Error('Error during uninstallation of plugin, reverted all changes. Uninstall error: ' + e.message);
        } catch(etwo) {
            err = new Error('Error during uninstallation of plugin, reverting changes also caused issues! Reversion probably incomplete. Uninstall error: ' + e.message + ', reversion error: ' + etwo.message);
        }
        if (callback) callback(err);
        else throw err;
    }
}

module.exports = function uninstallPlugin(platform, project_dir, name, plugins_dir, cli_variables, callback) {
    if (!platform_modules[platform]) {
        var err = new Error(platform + " not supported.");
        if (callback) {
            callback(err);
            return;
        }
        else throw err;
    }

    // Check that the plugin has already been fetched.
    var plugin_dir = path.join(plugins_dir, name);
    var plugin_xml_path = path.join(plugin_dir, 'plugin.xml');

    if (!fs.existsSync(plugin_dir)) {
        var err = new Error('Plugin ' + name + ' not found. Already uninstalled?');
        if (callback) {
            callback(err);
            return;
        }
        else throw err;
    }

    if (!fs.existsSync(plugin_xml_path)) {
        // try querying the plugin database
        plugins.getPluginInfo(plugin_dir,
            function(err, plugin_info) {
                if (err) {
                    var err_obj = new Error('uninstall failed. plugin.xml at "' + plugin_xml_path + '" not found and couldnt query remote server for information about the plugin because ' + err.message);
                    if (callback) callback(err_obj);
                    else throw err_obj;
                } else {
                    plugins.clonePluginGitRepo(plugin_info.url, plugins_dir, function(err, plugin_dir) {
                        if (err) {
                            var err_obj = new Error('uninstall failed. plugin.xml at "' + plugin_xml_path + '" not found and couldnt clone plugin repo because ' + err.message);
                            if (callback) callback(err_obj);
                            else throw err_obj;
                        } else {
                            runUninstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, callback);
                        }
                    });
                }
            }
        );
    } else {
        runUninstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, callback);
    }
};

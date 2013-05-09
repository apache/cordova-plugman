var path = require('path'),
    fs   = require('fs'),
    et   = require('elementtree'),
    config_changes = require('./util/config-changes'),
    platform_modules = require('./platforms');

module.exports = function uninstallPlugin(platform, project_dir, name, plugins_dir, cli_variables, www_dir, callback) {
    if (!platform_modules[platform]) {
        var err = new Error(platform + " not supported.");
        if (callback) callback(err);
        else throw err;
        return;
    }

    // Check that the plugin has already been fetched.
    var plugin_dir = path.join(plugins_dir, name);

    if (!fs.existsSync(plugin_dir)) {
        var err = new Error('Plugin "' + name + '" not found. Already uninstalled?');
        if (callback) callback(err);
        else throw err;
        return;
    }

    runUninstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, callback);
};

function runUninstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, www_dir, callback) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , xml_text     = fs.readFileSync(xml_path, 'utf-8')
      , plugin_et    = new et.ElementTree(et.XML(xml_text))
    var name         = plugin_et.findall('name').text;
    var plugin_id    = plugin_et._root.attrib['id'];

    var platformTag = plugin_et.find('./platform[@name="'+platform+'"]');
    if (!platformTag) {
        // Either this plugin doesn't support this platform, or it's a JS-only plugin.
        // Either way, return now.
        // should call prepare probably!
        require('./../plugman').prepare(project_dir, platform, plugins_dir);
        if (callback) callback();
        return;
    }

    var platform_modules = require('./platforms');
    // parse plugin.xml into transactions
    var handler = platform_modules[platform];
    var txs = [];
    var sourceFiles = platformTag.findall('./source-file'),
        headerFiles = platformTag.findall('./header-file'),
        resourceFiles = platformTag.findall('./resource-file'),
        assets = platformTag.findall('./asset'),
        frameworks = platformTag.findall('./framework');
    assets = assets.concat(plugin_et.findall('./asset'));
    www_dir = www_dir || handler.www_dir(project_dir);

    // asset uninstallation
    var uninstalledAssets = [];
    var common = require('./platforms/common');
    try {
        for(var i = 0, j = assets.length ; i < j ; i++) {
            common.removeFile(www_dir, assets[i].attrib['target']);
            uninstalledAssets.push(assets[i]);
        }
        common.removeFileF(path.resolve(www_dir, 'plugins', plugin_id));
    } catch(err) {
        var issue = 'asset uninstallation failed\n'+err.stack+'\n';
        try {
            // adding assets back
            for(var i = 0, j = uninstalledAssets.length ; i < j ; i++) {
               var src = uninstalledAssets[i].attrib['src'],
                   target = uninstalledAssets[i].attrib['target'];
               common.copyFile(plugin_dir, src, www_dir, target);
            }
            issue += 'but successfully reverted\n';
        } catch(err2) {
            issue += 'and reversion failed :(\n' + err2.stack;
        }
        var error = new Error(issue);
        if (callback) callback(error);
        else throw error;
    }
    
    txs = txs.concat(sourceFiles, headerFiles, resourceFiles, frameworks);
    
    // pass platform-specific transactions into uninstall
    handler.uninstall(txs, plugin_id, project_dir, plugin_dir, function(err) {
        if (err) {
            // FAIL
            var issue = '';
            try {
                for(var i = 0, j = uninstalledAssets.length ; i < j ; i++) {
                    var src = uninstalledAssets[i].attrib['src'],
                           target = uninstalledAssets[i].attrib['target'];
                    common.copyFile(plugin_dir, src, www_dir, target);
                }
            } catch(err2) {
                issue += 'Could not revert assets' + err2.stack + '\n';
            }
            if (err. transactions) {
                handler.install(err.transactions.executed, plugin_id, project_dir, plugin_dir, cli_variables, function(superr) {
                    if (superr) {
                        // Even reversion failed. super fail.
                        issue += 'Uninstall failed, then reversion of uninstallation failed. Sorry :(. Uninstalation issue: ' + err.stack + ', reversion issue: ' + superr.stack;
                    } else {
                        issue += 'Uninstall failed, plugin reversion successful so you should be good to go. Uninstallation issue: ' + err.stack;
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
            // queue up the plugin so prepare can remove the config changes
            config_changes.add_uninstalled_plugin_to_prepare_queue(plugins_dir, path.basename(plugin_dir), platform);
            // call prepare after a successful uninstall
            require('./../plugman').prepare(project_dir, platform, plugins_dir);
            if (callback) callback();
        }
    });
}

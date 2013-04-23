var path = require('path'),
    fs   = require('fs'),
    et   = require('elementtree'),
    platform_modules = require('./platforms');

// TODO: is name necessary as a param ehre?
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

    // Check that the plugin has already been fetched.
    if (!fs.existsSync(plugin_dir)) {
        // if plugin doesnt exist, use fetch to get it.
        require('../plugman').fetch(name, plugins_dir, false, function(err) {
            if (err) {
                callback(err);
            } else {
                runInstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, callback);
            }
        });
    } else {
        runInstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, callback);
    }
};

function runInstall(platform, project_dir, plugin_dir, plugins_dir, cli_variables, callback) {
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
    })
    if (missing_vars.length > 0) {
        var err = new Error('Variable(s) missing: ' + missing_vars.join(", "));
        if (callback) {
            callback(err);
            return;
        }
        else throw err;
    }

    var platformTag = plugin_et.find('./platform[@name="'+platform+'"]');
    if (!platformTag) {
        // Either this plugin doesn't support this platform, or it's a JS-only plugin.
        // Either way, return now.
        if (callback) callback();
        return;
    }
    var handler = platform_modules[platform];

    // TODO: check if platform has plugin installed already.

    // parse plugin.xml into transactions
    var txs = [];
    var sourceFiles = platformTag.findall('./source-file'),
        headerFiles = platformTag.findall('./header-file'),
        resourceFiles = platformTag.findall('./resource-file'),
        assets = platformTag.findall('./asset'),
        frameworks = platformTag.findall('./framework'),
        pluginsPlist = platformTag.findall('./plugins-plist'),
        configChanges = platformTag.findall('./config-file');

    assets = assets.concat(plugin_et.findall('./asset'));

    txs = txs.concat(sourceFiles, headerFiles, resourceFiles, frameworks, configChanges, assets, pluginsPlist);

    // pass platform-specific transactions into install
    handler.install(txs, plugin_id, project_dir, plugin_dir, filtered_variables, function(err) {
        if (err) {
            // FAIL
            if (err. transactions) {
                handler.uninstall(err.transactions.executed, plugin_id, project_dir, plugin_dir, function(superr) {
                    var issue = '';
                    if (superr) {
                        // Even reversion failed. super fail.
                        issue = 'Install failed, then reversion of installation failed. Sorry :(. Instalation issue: ' + err.message + ', reversion issue: ' + superr.message;
                    } else {
                        issue = 'Install failed, plugin reversion successful so you should be good to go. Installation issue: ' + err.message;
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
            // call prepare after a successful install
            require('./../plugman').prepare(project_dir, platform, plugins_dir);

            // Log out plugin INFO element contents in case additional install steps are necessary
            var info = platformTag.findall('./info');
            if(info.length) {
                console.log(info[0].text);
            }
            if (callback) callback();
        }
    });
}

var install = require('../install'),
    fetch   = require('../fetch'),
    path    = require('path'),
    fs      = require('fs'),
    xml_helpers = require('./xml-helpers');

exports.installAll = function(platform, project_dir, name, plugins_dir, cli_variables, www_dir, callback) {
    // It should have been fetched already, so read the plugin.xml from plugin_dir
    var plugin_dir = path.join(plugins_dir, name);
    var xml = xml_helpers.parseElementtreeSync(path.join(plugin_dir, 'plugin.xml'));

    var dependencies = xml.findall('dependency');

    if (!dependencies || dependencies.length == 0) {
        return;
    }

    function waitForAll(n) {
        var count = n;
        var errs = [];
        return function(err) {
            count--;
            if (err) {
                throw err;
            }
            if (count == 0) {
                callback();
            }
        };
    }

    var dependencyCallback = waitForAll(dependencies.length);

    dependencies && dependencies.forEach(function(dep) {
        function doInstall(plugin_dir) {
            // Call installation for this plugin after it gets fetched.
            install(platform, project_dir, path.basename(plugin_dir), plugins_dir, cli_variables, www_dir, dependencyCallback);
        }

        // Check if this dependency is already there.
        if (fs.existsSync(path.join(plugins_dir, dep.attrib.id))) {
            console.log('Plugin ' + dep.attrib.id + ' already fetched, using that version.');
            doInstall(path.join(plugins_dir, dep.attrib.id));
        } else {
            // Fetch it.
            var subdir = dep.attrib.subdir;
            if (subdir) {
                subdir = path.join.apply(null, dep.attrib.subdir.split('/'));
            }

            console.log('Fetching dependency ' + dep.attrib.id);
            fetch(dep.attrib.url, plugins_dir, false /* no link */, subdir, doInstall);
        }
    });
};


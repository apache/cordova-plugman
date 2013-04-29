var shell   = require('shelljs'),
    fs      = require('fs'),
    plugins = require('./util/plugins'),
    path    = require('path');

module.exports = function fetchPlugin(plugin_dir, plugins_dir, link, callback) {
    // Ensure the containing directory exists.
    shell.mkdir('-p', plugins_dir);

    // clone from git repository
    if(plugin_dir.indexOf('https://') == 0 || plugin_dir.indexOf('git://') == 0) {
        if (link) {
            var err = new Error('--link is not supported for git URLs');
            if (callback) callback(err);
            else throw err;
        } else {
            plugins.clonePluginGitRepo(plugin_dir, plugins_dir, callback);
        }
    } else if(!fs.existsSync(plugin_dir)) {
        if (link) {
            var err = new Error('--link is not supported for name installations');
            if (callback) callback(err);
            else throw err;
        } else {
            plugins.getPluginInfo(plugin_dir, function(err, plugin_info) {
                plugins.clonePluginGitRepo(plugin_info.url, plugins_dir, callback);
            });
        }
    } else {
        // Copy from the local filesystem.
        var dest = path.join(plugins_dir, path.basename(plugin_dir));

        shell.rm('-rf', dest);
        if (link) {
            fs.symlinkSync(path.resolve(plugin_dir), dest, 'dir');
        } else {
            //  XXX if you don't path.resolve(plugin_dir) and plugin_dir has a trailing slash shelljs shits itself.
            shell.cp('-R', path.resolve(plugin_dir), plugins_dir); // Yes, not dest.
        }

        if (callback) callback(null, dest);
    }
};

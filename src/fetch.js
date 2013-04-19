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
            throw new Error('--link is not supported for git URLs');
        }
        plugins.clonePluginGitRepo(plugin_dir, plugins_dir, callback);
    } else { // Copy from the local filesystem.
        var dest = path.join(plugins_dir, path.basename(dest));

        shell.rm('-rf', dest);
        if (link) {
            fs.symlinkSync(path.resolve(plugin_dir), dest, 'dir');
        } else {
            shell.cp('-R', plugin_dir, plugins_dir); // Yes, not dest.
        }

        plugin_dir = dest;
        if (callback) callback(null);
    }
};

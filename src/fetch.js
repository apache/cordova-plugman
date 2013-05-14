var shell   = require('shelljs'),
    fs      = require('fs'),
    plugins = require('./util/plugins'),
    xml_helpers = require('./util/xml-helpers'),
    path    = require('path');

module.exports = function fetchPlugin(plugin_dir, plugins_dir, link, subdir, callback) {
    // Ensure the containing directory exists.
    shell.mkdir('-p', plugins_dir);

    subdir = subdir || '.';

    // clone from git repository
    if(plugin_dir.indexOf('https://') == 0 || plugin_dir.indexOf('git://') == 0) {
        if (link) {
            var err = new Error('--link is not supported for git URLs');
            if (callback) callback(err);
            else throw err;
        } else {
            plugins.clonePluginGitRepo(plugin_dir, plugins_dir, subdir, callback);
        }
    } else {
        // Copy from the local filesystem.
        // First, read the plugin.xml and grab the ID.
        plugin_dir = path.join(plugin_dir, subdir);
        var xml = xml_helpers.parseElementtreeSync(path.join(plugin_dir, 'plugin.xml'));
        var plugin_id = xml.getroot().attrib.id;

        var dest = path.join(plugins_dir, plugin_id);

        shell.rm('-rf', dest);
        if (link) {
            fs.symlinkSync(plugin_dir, dest, 'dir');
        } else {
            shell.mkdir('-p', dest);
            shell.cp('-R', path.join(plugin_dir, '*') , dest);
        }

        if (callback) callback(null, dest);
    }
};

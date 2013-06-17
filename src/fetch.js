var shell   = require('shelljs'),
    fs      = require('fs'),
    plugins = require('./util/plugins'),
    xml_helpers = require('./util/xml-helpers'),
    metadata = require('./util/metadata'),
    path    = require('path'),
    registry    = require('plugman-registry');

// possible options: link, subdir, git_ref
module.exports = function fetchPlugin(plugin_dir, plugins_dir, options, callback) {
    // Ensure the containing directory exists.
    shell.mkdir('-p', plugins_dir);

    options = options || {};
    options.subdir = options.subdir || '.';

    // clone from git repository
    if(plugin_dir.indexOf('https://') == 0 || plugin_dir.indexOf('git://') == 0) {
        if (options.link) {
            var err = new Error('--link is not supported for git URLs');
            if (callback) callback(err);
            else throw err;
        } else {
            var data = {
                source: {
                    type: 'git',
                    url:  plugin_dir,
                    subdir: options.subdir,
                    ref: options.git_ref
                }
            };

            plugins.clonePluginGitRepo(plugin_dir, plugins_dir, options.subdir, options.git_ref, function(err, dir) {
                if (!err) {
                    metadata.save_fetch_metadata(dir, data);
                    if (callback) callback(null, dir);
                }
            });
        }
    } else {
        if (plugin_dir.lastIndexOf('file://', 0) === 0) {
            plugin_dir = plugin_dir.substring('file://'.length);
        }

        // Copy from the local filesystem.
        // First, read the plugin.xml and grab the ID.
        plugin_dir = path.join(plugin_dir, options.subdir);

        var movePlugin = function(plugin_dir, linkable) {
          var xml = xml_helpers.parseElementtreeSync(path.join(plugin_dir, 'plugin.xml'));
          var plugin_id = xml.getroot().attrib.id;

          var dest = path.join(plugins_dir, plugin_id);

          shell.rm('-rf', dest);
          if (options.link && linkable) {
              fs.symlinkSync(plugin_dir, dest, 'dir');
          } else {
              shell.mkdir('-p', dest);
              shell.cp('-R', path.join(plugin_dir, '*') , dest);
          }

          var data = {
              source: {
                  type: 'local',
                  path: plugin_dir
              }
          };
          metadata.save_fetch_metadata(dest, data);

          if (callback) callback(null, dest);

        };

        
        if(!fs.existsSync(plugin_dir)) {
          registry.use(null, function() {
            registry.fetch(plugin_dir, function(err, plugin_dir) {
              movePlugin(plugin_dir, false);
            });
          })
        } else {
          movePlugin(plugin_dir, true);
        }
    }
};

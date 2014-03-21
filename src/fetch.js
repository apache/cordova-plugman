var shell   = require('shelljs'),
    fs      = require('fs'),
    url     = require('url'),
    plugins = require('./util/plugins'),
    xml_helpers = require('./util/xml-helpers'),
    metadata = require('./util/metadata'),
    path    = require('path'),
    Q       = require('q'),
    registry = require('./registry/registry');
// XXX: leave the require('../plugman') because jasmine shits itself if you declare it up top
// possible options: link, subdir, git_ref, client, expected_id
// Returns a promise.
module.exports = function fetchPlugin(plugin_src, plugins_dir, options) {
    // Ensure the containing directory exists.
    shell.mkdir('-p', plugins_dir);

    options = options || {};
    options.subdir = options.subdir || '.';
    options.searchpath = options.searchpath || [];
    if ( typeof options.searchpath === 'string' ) {
        options.searchpath = options.searchpath.split(path.delimiter);
    }

    // clone from git repository
    var uri = url.parse(plugin_src);

    // If the hash exists, it has the form from npm: http://foo.com/bar#git-ref[:subdir]
    // NB: No leading or trailing slash on the subdir.
    if (uri.hash) {
        var result = uri.hash.match(/^#([^:]*)(?::\/?(.*?)\/?)?$/);
        if (result) {
            if (result[1])
                options.git_ref = result[1];
            if(result[2])
                options.subdir = result[2];

            // Recurse and exit with the new options and truncated URL.
            var new_dir = plugin_src.substring(0, plugin_src.indexOf('#'));
            return fetchPlugin(new_dir, plugins_dir, options);
        }
    }

    // If it looks like a network URL, git clone it.
    if ( uri.protocol && uri.protocol != 'file:' && uri.protocol != 'c:' && !plugin_src.match(/^\w+:\\/)) {
        require('../plugman').emit('log', 'Fetching plugin "' + plugin_src + '" via git clone');
        if (options.link) {
            return Q.reject(new Error('--link is not supported for git URLs'));
        } else {
            var data = {
                source: {
                    type: 'git',
                    url:  plugin_src,
                    subdir: options.subdir,
                    ref: options.git_ref
                }
            };

            return plugins.clonePluginGit(plugin_src, plugins_dir, options)
            .then(function(dir) {
                return checkID(options.expected_id, dir);
            })
            .then(function(dir) {
                metadata.save_fetch_metadata(dir, data);
                return dir;
            });
        }
    } else {
        // If it's not a network URL, it's either a local path or a plugin ID.

        var p,  // The Q promise to be returned.
            linkable = true,
            plugin_dir = path.join(plugin_src, options.subdir);

        if (fs.existsSync(plugin_dir)) {
            p = Q(plugin_dir);
        } else {
            // If there is no such local path, it's a plugin id.
            // First look for it in the local search path (if provided).
            var local_dir = findLocalPlugin(plugin_src, options.searchpath);
            if (local_dir) {
                p = Q(local_dir);
                require('../plugman').emit('verbose', 'Found ' + plugin_src + ' at ' + local_dir);
            } else {
                // If not found in local search path, fetch from the registry.
                linkable = false;
                require('../plugman').emit('log', 'Fetching plugin "' + plugin_src + '" via plugin registry');
                p = registry.fetch([plugin_src], options.client);
            }
        }

        return p
        .then(function(dir) {
                options.plugin_src_dir = dir;

                return copyPlugin(dir, plugins_dir, options.link && linkable);
            })
        .then(function(dir) {
                return checkID(options.expected_id, dir);
            });
    }
};

function readId(dir) {
    var xml_path = path.join(dir, 'plugin.xml');
    var et = xml_helpers.parseElementtreeSync(path.join(dir, 'plugin.xml'));
    var plugin_id = et.getroot().attrib.id;
    return plugin_id;
}

// Helper function for checking expected plugin IDs against reality.
function checkID(expected_id, dir) {
    if ( expected_id ) {
        var id = readId(dir);
        if (expected_id != id) {
            throw new Error('Expected fetched plugin to have ID "' + expected_id + '" but got "' + id + '".');
        }
    }
    return dir;
}

var idCache = Object.create(null);
// Look for plugin in local search path.
function findLocalPlugin(plugin_id, searchpath) {
    function tryPath(p) {
        if (!(p in idCache)) {
            var id = null;
            if (fs.existsSync(path.join(p, 'plugin.xml'))) {
                id = readId(p);
            }
            idCache[p] = id;
        }
        return (plugin_id === idCache[p]);
    }

    for (var i = 0; i < searchpath.length; i++) {
        // Allow search path to point right to a plugin.
        if (tryPath(searchpath[i])) {
            return searchpath[i];
        }
        var files = fs.readdirSync(searchpath[i]);
        for (var j = 0; j < files.length; j++) {
            var pluginPath = path.join(searchpath[i], files[j]);
            if (tryPath(pluginPath)) {
                return pluginPath;
            }
        }
    }
    return null;
}


// Copy or link a plugin from plugin_dir to plugins_dir/plugin_id.
function copyPlugin(plugin_dir, plugins_dir, link) {
    var plugin_id = readId(plugin_dir);
    var dest = path.join(plugins_dir, plugin_id);
    shell.rm('-rf', dest);
    if (link) {
        require('../plugman').emit('verbose', 'Linking plugin "' + plugin_dir + '" => "' + dest + '"');
        fs.symlinkSync(plugin_dir, dest, 'dir');
    } else {
        shell.mkdir('-p', dest);
        require('../plugman').emit('verbose', 'Copying plugin "' + plugin_dir + '" => "' + dest + '"');
        shell.cp('-R', path.join(plugin_dir, '*') , dest);
    }

    var data = {
        source: {
        type: 'local',
              path: plugin_dir
        }
    };
    metadata.save_fetch_metadata(dest, data);
    return dest;
}

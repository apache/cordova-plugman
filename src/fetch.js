var shell   = require('shelljs'),
    fs      = require('fs'),
    url     = require('url'),
    plugins = require('./util/plugins'),
    xml_helpers = require('./util/xml-helpers'),
    metadata = require('./util/metadata'),
    path    = require('path'),
    Q       = require('q'),
    events  = require('../plugman'),
    registry = require('./registry/registry');

// possible options: link, subdir, git_ref, client, expected_id
// Returns a promise with source directory of plugin.
module.exports = function fetchPlugin(plugin_src, plugins_dir, options) {

    options = options || {};
    options.subdir = options.subdir || '.';
    options.searchpath = options.searchpath || [];
    if ( typeof options.searchpath === 'string' ) {
        options.searchpath = [ options.searchpath ];
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
    if ( uri.protocol && uri.protocol != 'file:' && !plugin_src.match(/^\w+:\\/)) {
        events.emit('log', 'Fetching plugin "' + plugin_src + '" via git clone');
        if (options.link) {
            return Q.reject(new Error('--link is not supported for git URLs'));
        }

        var meta = {
            source: {
                type: 'git',
                url:  plugin_src,
                subdir: options.subdir,
                ref: options.git_ref
            }
        };

        return plugins.clonePluginGitRepo(plugin_src, plugins_dir, options.subdir, options.git_ref)
        .then(
            function(tmp_dir) { return checkID(options.expected_id, tmp_dir); }
        ).then(
            function(tmp_dir) { metadata.save_fetch_metadata(tmp_dir, meta); return tmp_dir; }
        );

    } else {
        // If it's not a network URL, it's either a local path or a plugin ID.

        // NOTE: Can't use uri.href here as it will convert spaces to %20 and make path invalid.
        // Use original plugin_src value instead.

        var p,  // The Q promise to be returned.
            local_dir = path.resolve(plugin_src, options.subdir),
            meta = {
                source: {
                    type: 'local',
                    path: '',
                }
            };

        if ( fs.existsSync(local_dir) ) {
            p = Q(local_dir);
            meta.source.path = local_dir;

        } else {
            // If there is no such local path, it's a plugin id.
            // First look for it in the local search path (if provided).
            local_dir = findLocalPlugin(plugin_src, options.searchpath);
            if (local_dir) {
                p = Q(local_dir);
                events.emit('log', 'Found plugin "' + plugin_src + '" at: ' + local_dir);
                meta.source.path = local_dir;

            } else {

                if (options.link) {
                    return Q.reject(new Error('--link is not supported for remote fetching '+ plugin_src));
                }

                meta = null;

                // If not found in local search path, fetch from the registry.
                events.emit('log', 'Fetching plugin "' + plugin_src + '" via plugin registry');
                p = registry.fetch([plugin_src], options.client);
            }
        }

        return p.then(
            function(plugin_dir) { return checkID(options.expected_id, plugin_dir); }
        ).then(
            function(plugin_dir) { 
                if(meta) metadata.save_fetch_metadata(plugin_dir, meta); 
                return plugin_dir; 
            }
        );
    }
};


function readId(plugin_dir) {
    var xml_path = path.join(plugin_dir, 'plugin.xml');
    events.emit('verbose', 'Fetch is reading plugin.xml from location "' + xml_path + '"...');
    var et = xml_helpers.parseElementtreeSync(xml_path);

    return et.getroot().attrib.id;
}

// Helper function for checking expected plugin IDs against reality.
function checkID(expected_id, plugin_dir) {
    if (expected_id) {
        var id = readId(plugin_dir);
        if (expected_id != id) {
            throw new Error('Expected fetched plugin to have ID "' + expected_id + '" but got "' + id + '".');
        }
    }
    return plugin_dir;
}

// Look for plugin in local search path.
function findLocalPlugin(plugin_id, searchpath) {
    for(var i = 0; i < searchpath.length; i++){
        var files = fs.readdirSync(searchpath[i]);
        for (var j = 0; j < files.length; j++){
            var plugin_path = path.join(searchpath[i], files[j]);
            try {
                var id = readId(plugin_path);
                if (plugin_id === id) {
                    return plugin_path;
                }
            }
            catch(err) {
                events.emit('verbose', 'Error while trying to read plugin.xml from ' + plugin_path);
            }
        }
    }
    return null;
}

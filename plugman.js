/*
 *
 * Copyright 2013 Anis Kadri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

// copyright (c) 2013 Andrew Lunny, Adobe Systems
var fs = require('fs')
  , path = require('path')
  , url = require('url')
  , package = require(path.join(__dirname, 'package'))
  , et = require('elementtree')
  , plugins = require('./util/plugins')
  , shell = require('shelljs')
  , plugin_loader = require('./util/plugin_loader')
  , platform_modules = {
        'android': require('./platforms/android'),
        'ios': require('./platforms/ios'),
        'blackberry': require('./platforms/blackberry')
    };


function execAction(action, platform, project_dir, plugin_dir, plugins_dir, cli_variables) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , xml_text     = fs.readFileSync(xml_path, 'utf-8')
      , plugin_et    = new et.ElementTree(et.XML(xml_text))
      , filtered_variables = {};

    if (action == 'install') {
        // checking preferences
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
            console.error('Variable missing: ' + missing_vars.join(", "));
            return;
        }

        if((info = plugin_et.find('./platform[@name="'+platform+'"]/info'))) {
            console.log(info.text);
        }
    }

    // run the platform-specific function
    try {
      platform_modules[platform].handlePlugin(action, project_dir, plugin_dir, plugin_et, filtered_variables);
      exports.handlePrepare(project_dir, platform, plugins_dir);
      console.log('plugin ' + action + 'ed');
    } catch(e) {
        var revert = (action == "install" ? "force-uninstall" : "force-install" );
        console.error("An error occurred for action", action, ":", e.message, "\nTrying to revert changes...");
        try {
          platform_modules[platform].handlePlugin(revert, project_dir, plugin_dir, plugin_et, filtered_variables);
        } catch(e) {
          console.log("Changes might have not been reverted: "+e.message);
        }
    }
}

exports.fetchPlugin = function(plugin_dir, plugins_dir, link) {
    // Ensure the containing directory exists.
    shell.mkdir('-p', plugins_dir);

    // clone from git repository
    if(plugin_dir.indexOf('https://') == 0 || plugin_dir.indexOf('git://') == 0) {
        if (link) {
            throw new Error('--link is not supported for git URLs');
        }
        plugin_dir = plugins.clonePluginGitRepo(plugin_dir, plugins_dir);
    } else { // Copy from the local filesystem.
        var dest = path.join(plugins_dir, path.basename(dest));

        shell.rm('-rf', dest);
        if (link) {
            fs.symlinkSync(path.resolve(plugin_dir), dest, 'dir');
        } else {
            shell.cp('-R', plugin_dir, plugins_dir); // Yes, not dest.
        }

        plugin_dir = dest;
    }
};

exports.removePlugin = function(name, plugins_dir) {
    var target = path.join(plugins_dir, name);
    var stat = fs.lstatSync(target);

    if (stat.isSymbolicLink()) {
        fs.unlinkSync(target);
    } else {
        shell.rm('-rf', target);
    }
    console.log('Plugin ' + name + ' deleted.');
};

exports.handlePlugin = function(action, platform, project_dir, name, plugins_dir, cli_variables) {
    var plugin_xml_path, async;

    // Check that the plugin has already been fetched.
    var plugin_dir = path.join(plugins_dir, name);
    if (!fs.existsSync(plugin_dir)) {
        throw new Error('Plugin ' + name + ' not found. You may need to --fetch it.');
    }

    plugin_xml_path = path.join(plugin_dir, 'plugin.xml');
    if (!fs.existsSync(plugin_xml_path)) {
        // try querying the plugin database
        async = true;
        plugins.getPluginInfo(plugin_dir,
            function(plugin_info) {
                execAction(action, platform, project_dir, plugins.clonePluginGitRepo(plugin_info.url), plugins_dir, cli_variables);
            },
            function(e) {
                throw new Error(action + ' failed. "' + plugin_xml_path + '" not found');
            }
        );
    }

    if (!platform_modules[platform]) {
        throw { name: "Platform Error", message: platform + " not supported" }
    }

    // check arguments and resolve file paths
    if(!async) {
        execAction(action, platform, project_dir, plugin_dir, plugins_dir, cli_variables);
    }
};

exports.handlePrepare = function(project_dir, platform, plugins_dir) {
    var www_dir = platform_modules[platform].www_dir(project_dir);
    plugin_loader.handlePrepare(project_dir, plugins_dir, www_dir, platform);
};


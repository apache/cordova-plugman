#!/usr/bin/env node
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
  , nopt = require('nopt')
  , plugins = require('./util/plugins')
  , platform_modules = {
        'android': require('./platforms/android'),
        'ios': require('./platforms/ios'),
        'blackberry': require('./platforms/blackberry'),
        'wp7': require('./platforms/wp7'),
        'wp8': require('./platforms/wp7'),
        'www': require('./platforms/www')
    };

var known_opts = { 'platform' : [ 'ios', 'android', 'blackberry' ,'wp7', 'wp8' , 'www' ]
            , 'project' : path
            , 'plugin' : [String, path, url]
            , 'remove' : Boolean
            , 'list' : Boolean
            , 'v' : Boolean
            , 'debug' : Boolean
            , 'variable' : Array
            }, shortHands = { 'var' : 'variable' };

var cli_opts = nopt(known_opts);

// only dump stack traces in debug mode, otherwise show error message and exit
if (!cli_opts.debug) {
    // provide clean output on exceptions rather than dumping a stack trace
    process.on('uncaughtException', function(error){
        console.error(error + '\n');
        process.exit(1);
    });
}

if (cli_opts.v) {
    console.log(package.name + ' version ' + package.version);
}
else if (cli_opts.list) {
    plugins.listAllPlugins(function(plugins) {
      for(var i = 0, j = plugins.length ; i < j ; i++) {
        console.log(plugins[i].value.name, '-', plugins[i].value.description);
      }
    });
}
else if (!cli_opts.platform || !cli_opts.project || !cli_opts.plugin) {
    printUsage();
}
else if (cli_opts.remove) {
    handlePlugin('uninstall', cli_opts.platform, cli_opts.project, cli_opts.plugin);
}
else {
  var cli_variables = {}
  if (cli_opts.variable) {
    cli_opts.variable.forEach(function (variable) {
        var tokens = variable.split('=');
        var key = tokens.shift().toUpperCase();
        if (/^[\w-_]+$/.test(key)) cli_variables[key] = tokens.join('=');
        });
  }
  handlePlugin('install', cli_opts.platform, cli_opts.project, cli_opts.plugin, cli_variables);
}

function printUsage() {
    platforms = known_opts.platform.join('|');
    console.error('Usage\n---------');
    console.error('Add a plugin:\n\t' + package.name + ' --platform <'+ platforms +'> --project <directory> --variable <preference_name>="<substituion>" --plugin <directory|git-url|name>\n');
    console.error('Remove a plugin:\n\t' + package.name + ' --remove --platform <'+ platforms +'> --project <directory> --plugin <directory|git-url|name>\n');
    console.error('List plugins:\n\t' + package.name + ' --list\n');
    process.exit(1);
}

function execAction(action, platform, project_dir, plugin_dir, cli_variables) {
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

function handlePlugin(action, platform, project_dir, plugin_dir, cli_variables) {
    var plugin_xml_path, async = false;

    // clone from git repository
    if(plugin_dir.indexOf('https://') == 0 || plugin_dir.indexOf('git://') == 0) {
        plugin_dir = plugins.clonePluginGitRepo(plugin_dir);
    }

    plugin_xml_path = path.join(plugin_dir, 'plugin.xml');
    if (!fs.existsSync(plugin_xml_path)) {
        // try querying the plugin database
        async = true;
        plugins.getPluginInfo(plugin_dir,
            function(plugin_info) {
                execAction(action, platform, project_dir, plugins.clonePluginGitRepo(plugin_info.url), cli_variables);
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
        execAction(action, platform, project_dir, plugin_dir, cli_variables);
    }
}


/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var platform_modules = require('./platforms'),
    path            = require('path'),
    config_changes  = require('./util/config-changes'),
    xml_helpers     = require('./util/xml-helpers'),
    fs              = require('fs'),
    shell           = require('shelljs'),
    util            = require('util'),
    exec            = require('child_process').exec,
    et              = require('elementtree');

// Called on --prepare.
// Sets up each plugin's Javascript code to be loaded properly.
// Expects a path to the project (platforms/android in CLI, . in plugman-only),
// a path to where the plugins are downloaded, the www dir, and the platform ('android', 'ios', etc.).
module.exports = function handlePrepare(project_dir, platform, plugins_dir) {
    // Process:
    // - Do config munging by calling into config-changes module
    // - List all plugins in plugins_dir
    // - Load and parse their plugin.xml files.
    // - Skip those without support for this platform. (No <platform> tags means JS-only!)
    // - Build a list of all their js-modules, including platform-specific js-modules.
    // - For each js-module (general first, then platform) build up an object storing the path and any clobbers, merges and runs for it.
    // - Write this object into www/cordova_plugins.json.
    // - Cordova.js contains code to load them at runtime from that file.

    require('../plugman').emit('log', 'Preparing ' + platform + ' project, starting with processing of config changes...');
    config_changes.process(plugins_dir, project_dir, platform);

    var wwwDir = platform_modules[platform].www_dir(project_dir);
    // TODO: perhaps this should look at platform json files to determine which plugins to prepare?
    var plugins = fs.readdirSync(plugins_dir).filter(function(p) {
        return p != '.svn' && p != 'CVS';
    });

    // This array holds all the metadata for each module and ends up in cordova_plugins.json
    var moduleObjects = [];
    require('../plugman').emit('log', 'Iterating over installed plugins...');

    plugins && plugins.forEach(function(plugin) {
        var pluginDir = path.join(plugins_dir, plugin);
        if(fs.statSync(pluginDir).isDirectory()){
            var xml = xml_helpers.parseElementtreeSync(path.join(pluginDir, 'plugin.xml'));
    
            var plugin_id = xml.getroot().attrib.id;
    
            // add the plugins dir to the platform's www.
            var platformPluginsDir = path.join(wwwDir, 'plugins');
            // XXX this should not be here if there are no js-module. It leaves an empty plugins/ directory
            shell.mkdir('-p', platformPluginsDir);
    
            var generalModules = xml.findall('./js-module');
            var platformTag = xml.find(util.format('./platform[@name="%s"]', platform));
    
            generalModules = generalModules || [];
            var platformModules = platformTag ? platformTag.findall('./js-module') : [];
            var allModules = generalModules.concat(platformModules);
    
            allModules.forEach(function(module) {
                // Copy the plugin's files into the www directory.
                var dirname = path.dirname(module.attrib.src);
    
                var dir = path.join(platformPluginsDir, plugin_id, dirname);
                shell.mkdir('-p', dir);
    
                // Read in the file, prepend the cordova.define, and write it back out.
                var moduleName = plugin_id + '.';
                if (module.attrib.name) {
                    moduleName += module.attrib.name;
                } else {
                    var result = module.attrib.src.match(/([^\/]+)\.js/);
                    moduleName += result[1];
                }
    
                var scriptContent = fs.readFileSync(path.join(pluginDir, module.attrib.src), 'utf-8');
                scriptContent = 'cordova.define("' + moduleName + '", function(require, exports, module) {' + scriptContent + '});\n';
                fs.writeFileSync(path.join(platformPluginsDir, plugin_id, module.attrib.src), scriptContent, 'utf-8');
    
                // Prepare the object for cordova_plugins.json.
                var obj = {
                    file: path.join('plugins', plugin_id, module.attrib.src),
                    id: moduleName
                };
    
                // Loop over the children of the js-module tag, collecting clobbers, merges and runs.
                module.getchildren().forEach(function(child) {
                    if (child.tag.toLowerCase() == 'clobbers') {
                        if (!obj.clobbers) {
                            obj.clobbers = [];
                        }
                        obj.clobbers.push(child.attrib.target);
                    } else if (child.tag.toLowerCase() == 'merges') {
                        if (!obj.merges) {
                            obj.merges = [];
                        }
                        obj.merges.push(child.attrib.target);
                    } else if (child.tag.toLowerCase() == 'runs') {
                        obj.runs = true;
                    }
                });
    
                // Add it to the list of module objects bound for cordova_plugins.json
                moduleObjects.push(obj);
            });
        }
    });

    require('../plugman').emit('log', 'Writing out cordova_plugins.json...');
    // Write out moduleObjects as JSON to cordova_plugins.json
    fs.writeFileSync(path.join(wwwDir, 'cordova_plugins.json'), JSON.stringify(moduleObjects), 'utf-8');
    // Write out moduleObjects as JSON wrapped in a cordova module to cordova_plugins.js
    // This is to support Windows Phone platforms that have trouble with XHR during load
    var final_contents = "cordova.define('cordova/plugin_list', function(require, exports, module) {\n";
    final_contents += 'module.exports = ' + JSON.stringify(moduleObjects) + '\n';
    final_contents += '});';
    require('../plugman').emit('log', 'Writing out cordova_plugins.js...');
    fs.writeFileSync(path.join(wwwDir, 'cordova_plugins.js'), final_contents, 'utf-8');
};

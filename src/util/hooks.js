/*
 * Copyright (c) Microsoft Open Technologies, Inc.  
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at 
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var path = require('path'),
    fs   = require('fs'),
    child_process = require('child_process'),
    Q = require('q'),
    events = require('../events'),
    os = require('os'),
    isWindows = (os.platform().substr(0,3) === 'win');

/**
 * Implements functionality to run plugin level hooks. 
 * Hooks are defined in plugin config file as <script> elements.
 */
module.exports = {
    /**
     * Fires specific plugin hook: 'preinstall', 'afterinstall', 'uninstall', etc.
     * Async. Returns promise.
     */
    fire : function(type, plugin_id, pluginElement, platform, project_dir, plugin_dir) {
        // args check
        if (!type) {
            throw Error('hook type is not specified');
        }

        events.emit('debug', 'Executing "' + type + '"  hook for "' + plugin_id + '" on ' + platform + '.');
        
        var scriptTypes = getScriptTypesForHook(type);

        if (scriptTypes == null) {
            throw Error('unknown plugin hook type: "' + type + '"' );
        }

        return runScripts(scriptTypes, plugin_id, pluginElement, platform, project_dir, plugin_dir);
    }
};

/**
 * Returns all script types represented corresponding hook event.
 * Allows to use multiple script types for the same hook event (usage simplicity),
 * For example: 
 * <script type='install' .. /> or <script type='postinstall' .. /> could be used 
 * to define 'afterinstall' hook.
 */
function getScriptTypesForHook(hookType) {
    var knownTypes = {
        beforeinstall: ['beforeinstall', 'preinstall'],
        afterinstall: ['install', 'afterinstall', 'postinstall'],
        uninstall: ['uninstall']
    }

     return knownTypes[hookType.toLowerCase()];
}

/**
 * Async runs all the scripts with specified types.
 */
function runScripts(scriptTypes, plugin_id, pluginElement, platform, project_dir, plugin_dir) {
    var allScripts =  pluginElement.findall('./script').concat(pluginElement.findall('./platform[@name="'+platform+'"]/script'));

    var pendingScripts = [];
    allScripts.forEach(function(script){
        if (script.attrib.type && scriptTypes.indexOf(script.attrib.type.toLowerCase()) > -1 && script.attrib.src) {
            pendingScripts.push(runScriptFile(script.attrib.src, platform, project_dir, plugin_dir));
        }
    });

    return Q.all(pendingScripts);
};

/**
 * Async runs script file.
 */
function runScriptFile(scriptPath, platform, project_dir, plugin_dir) {

    scriptPath = path.join(plugin_dir, scriptPath);

    if(!fs.existsSync(scriptPath)) {
        events.emit('warn', "Script file does't exist and will be skipped: " + scriptPath);
        return Q();
    }

    // .js support only
    var cmd = 'node ' + scriptPath,
        d = Q.defer(),
        options = {};

    // populate required environment variables
    options.env = {};
    options.env.PATH = process.env.PATH;
    options.env.CORDOVA_PLATFORM = platform;
    options.env.CORDOVA_PROJECT_DIR = project_dir;
    options.env.CORDOVA_PLUGIN_DIR = plugin_dir;
    options.env.CORDOVA_CMDLINE = process.argv.join(' ');

    events.emit('debug', "Running script file: " + scriptPath);

    child_process.exec(cmd, options, function(error, stdout, stderr) {
        events.emit('verbose', 'Script output: ' + stdout);
        if (error) {
            events.emit('warn', 'Script failed: ' + error);
        }
        d.resolve();
    });
    return d.promise;
}
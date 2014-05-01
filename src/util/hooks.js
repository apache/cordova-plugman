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

        var scriptFilesToRun = getScriptFiles(pluginElement, scriptTypes, platform);
        var context = {
                platform: platform,
                projectDir: project_dir,
                pluginDir: plugin_dir,
                cmdLine: process.argv.join(' '),
                pluginId: plugin_id
            };

        return runScripts(scriptFilesToRun, context);
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
 * Gets all scripts from the plugin xml with the specified types.
 */
function getScriptFiles(pluginElement, scriptTypes, platform) {
    var scriptFiles= [];
    var scriptElements =  pluginElement.findall('./script').concat(
            pluginElement.findall('./platform[@name="' + platform + '"]/script'));

    var pendingScripts = [];

    scriptElements.forEach(function(script){
        if (script.attrib.type && scriptTypes.indexOf(script.attrib.type.toLowerCase()) > -1 && script.attrib.src) {
            scriptFiles.push(script.attrib.src);
        }
    });
    return scriptFiles;
}

/**
 * Serially runs the script files.
 */
function runScripts(scripts, context) {
    var pendingScripts = [];

    scripts.forEach(function(script){
        pendingScripts.push(script);
    });

    var deferral = new Q.defer();

    function executePendingScript() {
        try {
            if (pendingScripts.length == 0) {
                deferral.resolve();
                return;
            }
            var nextScript = pendingScripts[0];
            pendingScripts.shift();

            runScriptFile(nextScript, context).then(executePendingScript, function(err){
                deferral.fail(err);
            });

        } catch (ex) {
            deferral.fail(ex);
        }
    }

    executePendingScript();

    return deferral.promise;
};

/**
 * Async runs single script file.
 */
function runScriptFile(scriptPath, context) {

    scriptPath = path.join(context.pluginDir, scriptPath);

    if(!fs.existsSync(scriptPath)) {
        events.emit('warn', "Script file does't exist and will be skipped: " + scriptPath);
        return Q();
    }
    var scriptFn = require(scriptPath);

    // if hook is async it can return promise instance and we will handle it
    return Q(scriptFn(context));
}
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

var fs = require('fs')  // use existsSync in 0.6.x
   , path = require('path')
   , shell = require('shelljs')
   , common = require('./common')
   , getConfigChanges = require(path.join(__dirname, '..', 'util', 'config-changes'))
   , plugins_module = require(path.join(__dirname, '..', 'util', 'plugins'))
   , xml_helpers = require(path.join(__dirname, '..', 'util', 'xml-helpers'));

module.exports = {
    install:function(transactions, plugin_id, project_dir, plugin_dir, variables, callback) {
        handlePlugin('install', plugin_id, transactions, project_dir, plugin_dir, variables, callback);
    },
    uninstall:function(transactions, plugin_id, project_dir, plugin_dir, callback) {
        handlePlugin('uninstall', plugin_id, transactions, project_dir, plugin_dir, null, callback);
    },
    www_dir:function(project_dir) {
        return path.join(project_dir, 'assets', 'www');
    },
    // reads the package name out of the Android Manifest file
    // @param string project_dir the absolute path to the directory containing the project
    // @return string the name of the package
    package_name:function (project_dir) {
        var mDoc = xml_helpers.parseElementtreeSync(path.join(project_dir, 'AndroidManifest.xml'));

        return mDoc._root.attrib['package'];
    }
};

function handlePlugin(action, plugin_id, txs, project_dir, plugin_dir, variables, callback) {
    variables = variables || {};

    // TODO: adding access tags?
    // TODO: move this to prepare?
    /*
    var root = et.Element("config-file");
    root.attrib['parent'] = '.';
    plugin_et.findall('./access').forEach(function (tag) { 
        root.append(tag);
    });
    */
    var completed = [];
    while(txs.length) {
        var mod = txs.shift();
        try {
            switch(mod.tag.toLowerCase()) {
                case 'source-file':
                    var destFile = path.join(mod.attrib['target-dir'], path.basename(mod.attrib['src']));

                    if (action == 'install') {
                        common.copyFile(plugin_dir, mod.attrib['src'], project_dir, destFile);
                    } else {
                        common.deleteJava(project_dir, destFile);
                    }
                    break;
                case 'asset':
                    var src = mod.attrib['src'];
                    var target = mod.attrib['target'];
                    if (action == 'install') {
                        common.copyFile(plugin_dir, src, module.exports.www_dir(project_dir), target);
                    } else {
                        common.removeFile(module.exports.www_dir(project_dir), target);
                        common.removeFileF(path.resolve(module.exports.www_dir(project_dir), 'plugins', plugin_id));
                    }
                    break;
                default:
                    throw new Error('Unrecognized plugin.xml element/action in android installer: ' + mod.tag);
                    break;
            }
        } catch(e) {
            // propagate error up and provide completed tx log
            e.transactions = {
                executed:completed,
                incomplete:txs.unshift(mod)
            };
            if (callback) callback(e);
            else throw e;
            return;
        }
        completed.push(mod);
    }

    if (callback) callback();
}

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

var fs = require('fs'),  // use existsSync in 0.6.x
    path = require('path'),
    shell = require('shelljs'),
    et = require('elementtree'),
    getConfigChanges = require('../util/config-changes'),
    common = require('./common'),
    xml_helpers = require(path.join(__dirname, '..', 'util', 'xml-helpers'));

function handlePlugin(action, plugin_id, txs, project_dir, plugin_dir, variables, callback) {
    var TARGETS = ["device", "simulator"],
        completed = [],
        srcFile,
        destFile,
        arch,
        target,
        mod;
    while(txs.length) {
        mod = txs.shift();
        try {
            switch(mod.tag.toLowerCase()) {
                case 'source-file':
                    srcFile = mod.attrib.src;
                    target = mod.attrib['target-dir'] || plugin_id;

                    /* jshint loopfunc: true */
                    TARGETS.forEach(function (arch) {
                        destFile = path.join("native", arch, "chrome", "plugin", target, path.basename(srcFile));
                        if (action == 'install') {
                            common.copyFile(plugin_dir, srcFile, project_dir, destFile);
                        } else {
                            common.removeFile(project_dir, destFile);
                        }
                    });
                    break;
                case 'lib-file':
                    srcFile = mod.attrib.src;
                    arch = mod.attrib.arch;

                    destFile = path.join("native", arch, "plugins", "jnext", path.basename(srcFile));

                    if (action == "install") {
                        common.copyFile(plugin_dir, srcFile, project_dir, destFile);
                    } else {
                        common.removeFile(project_dir, destFile);
                    }
                    break;
                case 'asset':
                    src = mod.attrib.src;
                    target = mod.attrib.target;

                    if (action == 'install') {
                        common.copyFile(plugin_dir, src, module.exports.www_dir(project_dir), target);
                    } else {
                        common.removeFile(module.exports.www_dir(project_dir), target);
                        common.removeFileF(path.resolve(module.exports.www_dir(project_dir), 'plugins', plugin_id));
                    }
                    break;
                default:
                    throw new Error('Unrecognized plugin.xml element/action in blackberry10 installer: ' + mod.tag);
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

module.exports = {
    install:function(transactions, plugin_id, project_dir, plugin_dir, variables, callback) {
        handlePlugin('install', plugin_id, transactions, project_dir, plugin_dir, variables, callback);
    },
    uninstall:function(transactions, plugin_id, project_dir, plugin_dir, callback) {
        handlePlugin('uninstall', plugin_id, transactions, project_dir, plugin_dir, null, callback);
    },
    www_dir:function(project_dir) {
        return path.join(project_dir, 'www');
    },
    package_name:function(project_dir) {
        var config_path = path.join(module.exports.www_dir(project_dir), 'config.xml');
        var widget_doc = new et.ElementTree(et.XML(fs.readFileSync(config_path, 'utf-8')));
        return widget_doc._root.attrib.id;
    }
};

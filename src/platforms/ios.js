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

var path = require('path')
  , fs = require('../util/fs')  // use existsSync in 0.6.x
  , glob = require('glob')
  , et = require('elementtree')
  , xcode = require('xcode')
  , plist = require('plist')
  , bplist = require('bplist-parser')
  , shell = require('shelljs')
  , common = require('./common')
  , xml_helpers = require(path.join(__dirname, '..', 'util', 'xml-helpers'))
  , searchAndReplace = require(path.join(__dirname, '..', 'util', 'search-and-replace'))
  , getConfigChanges = require(path.join(__dirname, '..', 'util', 'config-changes'));

module.exports = {
    install:function(transactions, plugin_id, project_dir, plugin_dir, variables, callback) {
        handlePlugin('install', plugin_id, transactions, project_dir, plugin_dir, variables, callback);
    },
    uninstall:function(transactions, plugin_id, project_dir, plugin_dir, callback) {
        handlePlugin('uninstall', plugin_id, transactions, project_dir, plugin_dir, null, callback);
    },
    www_dir:function(project_dir) {
        return path.join(project_dir, 'www');
    }
};
 
function handlePlugin(action, plugin_id, txs, project_dir, plugin_dir, variables, callback) {
    variables = variables || {};

    // grab and parse pbxproj
    // we don't want CordovaLib's xcode project
    var project_files = glob.sync(path.join(project_dir, '*.xcodeproj', 'project.pbxproj'));
    
    if (project_files.length === 0) {
        var err = new Error("does not appear to be an xcode project (no xcode project file)");
        if (callback) callback(err);
        else throw err;
        return;
    }
    var pbxPath = project_files[0];
    var xcodeproj = xcode.project(pbxPath);
    xcodeproj.parseSync();

    // grab and parse plist file or config.xml
    var config_files = (glob.sync(path.join(project_dir, '**', '{PhoneGap,Cordova}.plist')).length == 0 ? 
                        glob.sync(path.join(project_dir, '**', 'config.xml')) :
                        glob.sync(path.join(project_dir, '**', '{PhoneGap,Cordova}.plist'))
                       );

    config_files = config_files.filter(function (val) {
        return !(/^build\//.test(val));
    });

    if (config_files.length === 0) {
        var err = new Error("could not find PhoneGap/Cordova plist file.");
        if (callback) callback(err);
        else throw err;
        return;
    }

    var config_file = config_files[0];
    var xcode_dir = path.dirname(config_file);
    var pluginsDir = path.resolve(xcode_dir, 'Plugins');
    var resourcesDir = path.resolve(xcode_dir, 'Resources');
    // get project plist for package name
    var project_plists = glob.sync(xcode_dir + '/*-Info.plist');
    var projectPListPath = project_plists[0];

    var completed = [];
    while(txs.length) {
        var mod = txs.shift();
        try {
            switch(mod.tag.toLowerCase()) {
                case 'source-file':
                    var src = mod.attrib['src'];
                    var srcFile = path.resolve(plugin_dir, src);
                    var targetDir = path.resolve(pluginsDir, getRelativeDir(mod));
                    var destFile = path.resolve(targetDir, path.basename(src));
                     
                    if (action == 'install') {
                        if (!fs.existsSync(srcFile)) throw new Error('cannot find "' + srcFile + '" ios <source-file>');
                        if (fs.existsSync(destFile)) throw new Error('target destination "' + destFile + '" already exists');
                        xcodeproj.addSourceFile(path.join('Plugins', path.relative(pluginsDir, destFile)));
                        shell.mkdir('-p', targetDir);
                        shell.cp(srcFile, destFile);
                    } else {
                        xcodeproj.removeSourceFile(path.join('Plugins', path.basename(src)));
                        if(fs.existsSync(destFile))
                            fs.unlinkSync(destFile);
                        // TODO: is this right, should we check if dir is empty?
                        shell.rm('-rf', targetDir);    
                    }
                    break;
                case 'library-file':
                    var destFile = path.join(mod.attrib['target-dir'], path.basename(mod.attrib['src']));

                    if (action == 'install') {
                        common.straightCopy(plugin_dir, mod.attrib['src'], project_dir, destFile);
                    } else {
                        fs.unlinkSync(path.resolve(project_dir, destFile));
                    }
                    break;
                case 'config-file':
                    // Only modify config files that exist.
                    var config_file = path.resolve(project_dir, mod.attrib['target']);
                    if (fs.existsSync(config_file)) {
                        var xmlDoc = xml_helpers.parseElementtreeSync(config_file);
                        var selector = mod.attrib["parent"];
                        var children = mod.findall('*');

                        if (action == 'install') {
                            if (!xml_helpers.graftXML(xmlDoc, children, selector)) {
                                throw new Error('failed to add config-file children to "' + filename + '"');
                            }
                        } else {
                            if (!xml_helpers.pruneXML(xmlDoc, children, selector)) {
                                throw new Error('failed to remove config-file children from "' + filename + '"');
                            }
                        }

                        var output = xmlDoc.write({indent: 4});
                        fs.writeFileSync(config_file, output);
                    }
                    break;
                case 'asset':
                    if (action == 'uninstall') {
                        var target = mod.attrib.target;
                        shell.rm('-rf', path.resolve(module.exports.www_dir(), target));
                        shell.rm('-rf', path.resolve(module.exports.www_dir(), 'plugins', plugin_id));
                    }
                    break;
                case 'header-file':
                    break;
                case 'resource-file':
                    break;
                case 'framework':
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
    
    headerFiles && headerFiles.forEach(function (headerFile) {
        var src = headerFile.attrib['src'],
            srcFile = path.resolve(plugin_dir, src),
            targetDir = path.resolve(pluginsDir, getRelativeDir(headerFile)),
            destFile = path.resolve(targetDir, path.basename(src));
         
        if (action == 'install') {     
            xcodeproj.addHeaderFile(path.join('Plugins', path.relative(pluginsDir, destFile)));
            shell.mkdir('-p', targetDir);
            checkLastCommand();
            shell.cp(srcFile, destFile);
            checkLastCommand();
        } else {
            xcodeproj.removeHeaderFile(path.join('Plugins', path.basename(src)));
            if(fs.existsSync(destFile))
                fs.unlinkSync(destFile);
            shell.rm('-rf', targetDir);
            checkLastCommand();
        }
    });

    resourceFiles && resourceFiles.forEach(function (resource) {
        var src = resource.attrib['src'],
            srcFile = path.resolve(plugin_dir, src),
            destFile = path.resolve(resourcesDir, path.basename(src));

        if (action == 'install') {
            xcodeproj.addResourceFile(path.join('Resources', path.basename(src)));
            var st = fs.statSync(srcFile);
            shell.mkdir('-p', resourcesDir);
            if (st.isDirectory()) {
                shell.cp('-R', srcFile, resourcesDir);
                checkLastCommand();
            } else {
                shell.cp(srcFile, destFile);
                checkLastCommand();
            }
        } else {
            xcodeproj.removeResourceFile(path.join('Resources', path.basename(src)));
            shell.rm('-rf', destFile);
            checkLastCommand();
        }
    });

    frameworks && frameworks.forEach(function (framework) {
        var src = framework.attrib['src'],
            weak = framework.attrib['weak'];
        if (action == 'install') {
            var opt = { weak: (weak && weak.toLowerCase() == 'true') };
            xcodeproj.addFramework(src, opt);
        } else {
            xcodeproj.removeFramework(src);
        }
    });

    // write out xcodeproj file
    fs.writeFileSync(pbxPath, xcodeproj.writeSync());

    // add plugin and whitelisted hosts
    try {
      updateConfig(action, config_file, plugin_et);
    } catch(e) {
      throw {
        name: "ConfigurationError",
        level: "ERROR",
        message: "Error updating configuration: "+e.message,
      }
    }
    
    if (action == 'install') {
        variables['PACKAGE_NAME'] = plist.parseFileSync(projectPListPath).CFBundleIdentifier;
        searchAndReplace(pbxPath, variables);
        searchAndReplace(projectPListPath, variables);
        searchAndReplace(config_file, variables);
    }

    // Remove all assets and JS modules installed by this plugin.
    if (action == 'uninstall') {
        var assets = plugin_et.findall('./asset');
        assets && assets.forEach(function(asset) {
            var target = asset.attrib.target;
            shell.rm('-rf', path.join(project_dir, 'www', target));
        });

        shell.rm('-rf', path.join(project_dir, 'www', 'plugins', plugin_id));
    }

}

function getRelativeDir(file) {
    var targetDir = file.attrib['target-dir'],
        preserveDirs = file.attrib['preserve-dirs'];

    if (preserveDirs && preserveDirs.toLowerCase() == 'true') {
        return path.dirname(file.attrib['src']);
    } else if (targetDir) {
        return targetDir;
    } else {
        return '';
    }
}

// determine if a plist file is binary
function isBinaryPlist(filename) {
    // I wish there was a synchronous way to read only the first 6 bytes of a
    // file. This is wasteful :/ 
    var buf = '' + fs.readFileSync(filename, 'utf8');
    // binary plists start with a magic header, "bplist"
    return buf.substring(0, 6) === 'bplist';
}

function updatePlistFile(action, config_path, plugin_et) {
    var hosts = plugin_et.findall('./access'),
        platformTag = plugin_et.find('./platform[@name="ios"]'), // FIXME: can probably do better than this
        plistEle = platformTag.find('./plugins-plist'),
        external_hosts = [];

    // determine if this is a binary or ascii plist and choose the parser
    // this is temporary until binary support is added to node-plist
    var pl = (isBinaryPlist(config_path) ? bplist : plist);

    var plistObj = pl.parseFileSync(config_path);
    
    if (action == 'install') {
        // add hosts to whitelist (ExternalHosts) in plist
        hosts && hosts.forEach(function(host) {
            plistObj.ExternalHosts.push(host.attrib['origin']);
        });

        // add plugin to plist
        plistObj.Plugins[plistEle.attrib['key']] = plistEle.attrib['string'];
    } else {
        // remove hosts from whitelist (ExternalHosts) in plist
        // check each entry in external hosts, only add it to the plist if
        // it's not an entry added by this plugin 
        for(i=0; i < plistObj.ExternalHosts.length;i++) {
            matched = false;
            hosts && hosts.forEach(function(host) {
                if(host === plistObj.ExternalHosts[i]) {
                    matched = true;
                }
            });
            if (!matched) {
                external_hosts.push(plistObj.ExternalHosts[i]);
            }
        }

        // filtered the external hosts entries out, copy result
        plistObj.ExternalHosts = external_hosts;

        delete plistObj.Plugins[plistEle.attrib['key']];
    }
    
    // write out plist
    fs.writeFileSync(config_path, plist.build(plistObj));
}

function updateConfigXml(action, config_path, plugin_et) {
    var hosts = plugin_et.findall('./access'),
        platformTag = plugin_et.find('./platform[@name="ios"]'), // FIXME: can probably do better than this
        plistEle = platformTag.find('./plugins-plist'), // use this for older that have plugins-plist
        configChanges = getConfigChanges(platformTag),
        base_config_path = path.basename(config_path);

    // edit configuration files
    var xmlDoc = xml_helpers.parseElementtreeSync(config_path),
        output,
		    pListOnly = plistEle;
    
    if (configChanges[path.basename(config_path)]) {	
      configChanges[path.basename(config_path)].forEach(function (val) {
        if (val.find("plugin")) pListOnly = false;
      });
    }

    if (pListOnly) {
        // if the plugin supports the old plugins-plist element only
        var name = plistEle.attrib.key;
        var value = plistEle.attrib.string;
        var pluginsEl = xmlDoc.find('plugins');
        if ( action == 'install') {
            var new_plugin = new et.Element('plugin');
            new_plugin.attrib.name = name;
            new_plugin.attrib.value = value;
            pluginsEl.append(new_plugin);
        } else {
            var culprit = pluginsEl.find("plugin[@name='"+name+"']");
            pluginsEl.remove(0, culprit);
        }
    }

    // add whitelist hosts
    root = et.Element("config-file");
    root.attrib['parent'] = '.'
      hosts.forEach(function (tag) {
      root.append(tag);
    });

    if (root.len()) {
      (configChanges[path.basename(config_path)]) ?
            configChanges[path.basename(config_path)].push(root) :
            configChanges[path.basename(config_path)] = [root];
    }

    if (configChanges[path.basename(config_path)]) {

        configChanges[base_config_path].forEach(function (configNode) {
            var selector = configNode.attrib["parent"],
                children = configNode.findall('*');
            if( action == 'install') {
                if (!xml_helpers.graftXML(xmlDoc, children, selector)) {
                    throw new Error('failed to add children to ' + selector + ' in ' + config_path);
                }
            } else {
                if (!xml_helpers.pruneXML(xmlDoc, children, selector)) {
                    throw new Error('failed to remove children from ' + selector + ' in ' + config_path);
                }
            }
      });
    }

    output = xmlDoc.write({indent: 4});
    fs.writeFileSync(config_path, output);
}

// updates plist file and/or config.xml
function updateConfig(action, config_path, plugin_et) {
    if(path.basename(config_path) == "config.xml") {
        updateConfigXml(action, config_path, plugin_et);
    } else {
        updatePlistFile(action, config_path, plugin_et);
    }
}

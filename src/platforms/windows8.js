/*
 *
 * Copyright 2013 Jesse MacFadyen
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

var common = require('./common'),
    path = require('path'),
    glob = require('glob'),
    shell = require('shelljs'),
    fs   = require('fs');
var w8jsproj = require('../util/w8jsproj');
var xml_helpers = require('../util/xml-helpers');


module.exports = {
    platformName:"windows8",
    InvalidProjectPathError:'does not appear to be a Windows Store JS project (no .jsproj file)',
    www_dir:function(project_dir) {
        return path.join(project_dir, 'www');
    },
    package_name:function(project_dir) {
        var manifest = xml_helpers.parseElementtreeSync(path.join(project_dir, 'package.appxmanifest'));
        return manifest.find("Properties/DisplayName").text;
    },
    parseProjectFile:function(project_dir) {
        var project_files = glob.sync('*.jsproj', { cwd:project_dir });
        if (project_files.length == 0) {
            throw new Error(this.InvalidProjectPathError);
        }
        return new w8jsproj(path.join(project_dir, project_files[0]));
    },
    "source-file":{
        install:function(source_el, plugin_dir, project_dir, plugin_id, project_file) {
            var targetDir = source_el.attrib['target-dir'] || '';
            var dest = path.join('www', 'plugins', plugin_id, targetDir, path.basename(source_el.attrib['src']));
            common.copyFile(plugin_dir, source_el.attrib['src'], project_dir, dest);
            // add reference to this file to jsproj.
            project_file.addSourceFile(dest);
        },
        uninstall:function(source_el, project_dir, plugin_id, project_file) {
            var dest = path.join('www', 'plugins', plugin_id,
                                 source_el.attrib['target-dir'] ? source_el.attrib['target-dir'] : '', 
                                 path.basename(source_el.attrib['src']));
            common.removeFile(project_dir, dest);
            // remove reference to this file from csproj.
            project_file.removeSourceFile(dest);
        }
    },
    "resource-file":{
        install:function(el, plugin_dir, project_dir) {
            require('../../plugman').emit('verbose', 'resource-file is not supported for Windows 8');
        },
        uninstall:function(el, project_dir) {
        }
    },
    "framework":{ // CB-5238 custom frameworks only
        install:function(framework_el, plugin_dir, project_dir, plugin_id, project) {
            // console.log("framework install called with framework_el:: " + framework_el);
            // console.log("framework install called with plugin_dir:: " + plugin_dir );
            // console.log("framework install called with project_dir:: " + project_dir);
            // console.log("framework install called with plugin_id:: " + plugin_id);
            // console.log("framework install called with project::" + project);

            // console.log("project.plugins_dir " + project.plugins_dir);

            // framework_el attributes : src, custom
            var src = framework_el.attrib['src'];
            console.log("src = " + src);

            var custom = framework_el.attrib['custom'];

            var srcFile = path.resolve(plugin_dir, src);

            console.log("path.basename(src) = " + path.basename(src));

            console.log("srcFile = " + srcFile);

            var targetDir = path.resolve(project.plugins_dir, plugin_id, path.basename(src));

            if (!custom) throw new Error('cannot add non custom frameworks.');
            if (!fs.existsSync(srcFile)) throw new Error('cannot find "' + srcFile + '" ios <framework>');
            if (fs.existsSync(targetDir)) throw new Error('target destination "' + targetDir + '" already exists');
            shell.mkdir('-p', path.dirname(targetDir));
            shell.cp('-R', srcFile, path.dirname(targetDir)); // frameworks are directories
            var project_relative = path.relative(project_dir, targetDir);
            
            console.log("project_relative = " + project_relative);
            project.addProjectReference(project_relative);
            //project.xcode.addFramework(project_relative, {customFramework: true});
        },
        uninstall:function(framework_el, project_dir, plugin_id, project) {
            var src = framework_el.attrib['src'],
                baseDir = path.resolve(project.plugins_dir, plugin_id),
                targetDir = path.resolve(baseDir, path.basename(src));
            project.removeProjectReference(targetDir);
            shell.rm('-rf', baseDir);

        }
    }
};

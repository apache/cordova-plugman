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
    fs = require('fs'),
    csproj = require('../util/csproj'),
    xml_helpers = require('../util/xml-helpers');

module.exports = {
    www_dir:function(project_dir) {
        return path.join(project_dir, 'www');
    },
    package_name:function(project_dir) {
        return xml_helpers.parseElementtreeSync(path.join(project_dir, 'Properties', 'WMAppManifest.xml')).find('App').attrib.ProductID;
    },
    parseProjectFile:function(project_dir) {
        var project_files = glob.sync('*.csproj', {
            cwd:project_dir
        });
        if (project_files.length === 0) {
            throw new Error('does not appear to be a Windows Phone project (no .csproj file)');
        }
        return new csproj(path.join(project_dir, project_files[0]));
    },
    "source-file":{
        install:function(source_el, plugin_dir, project_dir, plugin_id, project_file) {
            var dest = path.join('Plugins', plugin_id, source_el.attrib['target-dir'] ? source_el.attrib['target-dir'] : '', path.basename(source_el.attrib['src']));

            common.copyNewFile(plugin_dir, source_el.attrib['src'], project_dir, dest);
            // add reference to this file to csproj.
            project_file.addSourceFile(dest);
        },
        uninstall:function(source_el, project_dir, plugin_id, project_file) {
            var dest = path.join('Plugins', plugin_id, source_el.attrib['target-dir'] ? source_el.attrib['target-dir'] : '', path.basename(source_el.attrib['src']));
            common.removeFile(project_dir, dest);
            // remove reference to this file from csproj.
            project_file.removeSourceFile(dest);
        }
    },
    "header-file": {
        install:function(source_el, plugin_dir, project_dir, plugin_id) {
            require('../../plugman').emit('verbose', 'header-fileinstall is not supported for wp7');
        },
        uninstall:function(source_el, project_dir, plugin_id) {
            require('../../plugman').emit('verbose', 'header-file.uninstall is not supported for wp7');
        }
    },
    "resource-file":{
        install:function(el, plugin_dir, project_dir, plugin_id) {
            require('../../plugman').emit('verbose', 'resource-file.install is not supported for wp7');
        },
        uninstall:function(el, project_dir, plugin_id) {
            require('../../plugman').emit('verbose', 'resource-file.uninstall is not supported for wp7');
        }
    },
    "framework": {
        install:function(source_el, plugin_dir, project_dir, plugin_id) {
            require('../../plugman').emit('verbose', 'framework.install is not supported for wp7');
        },
        uninstall:function(source_el, project_dir, plugin_id) {
            require('../../plugman').emit('verbose', 'framework.uninstall is not supported for wp7');
        }
    },
    "lib-file": {
        install:function(source_el, plugin_dir, project_dir, plugin_id) {
            require('../../plugman').emit('verbose', 'lib-file.install is not supported for wp7');
        },
        uninstall:function(source_el, project_dir, plugin_id) {
            require('../../plugman').emit('verbose', 'lib-file.uninstall is not supported for wp7');
        }
    }
};

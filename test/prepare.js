/*
 *
 * Copyright 2013 Braden Shepherdson
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

var path = require('path'),
    shell = require('shelljs'),
    osenv = require('osenv'),
    et = require('elementtree'),
    test_dir = path.join(osenv.tmpdir(), 'test_plugman'),
    test_project_dir = path.join(test_dir, 'projects', 'android_one'),
    test_plugin_dir = path.join(test_dir, 'plugins', 'ChildBrowser'),
    xml_path = path.join(test_plugin_dir, 'plugin.xml'),
    plugin_loader = require(path.join(__dirname, '..', 'util', 'plugin_loader'));

exports.setUp = function(callback) {
    shell.mkdir('-p', test_dir);
    
    // copy the ios test project to a temp directory
    shell.cp('-r', path.join(__dirname, 'projects'), test_dir);

    // copy the ios test plugin to a temp directory
    shell.cp('-r', path.join(__dirname, 'plugins'), test_dir);

    // parse the plugin.xml into an elementtree object
    xml_text   = fs.readFileSync(xml_path, 'utf-8')
    plugin_et  = new et.ElementTree(et.XML(xml_text));

    callback();
}

exports.tearDown = function(callback) {
    // remove the temp files (projects and plugins)
    shell.rm('-rf', test_dir);
    callback();
}


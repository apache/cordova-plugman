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

var fs = require('fs')
  , path = require('path')
  , plist = require('plist')
  , xcode = require('xcode')
  , osenv = require('osenv')
  , shell = require('shelljs')
  , et = require('elementtree')
  , ios = require(path.join(__dirname, '..', 'platforms', 'ios'))

  , test_dir = path.join(osenv.tmpdir(), 'test_plugman')
  , test_project_dir = path.join(test_dir, 'projects', 'ios-config-xml')
  , test_plugin_dir = path.join(test_dir, 'plugins', 'ChildBrowser')
  , xml_path     = path.join(test_dir, 'plugins', 'ChildBrowser', 'plugin.xml')
  , xml_text, plugin_et

  , plugman = require('../plugman')
  , plugins_dir = path.join(test_dir, 'plugins')
  , silent = require('../util/test-helpers').suppressOutput

  //, assetsDir = path.resolve(config.projectPath, 'www')
  , srcDir = path.resolve(test_project_dir, 'SampleApp', 'Plugins')
  , resDir = path.resolve(test_project_dir, 'SampleApp', 'Resources');

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

exports['should remove webless plugin'] = function (test) {
    silent(function() {
        plugman.handlePlugin('install', 'ios', test_project_dir, 'WeblessPlugin', plugins_dir);
        plugman.handlePlugin('uninstall', 'ios', test_project_dir, 'WeblessPlugin', plugins_dir);
    });

    test.done();
}

exports['should remove the js file'] = function (test) {
    // run the platform-specific function
    silent(function() {
        plugman.handlePlugin('install', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
        plugman.handlePlugin('uninstall', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
    });

    var jsPath = path.join(test_dir, 'projects', 'ios-config-xml', 'plugins', 'com.phonegap.plugins.childbrowser', 'www', 'childbrowser.js');
    test.ok(!fs.existsSync(jsPath))
    test.done();
}

exports['should remove the source files'] = function (test) {
    // run the platform-specific function
    silent(function() {
        plugman.handlePlugin('install', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
        plugman.handlePlugin('uninstall', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
    });

    test.ok(!fs.existsSync(path.join(srcDir, 'ChildBrowserCommand.m')));
    test.ok(!fs.existsSync(path.join(srcDir, 'ChildBrowserViewController.m')));
    test.ok(!fs.existsSync(path.join(srcDir, 'src', 'ios', 'preserveDirs', 'PreserveDirsTest.m')));
    test.ok(!fs.existsSync(path.join(srcDir, 'targetDir', 'TargetDirTest.m')));
    test.done();
}

exports['should remove the header files'] = function (test) {
    // run the platform-specific function
    silent(function() {
        plugman.handlePlugin('install', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
        plugman.handlePlugin('uninstall', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
    });

    test.ok(!fs.existsSync(path.join(srcDir, 'ChildBrowserCommand.h')));
    test.ok(!fs.existsSync(path.join(srcDir, 'ChildBrowserViewController.h')));
    test.ok(!fs.existsSync(path.join(srcDir, 'src', 'ios', 'preserveDirs', 'PreserveDirsTest.h')));
    test.ok(!fs.existsSync(path.join(srcDir, 'targetDir', 'TargetDirTest.h')));
    test.done();
}

exports['should remove the xib file'] = function (test) {
    // run the platform-specific function
    silent(function() {
        plugman.handlePlugin('install', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
        plugman.handlePlugin('uninstall', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
    });

    test.ok(!fs.existsSync(path.join(resDir, 'ChildBrowserViewController.xib')));
    test.done();
}

exports['should remove the bundle'] = function (test) {
    // run the platform-specific function
    silent(function() {
        plugman.handlePlugin('install', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
        plugman.handlePlugin('uninstall', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
    });

    test.ok(!fs.existsSync(path.join(resDir, 'ChildBrowser.bundle')));
    test.done();
}

exports['should edit config.xml'] = function (test) {
    // run the platform-specific function
    silent(function() {
        plugman.handlePlugin('install', 'ios', test_project_dir, 'WebNotifications', plugins_dir);
        plugman.handlePlugin('uninstall', 'ios', test_project_dir, 'WebNotifications', plugins_dir);
    });

    var configXmlPath = path.join(test_project_dir, 'SampleApp', 'config.xml');
    var pluginsTxt = fs.readFileSync(configXmlPath, 'utf-8'),
        pluginsDoc = new et.ElementTree(et.XML(pluginsTxt)),
        expected = 'plugins/plugin[@name="WebNotifications"]' +
                    '[@value="WebNotifications"]';

    test.ok(!pluginsDoc.find(expected));
	test.equal(pluginsDoc.findall("access").length, 1, "/access");

    test.done();
}

exports['should remove custom config-file elements'] = function (test) {
    // setting up WebNotification (with config.xml) 
    var dummy_plugin_dir = path.join(test_dir, 'plugins', 'ChildBrowser')
    var dummy_xml_path = path.join(test_dir, 'plugins', 'ChildBrowser', 'plugin.xml')
    
    // overriding some params
    var dummy_plugin_et  = new et.ElementTree(et.XML(fs.readFileSync(dummy_xml_path, 'utf-8')));

    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, dummy_plugin_dir, dummy_plugin_et, { APP_ID: '1234'  });
    ios.handlePlugin('uninstall', test_project_dir, dummy_plugin_dir, dummy_plugin_et);
    
    var configPath = path.join(test_project_dir, 'SampleApp', 'SampleApp-Info.plist');
    var configPList = plist.parseFileSync(configPath);

    test.equal(configPList['AppId'], null);
    test.equal(configPList['CFBundleURLTypes'], null);
    test.done();
}

exports['should edit the pbxproj file'] = function (test) {
    // run the platform-specific function
    silent(function() {
        plugman.handlePlugin('install', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
        plugman.handlePlugin('uninstall', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
    });

    var projPath = path.join(test_project_dir, 'SampleApp.xcodeproj', 'project.pbxproj');

    obj = xcode.project(projPath).parseSync();
    var fileRefSection = obj.hash.project.objects['PBXFileReference'],
        fileRefLength = Object.keys(fileRefSection).length,
        EXPECTED_TOTAL_REFERENCES = 70; // magic number ahoy!

    test.equal(fileRefLength, EXPECTED_TOTAL_REFERENCES);
    test.done();
}

exports['should remove the framework references from the pbxproj file'] = function (test) {
    // run the platform-specific function
    silent(function() {
        plugman.handlePlugin('install', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
        plugman.handlePlugin('uninstall', 'ios', test_project_dir, 'ChildBrowser', plugins_dir);
    });

    var projPath = path.join(test_project_dir, 'SampleApp.xcodeproj', 'project.pbxproj'),
        projContents = fs.readFileSync(projPath, 'utf8'),
        projLines = projContents.split("\n"),
        references;

    references = projLines.filter(function (line) {
        return !!(line.match("libsqlite3.dylib"));
    })

    // should be four libsqlite3 reference lines added
    // pretty low-rent test eh
    test.equal(references.length, 0);
    test.done();
}

exports['should not uninstall a plugin that is not installed'] = function (test) {
    test.throws(function(){ios.handlePlugin('uninstall', test_project_dir, test_plugin_dir, plugin_et); }, 
                /not installed/
               );
    test.done();
}

exports['should skip collision check when installation is forced'] = function (test) {
    test.doesNotThrow(function(){ios.handlePlugin('uninstall-force', test_project_dir, test_plugin_dir, plugin_et); }, 
                /already installed/
               );
    test.done();
}

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
  , android = require(path.join(__dirname, '..', 'platforms', 'android'))
  , plugman = require('../plugman')
  , plugin_loader = require('../util/plugin_loader')
  , test_dir = path.join(osenv.tmpdir(), 'test_plugman')
  , test_project_dir = path.join(test_dir, 'projects', 'android_one')
  , test_plugin_dir = path.join(test_dir, 'plugins', 'ChildBrowser')
  , xml_path     = path.join(test_dir, 'plugins', 'ChildBrowser', 'plugin.xml')
  , plugins_dir = path.join(test_dir, 'plugins')
  , silent = require('../util/test-helpers').suppressOutput
  , xml_text, plugin_et;

describe('Installation on Cordova-Android 1.x projects', function() {
    beforeEach(function() {
        shell.mkdir('-p', test_dir);
        
        // copy the ios test project to a temp directory
        shell.cp('-r', path.join(__dirname, 'projects'), test_dir);

        // copy the ios test plugin to a temp directory
        shell.cp('-r', path.join(__dirname, 'plugins'), test_dir);

        // parse the plugin.xml into an elementtree object
        xml_text   = fs.readFileSync(xml_path, 'utf-8')
        plugin_et  = new et.ElementTree(et.XML(xml_text));
    });
    afterEach(function() {
        // remove the temp files (projects and plugins)
        shell.rm('-rf', test_dir);
    });

    it('should install webless plugin\'s native code', function () {
        // setting up a DummyPlugin
        silent(function() {
            plugman.handlePlugin('install', 'android', test_project_dir, 'WeblessPlugin', plugins_dir);
        });
        expect(fs.existsSync(path.join(test_project_dir, 'src', 'com', 'phonegap', 'plugins', 'weblessplugin', 'WeblessPlugin.java'))).toBe(true);
    });

    it('should copy the js file', function () {
        var pluginsPath = path.join(test_dir, 'plugins');
        var wwwPath = path.join(test_project_dir, 'assets', 'www');
        var jsPath = path.join(wwwPath, 'plugins', 'com.phonegap.plugins.childbrowser', 'www', 'childbrowser.js');

        silent(function() {
            plugman.handlePlugin('install', 'android', test_project_dir, 'ChildBrowser', plugins_dir);
        });

        expect(fs.existsSync(jsPath)).toBe(true);
    });

    it('should move asset files', function() {
        var wwwPath = path.join(test_project_dir, 'assets', 'www');

        silent(function() {
            plugman.handlePlugin('install', 'android', test_project_dir, 'ChildBrowser', plugins_dir);
        });

        var assetPath = path.join(wwwPath, 'childbrowser_file.html');

        expect(fs.existsSync(assetPath)).toBe(true);
    });

    it('should move asset directories', function () {
        var wwwPath = path.join(test_project_dir, 'assets', 'www');

        silent(function() {
            plugman.handlePlugin('install', 'android', test_project_dir, 'ChildBrowser', plugins_dir);
        });

        var assetPath = path.join(wwwPath, 'childbrowser');
        var assets = fs.statSync(assetPath);

        expect(assets.isDirectory()).toBe(true);
        expect(fs.existsSync(path.join(assetPath, 'image.jpg'))).toBe(true);
    });

    it('should add entries to the cordova_plugins.json file', function() {
        var wwwPath = path.join(test_project_dir, 'assets', 'www');

        silent(function() {
            plugman.handlePlugin('install', 'android', test_project_dir, 'ChildBrowser', plugins_dir);
        });

        var jsonPath = path.join(wwwPath, 'cordova_plugins.json');
        var content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    });

    exports['should move the src file'] = function (test) {
        var wwwPath = path.join(test_dir, 'projects', 'android_one', 'assets', 'www');

        silent(function() {
            plugman.handlePlugin('install', 'android', test_project_dir, 'ChildBrowser', plugins_dir);
        });

        var javaPath = path.join(test_dir, 'projects', 'android_one', 'src', 'com', 'phonegap', 'plugins', 'childBrowser', 'ChildBrowser.java');

        test.ok(fs.statSync(javaPath));
        test.done();
    }

    exports['should add ChildBrowser to plugins.xml'] = function (test) {
        silent(function() {
            plugman.handlePlugin('install', 'android', test_project_dir, 'ChildBrowser', plugins_dir);
        });

        var pluginsXmlPath = path.join(test_dir, 'projects', 'android_one', 'res', 'xml', 'plugins.xml');
        var pluginsTxt = fs.readFileSync(pluginsXmlPath, 'utf-8'),
            pluginsDoc = new et.ElementTree(et.XML(pluginsTxt)),
            expected = 'plugin[@name="ChildBrowser"]' +
                        '[@value="com.phonegap.plugins.childBrowser.ChildBrowser"]';

        test.ok(pluginsDoc.find(expected));
        test.done();
    }

    exports['should add ChildBrowser to AndroidManifest.xml'] = function (test) {
        silent(function() {
            plugman.handlePlugin('install', 'android', test_project_dir, 'ChildBrowser', plugins_dir);
        });

        var manifestPath = path.join(test_dir, 'projects', 'android_one', 'AndroidManifest.xml');
        var manifestTxt = fs.readFileSync(manifestPath, 'utf-8'),
            manifestDoc = new et.ElementTree(et.XML(manifestTxt)),
            activities = manifestDoc.findall('application/activity'), i;

        var found = false;
        for (i=0; i<activities.length; i++) {
            if ( activities[i].attrib['android:name'] === 'com.phonegap.plugins.childBrowser.ChildBrowser' ) {
                found = true;
                break;
            }
        }
        test.ok(found);
        test.done();
    }

    exports['should add whitelist hosts'] = function (test) {
        android.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });

        var pluginsXmlPath = path.join(test_dir, 'projects', 'android_one', 'res', 'xml', 'plugins.xml');
        var pluginsTxt = fs.readFileSync(pluginsXmlPath, 'utf-8'),
            pluginsDoc = new et.ElementTree(et.XML(pluginsTxt));

        test.equal(pluginsDoc.findall("access").length, 2, "/access");
        test.equal(pluginsDoc.findall("access")[0].attrib["origin"], "build.phonegap.com")
        test.equal(pluginsDoc.findall("access")[1].attrib["origin"], "12345.s3.amazonaws.com")
        test.done();
    }

    exports['should search/replace plugin.xml'] = function (test) {
        android.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });

        var pluginsXmlPath = path.join(test_dir, 'projects', 'android_one', 'res', 'xml', 'plugins.xml');
        var pluginsTxt = fs.readFileSync(pluginsXmlPath, 'utf-8'),
            pluginsDoc = new et.ElementTree(et.XML(pluginsTxt));

        test.equal(pluginsDoc.findall("access").length, 2, "/access");
        test.equal(pluginsDoc.findall("access")[0].attrib["origin"], "build.phonegap.com")
        test.equal(pluginsDoc.findall("access")[1].attrib["origin"], "12345.s3.amazonaws.com")
        test.done();
    }

    exports['should search/replace manifest.xml files'] = function (test) {
        android.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });

        var manifestXmlPath = path.join(test_dir, 'projects', 'android_one', 'AndroidManifest.xml');
        var manifestTxt = fs.readFileSync(manifestXmlPath, 'utf-8'),
            manifestDoc = new et.ElementTree(et.XML(manifestTxt));

        test.equal(manifestDoc.findall("appid")[0].attrib["value"], "12345")
        test.done();
    }
});


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
  , osenv = require('osenv')
  , shell = require('shelljs')
  , util = require('util')
  , plugin_loader = require('../util/plugin_loader')
  , plugman_exe = path.join(__dirname, '..', 'main.js')
  , test_dir = path.join(osenv.tmpdir(), 'test_plugman');

exports.setUp = function(callback) {
    shell.mkdir('-p', test_dir);
    callback();
}

exports.tearDown = function(callback) {
    // remove the temp files (projects and plugins)
    shell.rm('-rf', test_dir);
    callback();
}

exports['should list all plugins'] = function (test) {
    
    var command = util.format('%s %s --list', shell.which('node'), plugman_exe),
        options = {silent: true},
        ret = shell.exec(command, options); 
    test.equal(0, ret.code);
    test.ok(ret.output);
    test.done();

}

exports['should install and uninstall ios plugin'] = function (test) {
  var test_project_dir = path.join(test_dir, 'projects', 'ios-config-xml'),
      test_plugins_dir = path.join(test_dir, 'plugins'),
      srcDir = path.resolve(test_project_dir, 'SampleApp/Plugins'),
      srcPluginDir = path.join(__dirname, 'plugins', 'WebNotifications'),
      options = {silent: true},
      command;

    // copy the ios test project to a temp directory
    shell.cp('-r', path.join(__dirname, 'projects'), test_dir);

    // create the plugins dir to the temp directory
    shell.mkdir('-p', test_plugins_dir);
    
    command = util.format('%s %s --fetch --plugin %s --plugins_dir %s', shell.which('node'),
                                                                           plugman_exe, 
                                                                           srcPluginDir, 
                                                                           test_plugins_dir
                         ); 

    var ret = shell.exec(command, options); 
    test.equal(0, ret.code);
    
    command = util.format('%s %s --platform ios --project %s --plugin %s --plugins_dir %s', shell.which('node'),
                                                                           plugman_exe, 
                                                                           test_project_dir, 
                                                                           'WebNotifications',
                                                                           test_plugins_dir
                         ); 

    ret = shell.exec(command, options); 
    test.equal(0, ret.code);
    test.equal("plugin installed\n", ret.output);
 
                   
    test.ok(fs.existsSync(srcDir + '/WebNotifications.m'))
    test.ok(fs.existsSync(srcDir + '/WebNotifications.h'));
    
    command = util.format('%s %s --uninstall --platform ios --project %s --plugin %s --plugins_dir %s', shell.which('node'),
                                                                                    plugman_exe, 
                                                                                    test_project_dir, 
                                                                                    'WebNotifications', 
                                                                                    test_plugins_dir
                         ); 

    var ret = shell.exec(command, options); 
    test.equal(0, ret.code);
    test.equal("plugin uninstalled\n", ret.output);

    test.ok(!fs.existsSync(srcDir + '/WebNotifications.m'))
    test.ok(!fs.existsSync(srcDir + '/WebNotifications.h'));
   
    test.done();
}

exports['should revert ios install on failures'] = function (test) {
  var test_project_dir = path.join(test_dir, 'ios-config-xml'),
      test_plugin_dir = path.join(test_dir, 'FaultyPlugin'),
      srcDir = path.resolve(test_project_dir, 'SampleApp/Plugins'),
      options = {silent: true},
      command;

    // copy the ios test project to a temp directory
    shell.cp('-r', path.join(__dirname, 'projects', 'ios-config-xml'), test_dir);

    var plugins_dir = path.join(__dirname, 'plugins');

    command = util.format('%s %s --platform ios --project "%s" --plugin "%s" --plugins_dir "%s"', shell.which('node'), plugman_exe, test_project_dir, 'FaultyPlugin', plugins_dir);

    var ret = shell.exec(command, options);
    test.equal(0, ret.code);
    //console.log(ret.output);
    test.ok(!/plugin installed/.exec(ret.output));

    test.ok(!fs.existsSync(path.join(srcDir, 'FaultyPlugin.m')));
    test.ok(!fs.existsSync(path.join(srcDir, 'FaultyPlugin.h')));

    test.done();
}

exports['should install and uninstall android plugin'] = function (test) {
  var test_project_dir = path.join(test_dir, 'android_two'),
      options = {silent: true},
      command;

    // copy the ios test project to a temp directory
    shell.cp('-r', path.join(__dirname, 'projects', 'android_two'), test_dir);

    command = util.format('%s %s --platform android --project "%s" --plugin "%s" --plugins_dir "%s"', shell.which('node'), plugman_exe, test_project_dir, 'ChildBrowser', path.join(__dirname, 'plugins'));

    var ret = shell.exec(command, options);
    test.equal(0, ret.code);
    test.ok(ret.output.match(/plugin installed/));

    command = util.format('%s %s --uninstall --platform android --project "%s" --plugin "%s" --plugins_dir "%s"', shell.which('node'), plugman_exe, test_project_dir, 'ChildBrowser', path.join(__dirname, 'plugins'));

    var ret = shell.exec(command, options);
    test.equal(0, ret.code);
    test.ok(ret.output.match(/plugin uninstalled/));

    test.done();
}


exports['should display additional install info'] = function (test) {
  var test_project_dir = path.join(test_dir, 'android_two'),
      options = {silent: true},
      command;

    // copy the ios test project to a temp directory
    shell.cp('-r', path.join(__dirname, 'projects', 'android_two'), test_dir);

    command = util.format('%s %s --platform android --project "%s" --plugin "%s" --plugins_dir "%s"', shell.which('node'), plugman_exe, test_project_dir, 'ChildBrowser', path.join(__dirname, 'plugins'));

    var ret = shell.exec(command, options);
    test.equal(0, ret.code);
    test.ok(ret.output.match(/Please make sure you read this because it is very important to complete the installation of your plugin/));
    test.ok(ret.output.match(/plugin installed/));
    test.done();
}

// TODO: this module is seriously lacking tests

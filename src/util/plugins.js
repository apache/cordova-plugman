#!/usr/bin/env node
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

var http = require('http'),
    os = require('os'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    shell = require('shelljs');

module.exports = {
    searchAndReplace:require('./search-and-replace'),
    // Fetches plugin information from remote server
    clonePluginGitRepo:function(plugin_git_url, plugins_dir, callback) {
        if(!shell.which('git')) {
            var err = new Error('git command line is not installed');
            if (callback) callback(err);
            else throw err;
        }

        var plugin_dir = path.join(plugins_dir, path.basename(plugin_git_url).replace(path.extname(plugin_git_url), ''));

        // trash it if it already exists (something went wrong before probably)
        // TODO: is this the correct behaviour?
        if(fs.existsSync(plugin_dir)) {
            shell.rm('-rf', plugin_dir);
        }

        shell.exec('git clone ' + plugin_git_url + ' ' + plugin_dir, {silent: true, async:true}, function(code, output) {
            if (code > 0) {
                var err = new Error('failed to get the plugin via git from URL '+ plugin_git_url);
                if (callback) callback(err)
                else throw err;
            } else {
                if (callback) callback(null, plugin_dir);
            }
        });
    },
};


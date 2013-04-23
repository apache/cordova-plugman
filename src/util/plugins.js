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
    osenv = require('osenv'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    shell = require('shelljs'),
    remote = require(path.join(__dirname, '..', '..', 'config', 'remote'));

module.exports = {
    searchAndReplace:require('./search-and-replace'),
    // Fetches plugin information from remote server
    getPluginInfo:function(plugin_name, callback) {
        var responded = false;
        http.get(remote.url + util.format(remote.query_path, plugin_name), function(res) {
            var str = '';
            res.on('data', function (chunk) {
                str += chunk;
            });
            res.on('end', function () {
                responded = true;
                var response, plugin_info;
                if((response = JSON.parse(str)).rows.length == 1) {
                    plugin_info = response.rows[0].value;
                    callback(null, plugin_info);
                } else {
                    callback("Could not find information on "+plugin_name+" plugin");
                }
            });

        }).on('error', function(e) {
            callback(e);
        });

        setTimeout(function() {
            if (!responded) {
                console.log('timed out');
                callback('timed out')
            }
        }, 3000);
    },
    listAllPlugins:function(success, error) {
        http.get(remote.url + remote.list_path, function(res) {
          var str = '';
          res.on('data', function (chunk) {
            str += chunk;
          });
          res.on('end', function () {
              var plugins = (JSON.parse(str)).rows;
              success(plugins);
          });
          
        }).on('error', function(e) {
          console.log("Got error: " + e.message);
          error(e.message);
        });
    },
    clonePluginGitRepo:function(plugin_git_url, plugins_dir, callback) {
        if(!shell.which('git')) {
            var err = new Error('git command line is not installed');
            if (callback) callback(err);
            else throw err;
        }
        // use osenv to get a temp directory in a portable way
        var lastSlash = plugin_git_url.lastIndexOf('/');
        var basename = plugin_git_url.substring(lastSlash+1);
        var dotGitIndex = basename.lastIndexOf('.git');
        if (dotGitIndex >= 0) {
            basename = basename.substring(0, dotGitIndex);
        }

        var plugin_dir = path.join(plugins_dir, basename);

        // trash it if it already exists (something went wrong before probably)
        if(fs.existsSync(plugin_dir)) {
            shell.rm('-rf', plugin_dir);
        }

        shell.exec('git clone ' + plugin_git_url + ' ' + plugin_dir + ' 2>&1 1>/dev/null', {silent: true, async:true}, function(code, output) {
            if (code > 0) {
                var err = new Error('failed to get the plugin via git from URL '+ plugin_git_url);
                if (callback) callback(err)
                else throw err;
            } else {
                if (callback) callback(null);
            }
        });
    }
    // TODO add method for archives and other formats
    // extractArchive:function(plugin_dir) {
    // }

    // TODO add method to publish plugin from cli 
    // publishPlugin:function(plugin_dir) {
    // }

    // TODO add method to unpublish plugin from cli 
    // unpublishPlugin:function(plugin_dir) {
    // }
};





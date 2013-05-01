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
    // FIXME: this won't work on Windows OBVIOUSLY! Use node-zip to support?
    handleZipArchive:function(source, plugins_dir, callback) {
        
        if(!shell.which('unzip')) {
            var err = new Error('unzip command line is not installed');
            if (callback) callback(err);
            else throw err;
        }
        var basename = path.basename(source);
        
        var unzip = function(src, dst, callback) {
            var plugin_dir = path.join(plugins_dir, basename.replace(path.extname(source), ''));
            var util = require('util');
            shell.exec(util.format('unzip %s -d %s', src, dst), {silent: true, async:true}, function(code, output) {
                if (code != 0) {
                    var err = new Error('failed to extract the plugin zip archive '+ src+' Reason: '+output);
                    if (callback) callback(err);
                    else throw err;
                } else {
                    if (callback) callback(null, plugin_dir);
                }
            });
        };
        
        if(source.indexOf('http://') == 0) {
            var target = os.tmpdir() + basename;
            var file = fs.createWriteStream(target);
            var request = http.get(source, function(res) {
                if(res.statusCode != 200) {
                    var err = new Error('failed to fetch the plugin zip archive from '+ source);
                    if (callback) callback(err);
                    else throw err;
                } else {
                    res.pipe(file);
                    res.on('end', function() {
                        unzip(target, plugins_dir);
                    });
                }
            });

        } else {
            unzip(source, plugins_dir);
        }
    }
};


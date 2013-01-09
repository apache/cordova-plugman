#!/usr/bin/env node
// FIXME: change this quickly
var url = "http://ec2-184-72-173-33.compute-1.amazonaws.com";
var http = require('http'),
    osenv = require('osenv'),
    path = require('path'),
    fs = require('fs'),
    shell = require('shelljs');

// Fetches plugin information from remote server
exports.getPluginInfo = function(plugin_name, success, error) {
    http.get(url + "/cordova_plugins/_design/cordova_plugins/_view/by_name?key=\""+plugin_name+"\"", function(res) {
      var str = '';
      res.on('data', function (chunk) {
        str += chunk;
      });
      res.on('end', function () {
          var response, plugin_info;
          if((response = JSON.parse(str)).rows.length == 1) {
            plugin_info = response.rows[0].value;
            success(exports.clonePluginGitRepo(plugin_info.url));
          } else {
            error("Could not find information on "+plugin_dir+" plugin");
          }
      });
      
    }).on('error', function(e) {
      console.log("Got error: " + e.message);
      error(e.message);
    });
}

exports.listAllPlugins = function(plugin_name, success, error) {
    http.get(url + "/cordova_plugins/_design/cordova_plugins/_view/by_name", function(res) {
      var str = '';
      res.on('data', function (chunk) {
        str += chunk;
      });
      res.on('end', function () {
          var plugins = (JSON.parse(str)).rows, i, j;
          for(i = 0, j = plugins.length ; i < j ; i++) {
            console.log(plugins[i].value.name, '-', plugins[i].value.description);
          }
      });
      
    }).on('error', function(e) {
      console.log("Got error: " + e.message);
      error(e.message);
    });
}

exports.clonePluginGitRepo = function(plugin_dir) {
    if(!shell.which('git')) {
        throw new Error('git command line is not installed');
    }
    // use osenv to get a temp directory in a portable way
    plugin_git_url = plugin_dir; 
    plugin_dir = path.join(osenv.tmpdir(), 'plugin');

    if(shell.exec('git clone ' + plugin_git_url + ' ' + plugin_dir + ' 2>&1 1>/dev/null').code != 0) {
        throw new Error('failed to get the plugin via git URL', plugin_git_url);
    }
    
    process.on('exit', function() {
        console.log('cleaning up...');
        // clean up
        if(fs.existsSync(plugin_dir)) {
            shell.rm('-rf', plugin_dir);
        }
    });

    return plugin_dir;
}

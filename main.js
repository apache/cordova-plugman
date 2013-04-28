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

// copyright (c) 2013 Andrew Lunny, Adobe Systems
var path = require('path')
    , url = require('url')
    , package = require(path.join(__dirname, 'package'))
    , nopt = require('nopt')
    , plugins = require('./src/util/plugins')
    , plugman = require('./plugman');

var known_opts = { 'platform' : [ 'ios', 'android', 'blackberry', 'wp7', 'wp8' ]
            , 'project' : path
            , 'plugin' : [String, path, url]
            , 'install' : Boolean
            , 'uninstall' : Boolean
            , 'fetch' : Boolean
            , 'list' : Boolean
            , 'v' : Boolean
            , 'debug' : Boolean
            , 'prepare' : Boolean
            , 'plugins': path
            , 'link': Boolean
            , 'variable' : Array
            }, shortHands = { 'var' : 'variable' };

var cli_opts = nopt(known_opts);

// Default the plugins_dir to './cordova/plugins'.
var plugins_dir;

// Without these arguments, the commands will fail and print the usage anyway.
if (cli_opts.plugins_dir || cli_opts.project) {
    plugins_dir = typeof cli_opts.plugins_dir == 'string' ?
        cli_opts.plugins_dir :
        path.join(cli_opts.project, 'cordova', 'plugins');
}

process.on('uncaughtException', function(error){
    console.error(error.stack);
    process.exit(1);
});

if (cli_opts.v) {
    console.log(package.name + ' version ' + package.version);
}
else if (cli_opts.list) {
    plugins.listAllPlugins(function(plugins) {
        for(var i = 0, j = plugins.length ; i < j ; i++) {
            console.log(plugins[i].value.name, '-', plugins[i].value.description);
        }
    });
}
else if (cli_opts.prepare && cli_opts.project) {
    plugman.prepare(cli_opts.project, cli_opts.platform, plugins_dir);
}
else if (cli_opts.fetch) {
    plugman.fetch(cli_opts.plugin, plugins_dir, cli_opts.link);
}
else if (!cli_opts.platform || !cli_opts.project || !cli_opts.plugin) {
    printUsage();
}
else if (cli_opts.uninstall) {
    plugman.uninstall(cli_opts.platform, cli_opts.project, cli_opts.plugin, plugins_dir);
}
else {
    var cli_variables = {}
    if (cli_opts.variable) {
        cli_opts.variable.forEach(function (variable) {
            var tokens = variable.split('=');
            var key = tokens.shift().toUpperCase();
            if (/^[\w-_]+$/.test(key)) cli_variables[key] = tokens.join('=');
        });
    }
    plugman.install(cli_opts.platform, cli_opts.project, cli_opts.plugin, plugins_dir, cli_variables);
}

function printUsage() {
    platforms = known_opts.platform.join('|');
    console.log('Usage\n---------');
    console.log('Fetch a plugin:\n\t' + package.name + ' --fetch --plugin <directory|git-url|name> [--plugins_dir <directory>]\n');
    console.log('Install an already fetched plugin:\n\t' + package.name + ' --platform <'+ platforms +'> --project <directory> --plugin <name> [--plugins_dir <directory>]\n');
    console.log('Uninstall a plugin:\n\t' + package.name + ' --uninstall --platform <'+ platforms +'> --project <directory> --plugin <name> [--plugins_dir <directory>]\n');
    console.log('List plugins:\n\t' + package.name + ' --list [--plugins_dir <directory>]\n');
    console.log('Prepare project:\n\t' + package.name + ' --prepare --platform <ios|android|bb10> --project <directory> [--plugins_dir <directory>]');
    console.log('\n\t--plugins_dir defaults to <project>/cordova/plugins, but can be any directory containing a subdirectory for each plugin');
}



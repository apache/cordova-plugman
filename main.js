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
    , registry = require('plugman-registry')
    , config = require('./config')
    , plugman = require('./plugman');

var known_opts = { 'platform' : [ 'ios', 'android', 'blackberry10', 'wp7', 'wp8' ]
            , 'project' : path
            , 'plugin' : [String, path, url]
            , 'install' : Boolean
            , 'uninstall' : Boolean
            , 'adduser' : Boolean
            , 'publish' : Boolean 
            , 'unpublish' : Boolean 
            , 'search' : String
            , 'v' : Boolean
            , 'debug' : Boolean
            , 'plugins': path
            , 'link': Boolean
            , 'variable' : Array
            , 'www': path
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
else if ((cli_opts.install || cli_opts.uninstall || cli_opts.argv.original.length == 0) && (!cli_opts.platform || !cli_opts.project || !cli_opts.plugin)) {
    printUsage();
}
else if (cli_opts.uninstall) {
    plugman.uninstall(cli_opts.platform, cli_opts.project, cli_opts.plugin, plugins_dir, { www_dir: cli_opts.www });
}
else if (cli_opts.adduser) {
  registry.use(config.registry, function(err) {
    registry.adduser(null, function(err) {
      if(err) return console.log(err);
      console.log('user added');
    });
  });
}
else if (cli_opts.publish) {
  registry.use(config.registry, function(err) {
    registry.publish([cli_opts.plugin], function(err, d) {
      if(err) return console.log('Error publishing plugin'); 
      console.log('plugin published');
    });
  });
}
else if (cli_opts.unpublish) {
  registry.use(config.registry, function(err) {
    registry.unpublish([cli_opts.plugin, '--force'], function(err, d) {
      if(err) return console.log('Error unpublishing plugin'); 
      console.log('plugin unpublished');
    });
  });
}
else if (cli_opts.search) {
  registry.use(config.registry, function(err) {
    registry.search(cli_opts.search.split(','), function(err, d) {
      if(err) return console.log(err); 
    });
  });
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
    var opts = {
        subdir: '.',
        cli_variables: cli_variables,
        www_dir: cli_opts.www
    };
    plugman.install(cli_opts.platform, cli_opts.project, cli_opts.plugin, plugins_dir, opts);
}

function printUsage() {
    platforms = known_opts.platform.join('|');
    console.log('Usage\n-----');
    console.log('Install a plugin (will fetch if cannot be found):\n\t' + package.name + ' --platform <'+ platforms +'> --project <directory> --plugin <name|path|url> [--www <directory>] [--plugins_dir <directory>] [--variable <name>=<value>]\n');
    console.log('Uninstall a plugin:\n\t' + package.name + ' --uninstall --platform <'+ platforms +'> --project <directory> --plugin <id> [--www <directory>] [--plugins_dir <directory>]\n');
    console.log('\t--plugins_dir defaults to <project>/cordova/plugins, but can be any directory containing a subdirectory for each plugin');
    console.log('\n\t--www defaults to the project\'s www folder, but can be any directory where web assets should be installed into\n');
    console.log('Add a user account to the registry:\n\t' + package.name + ' --adduser\n');
    console.log('Publish a plugin:\n\t' + package.name + ' --publish --plugin plugin_directory\n');
    console.log('Unpublish a plugin:\n\t' + package.name + ' --unpublish --plugin plugin_name@version\n');
    console.log('Search for plugins:\n\t' + package.name + ' --search keyword1,keyword2,...\n');
}

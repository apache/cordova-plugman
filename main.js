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
    , Q = require('q')
    , plugman = require('./plugman');

var known_opts = { 'platform' : [ 'ios', 'android', 'amazon-fireos', 'blackberry10', 'wp7', 'wp8' , 'windows8', 'firefoxos' ]
        , 'project' : path
        , 'plugin' : [String, path, url]
        , 'version' : Boolean
        , 'help' : Boolean
        , 'debug' : Boolean
        , 'silent' : Boolean
        , 'plugins': path
        , 'link': Boolean
        , 'variable' : Array
        , 'www': path
        , 'searchpath' : [path, Array]
}, shortHands = { 'var' : ['--variable'], 'v': ['--version'], 'h': ['--help'] };

var nopt = nopt(known_opts, shortHands);

// TODO: get from cordova-lib
var command = {
    flags: {},
    arguments: [],
    remain: nopt.argv.remain
};
for (var opt in nopt) {
    if (opt !== 'argv')
        command.flags[opt] = nopt[opt];
}
var parsedArgs = nopt.argv.cooked;
for(var i in parsedArgs) {
    if(parsedArgs[i].substr(0, 1) !== '-')
        command.arguments.push(parsedArgs[i]);
}

var options = command.flags;

process.on('uncaughtException', function(error) {
    if (options.debug) {
        console.error(error.stack);
    } else {
        console.error(error.message);
    }
    process.exit(1);
});

// Set up appropriate logging based on events
if (options.debug) {
    plugman.on('verbose', console.log);
}

if (!options.silent) {
    plugman.on('log', console.log);
    plugman.on('warn', console.warn);
    plugman.on('results', console.log);
}

plugman.on('error', console.error);

var cmd = command.arguments[0] || '';

if (options.version) {
    console.log(package.name + ' version ' + package.version);
} else if (options.help) {
    console.log(plugman.help());
} else if (plugman.commands[cmd]) {
    var result = plugman.commands[cmd](command);
    if (result && Q.isPromise(result)) {
        result.done();
    }
} else {
    console.log(plugman.help());
}

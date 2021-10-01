/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

// copyright (c) 2013 Andrew Lunny, Adobe Systems

// Register custom fail handler for uncaughtException event
process.on('uncaughtException', fail);

// On unhandled promise rejection, log it to STDERR and exit with code 1
require('loud-rejection/register');

const url = require('url');
const path = require('path');

const nopt = require('nopt');

const pkg = require('./package');
const help = require('./src/help');
const commands = require('./src/commands');
const plugman = require('./plugman');
const { cordova_platforms } = require('cordova-lib');

const knownPlatforms = Object.keys(cordova_platforms);

const known_opts = {
    platform: knownPlatforms,
    platform_name: knownPlatforms,
    project: path,
    plugin: [String, path, url, Array],
    version: Boolean,
    help: Boolean,
    debug: Boolean,
    silent: Boolean,
    plugins: path,
    link: Boolean,
    variable: Array,
    www: path,
    searchpath: [path, Array],
    save: Boolean,
    name: String,
    plugin_id: String,
    plugin_version: String,
    plugins_dir: String
};
const shortHands = { var: ['--variable'], v: ['--version'], h: ['--help'] };

const cli_opts = nopt(known_opts, shortHands);

const cmd = cli_opts.argv.remain.shift();

// Without these arguments, the commands will fail and print the usage anyway.
if (cli_opts.plugins_dir || cli_opts.project) {
    cli_opts.plugins_dir = typeof cli_opts.plugins_dir === 'string'
        ? cli_opts.plugins_dir
        : path.join(cli_opts.project, 'cordova', 'plugins');
}

// Set up appropriate logging based on events
if (cli_opts.debug) {
    plugman.on('verbose', console.log);
}

if (!cli_opts.silent) {
    plugman.on('log', console.log);
    plugman.on('warn', console.warn);
    plugman.on('results', console.log);
}

plugman.on('error', console.error);

if (cli_opts.version) {
    console.log(pkg.version);
} else if (cli_opts.help) {
    console.log(help(commands[cmd] ? cmd : 'summary'));
} else if (commands[cmd]) {
    Promise.resolve(commands[cmd](cli_opts))
        .catch(fail);
} else {
    console.log(help());
    process.exitCode = 1;
}

function fail (error) {
    console.error(error.message);
    if (cli_opts && cli_opts.debug) {
        console.error(error.stack);
    }
    process.exitCode = 1;
}

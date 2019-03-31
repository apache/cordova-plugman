/*
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

const { plugman } = require('cordova-lib');

module.exports = {
    'config': function (cli_opts) {
        plugman.config(cli_opts.argv.remain, function (err) {
            if (err) throw err;
            else console.log('done');
        });
    },
    'owner': function (cli_opts) {
        plugman.owner(cli_opts.argv.remain);
    },
    'install': function (cli_opts) {
        if (!cli_opts.platform || !cli_opts.project || !cli_opts.plugin) {
            return console.log(plugman.help());
        }
        var cli_variables = {};

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
            save: cli_opts.save || false,
            www_dir: cli_opts.www,
            searchpath: cli_opts.searchpath,
            link: cli_opts.link,
            projectRoot: cli_opts.project,
            force: cli_opts.force || false,
            nohooks: cli_opts.nohooks || false
        };
        var p = Promise.resolve();
        cli_opts.plugin.forEach(function (pluginSrc) {
            p = p.then(function () {
                return plugman.install(cli_opts.platform, cli_opts.project, pluginSrc, cli_opts.plugins_dir, opts);
            });
        });

        return p;
    },
    'uninstall': function (cli_opts) {
        if (!cli_opts.platform || !cli_opts.project || !cli_opts.plugin) {
            return console.log(plugman.help());
        }

        var p = Promise.resolve();
        cli_opts.plugin.forEach(function (pluginSrc) {
            var opts = {
                www_dir: cli_opts.www,
                save: cli_opts.save || false,
                projectRoot: cli_opts.project
            };
            p = p.then(function () {
                return plugman.uninstall(cli_opts.platform, cli_opts.project, pluginSrc, cli_opts.plugins_dir, opts);
            });
        });

        return p;
    },
    'search': function (cli_opts) {
        plugman.search(cli_opts.argv.remain, function (err, plugins) {
            if (err) throw err;
            else {
                for (var plugin in plugins) {
                    console.log(plugins[plugin].name, '-', plugins[plugin].description || 'no description provided');
                }
            }
        });
    },
    'info': function (cli_opts) {
        plugman.info(cli_opts.argv.remain, function (err, plugin_info) {
            if (err) throw err;
            else {
                console.log('name:', plugin_info.name);
                console.log('version:', plugin_info.version);
                if (plugin_info.engines) {
                    for (var i = 0, j = plugin_info.engines.length; i < j; i++) {
                        console.log(plugin_info.engines[i].name, 'version:', plugin_info.engines[i].version);
                    }
                }
            }
        });
    },
    'publish': function () {
        plugman.emit('error', 'The publish functionality is not supported anymore since the Cordova Plugin registry\n' +
            'is moving to read-only state. For publishing use corresponding \'npm\' commands.\n\n' +
            'If for any reason you still need for \'plugman publish\' - consider downgrade to plugman@0.23.3');
    },
    'unpublish': function (cli_opts) {
        plugman.emit('error', 'The publish functionality is not supported anymore since the Cordova Plugin registry\n' +
            'is moving to read-only state. For publishing/unpublishing use corresponding \'npm\' commands.\n\n' +
            'If for any reason you still need for \'plugman unpublish\' - consider downgrade to plugman@0.23.3');
    },
    'create': function (cli_opts) {
        if (!cli_opts.name || !cli_opts.plugin_id || !cli_opts.plugin_version) {
            return console.log(plugman.help());
        }
        var cli_variables = {};
        if (cli_opts.variable) {
            cli_opts.variable.forEach(function (variable) {
                var tokens = variable.split('=');
                var key = tokens.shift().toUpperCase();
                if (/^[\w-_]+$/.test(key)) cli_variables[key] = tokens.join('=');
            });
        }
        plugman.create(cli_opts.name, cli_opts.plugin_id, cli_opts.plugin_version, cli_opts.path || '.', cli_variables);
    },
    'platform': function (cli_opts) {
        var operation = cli_opts.argv.remain[ 0 ] || '';
        if ((operation !== 'add' && operation !== 'remove') || !cli_opts.platform_name) {
            return console.log(plugman.help());
        }
        plugman.platform({ operation: operation, platform_name: cli_opts.platform_name });
    },
    'createpackagejson': function (cli_opts) {
        var plugin_path = cli_opts.argv.remain[0];
        if (!plugin_path) {
            return console.log(plugman.help());
        }
        plugman.createpackagejson(plugin_path);
    }
};

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

var emitter = require('./src/events');

function addProperty(o, symbol, modulePath, doWrap) {
    var val = null;

    if (doWrap) {
        o[symbol] = function() {
            val = val || require(modulePath);
            if (arguments.length && typeof arguments[arguments.length - 1] === 'function') {
                // If args exist and the last one is a function, it's the callback.
                var args = Array.prototype.slice.call(arguments);
                var cb = args.pop();
                val.apply(o, args).done(cb, cb);
            } else {
                val.apply(o, arguments).done(null, function(err){ throw err; });
            }
        };
    } else {
        // The top-level plugman.foo
        Object.defineProperty(o, symbol, {
            get : function() { return val = val || require(modulePath); },
            set : function(v) { val = v; }
        });
    }

    // The plugman.raw.foo
    Object.defineProperty(o.raw, symbol, {
        get : function() { return val = val || require(modulePath); },
        set : function(v) { val = v; }
    });
}

plugman = emitter;
plugman.on = emitter.addListener;
plugman.off = emitter.removeListener;
plugman.raw = {};
plugman.cloneOptions = function(options, newOpt) {
	var opt = {}, o;
	for(o in options)
		opt[o] = options[o];

	newOpt = newOpt || {};
	for(o in newOpt)
		opt[o] = newOpt[o];

	return opt;
};

addProperty(plugman, 'help', './src/help');
addProperty(plugman, 'install', './src/install', true);
addProperty(plugman, 'uninstall', './src/uninstall', true);
addProperty(plugman, 'fetch', './src/fetch', true);
addProperty(plugman, 'prepare', './src/prepare');
addProperty(plugman, 'config', './src/config', true);
addProperty(plugman, 'owner', './src/owner', true);
addProperty(plugman, 'adduser', './src/adduser', true);
addProperty(plugman, 'publish', './src/publish', true);
addProperty(plugman, 'unpublish', './src/unpublish', true);
addProperty(plugman, 'search', './src/search', true);
addProperty(plugman, 'info', './src/info', true);
addProperty(plugman, 'config_changes', './src/util/config-changes');

plugman.commands =  {
    'config'   : function(command) {
        plugman.config(command.remain, function(err) {
            if (err) throw err;
            else console.log('done');
        });
    },
    'owner'   : function(command) {
        plugman.owner(command.remain);
    },
    'install'  : function(command) {
        var options = checkOptions(command.flag);

        if(!options.platform || !options.project || !options.plugin) {
            return console.log(plugman.help());
        }
        var cli_variables = {}
        if (options.variable) {
            options.variable.forEach(function (variable) {
                    var tokens = variable.split('=');
                    var key = tokens.shift().toUpperCase();
                    if (/^[\w-_]+$/.test(key)) cli_variables[key] = tokens.join('=');
                    });
        }

        options.subdir = '.'; 
        options.cli_variables = cli_variables;
        options.www_dir = options.www;

        return plugman.install(options.platform, options.project, options.plugin, options.plugins_dir, options);
    },
    'uninstall': function(command) {
        var options = command.flag;

        if(!options.platform || !options.project || !options.plugin) {
            return console.log(plugman.help());
        }
        options.www_dir = options.www;

        return plugman.uninstall(options.platform, options.project, options.plugin, options.plugins_dir, options);
    },
    'adduser'  : function(command) {
        plugman.adduser(function(err) {
            if (err) throw err;
            else console.log('user added');
        });
    },

    'search'   : function(command) {
        plugman.search(command.remain, function(err, plugins) {
            if (err) throw err;
            else {
                for(var plugin in plugins) {
                    console.log(plugins[plugin].name, '-', plugins[plugin].description || 'no description provided');
                }
            }
        });
    },
    'info'     : function(command) {
        plugman.info(command.remain, function(err, plugin_info) {
            if (err) throw err;
            else {
                console.log('name:', plugin_info.name);
                console.log('version:', plugin_info.version);
                if (plugin_info.engines) {
                    for(var i = 0, j = plugin_info.engines.length ; i < j ; i++) {
                        console.log(plugin_info.engines[i].name, 'version:', plugin_info.engines[i].version);
                    }
                }
            }
        });
    },

    'publish'  : function(command) {
        var plugin_path = command.remain;
        if(!plugin_path) {
            return console.log(plugman.help());
        }
        plugman.publish(plugin_path, function(err) {
            if (err) throw err;
            else console.log('Plugin published');
        });
    },

    'unpublish': function(command) {
        var plugin = command.remain;
        if(!plugin) {
            return console.log(plugman.help());
        }
        plugman.unpublish(plugin, function(err) {
            if (err) throw err;
            else console.log('Plugin unpublished');
        });
    }
};

module.exports = plugman;

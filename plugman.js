#!/usr/bin/env node

// copyright (c) 2013 Andrew Lunny, Adobe Systems
var fs = require('fs')
  , path = require('path')
  , url = require('url')
  , package = require(path.join(__dirname, 'package'))
  , et = require('elementtree')
  , nopt = require('nopt')
  , plugins = require('./util/plugins')
  , platform_modules = {
        'android': require('./platforms/android'),
        'ios': require('./platforms/ios'),
        'bb10': require('./platforms/bb10'),
        'www': require('./platforms/www')
    };

var known_opts = { 'platform' : [ 'ios', 'android', 'bb10' ,'www' ]
            , 'project' : path
            , 'plugin' : [String, path, url]
            , 'remove' : Boolean
            , 'list' : Boolean
            , 'v' : Boolean
            , 'debug' : Boolean
            };

var cli_opts = nopt(known_opts);

// only dump stack traces in debug mode, otherwise show error message and exit
if (!cli_opts.debug) {
    // provide clean output on exceptions rather than dumping a stack trace
    process.on('uncaughtException', function(error){
        console.error(error + '\n');
        process.exit(1);
    });
}

if (cli_opts.v) {
    console.log(package.name + ' version ' + package.version);
}
else if (cli_opts.list) {
    plugins.listAllPlugins();
}
else if (!cli_opts.platform || !cli_opts.project || !cli_opts.plugin) {
    printUsage();
}
else if (cli_opts.remove) {
    handlePlugin('uninstall', cli_opts.platform, cli_opts.project, cli_opts.plugin);
}
else {
    handlePlugin('install', cli_opts.platform, cli_opts.project, cli_opts.plugin);
}

function printUsage() {
    platforms = known_opts.platform.join('|');
    console.log('Usage\n---------');
    console.log('Add a plugin:\n\t' + package.name + ' --platform <'+ platforms +'> --project <directory> --plugin <directory|git-url|name>\n');
    console.log('Remove a plugin:\n\t' + package.name + ' --remove --platform <'+ platforms +'> --project <directory> --plugin <directory|git-url|name>\n');
    console.log('List plugins:\n\t' + package.name + ' --list\n');
}

function execAction(action, platform, project_dir, plugin_dir) {
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , xml_text     = fs.readFileSync(xml_path, 'utf-8')
      , plugin_et   = new et.ElementTree(et.XML(xml_text));
    
    // run the platform-specific function
    platform_modules[platform].handlePlugin(action, project_dir, plugin_dir, plugin_et);
    
    console.log('plugin ' + action + 'ed');
}

function handlePlugin(action, platform, project_dir, plugin_dir) {
    var plugin_xml_path, async = false;

    // clone from git repository
    if(plugin_dir.indexOf('https://') == 0 || plugin_dir.indexOf('git://') == 0) {
        plugin_dir = plugins.clonePluginGitRepo(plugin_dir);
    }

    plugin_xml_path = path.join(plugin_dir, 'plugin.xml');
    if (!fs.existsSync(plugin_xml_path)) {
        // try querying the plugin database
        async = true;
        plugins.getPluginInfo(plugin_dir,
            function(plugin_dir) {
                execAction(action, platform, project_dir, plugin_dir);
            },
            function(e) {
                throw new Error(action + ' failed. "' + plugin_xml_path + '" not found');
            }
        );
    }

    if (!platform_modules[platform]) {
        throw { name: "Platform Error", message: platform + " not supported" }
    }

    // check arguments and resolve file paths
    if(!async) {
        execAction(action, platform, project_dir, plugin_dir);
    }
}


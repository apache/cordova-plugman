#!/usr/bin/env node

// copyright (c) 2012 Andrew Lunny, Adobe Systems
var shell = require('shelljs')
  , osenv = require('osenv')
  , fs = require('fs')
  , path = require('path')
  , package = require(path.join(__dirname, 'package'))
  , et = require('elementtree')
  , nopt = require('nopt')
  , platform_modules = {
        'android': require('./platforms/android'),
        'ios': require('./platforms/ios'),
        'www': require('./platforms/www')
    };

var known_opts = { 'platform' : [ 'ios', 'android', 'www' ]
            , 'project' : path
            , 'plugin' : path
            , 'remove' : Boolean
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
    console.log('Add a plugin:\n\t' + package.name + ' --platform <'+ platforms +'> --project <directory> --plugin <directory>\n');
    console.log('Remove a plugin:\n\t' + package.name + ' --remove --platform <'+ platforms +'> --project <directory> --plugin <directory>\n');
} 

function handlePlugin(action, platform, project_dir, plugin_dir) {
    var plugin_git_url, plugin_xml_path;

    // clone from git repository
    if(plugin_dir.indexOf('https://') == 0 || plugin_dir.indexOf('git://') == 0) {
        if(!shell.which('git')) {
            throw new Error('git command line is not installed');
        }
        // use osenv to get a temp directory in a portable way
        plugin_git_url = plugin_dir; 
        plugin_dir = path.join(osenv.tmpdir(), 'plugin');

        if(shell.exec('git clone ' + plugin_url + ' ' + plugin_dir).code != 0) {
            throw new Error('failed to get the plugin via git URL', plugin_url);
        }
    }

    plugin_xml_path = path.join(plugin_dir, 'plugin.xml');
    if (!fs.existsSync(plugin_xml_path)) {
        throw new Error(action + ' failed. "' + plugin_xml_path + '" not found');
    }

    if (!platform_modules[platform])
        throw { name: "Platform Error", message: platform + " not supported" }

    // check arguments and resolve file paths
    var xml_path     = path.join(plugin_dir, 'plugin.xml')
      , xml_text     = fs.readFileSync(xml_path, 'utf-8')
      , plugin_et   = new et.ElementTree(et.XML(xml_text));

    // run the platform-specific function
    platform_modules[platform].handlePlugin(action, project_dir, plugin_dir, plugin_et);

    console.log('plugin ' + action + 'ed');
}

#!/usr/bin/env node
var pluginstall = require('./pluginstall'),
    spawn = require('child_process').spawn,
    action = 'install',
    platform, projectDir, pluginDir,
    config, plugin, package,
    gitProc;
if (process.argv[0] == 'node') {
    process.argv.shift();
}

function processPlugin(action, platform, projectDir, pluginDir) {
    config = pluginstall.init(platform, projectDir, pluginDir);
    plugin = pluginstall.parseXml(config);

    pluginstall[action+"Plugin"](config, plugin, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('plugin '+action+'ed');
        }
    });
}

process.argv.shift(); // skip "cli.js"

if (process.argv.length == 0) {
    console.log('Usage: pluginstall [-d] platform project_directory plugin_directory');
} else if (process.argv[0] === '-v') {
    package = require('./package')
    console.log('pluginstall version ' + package.version);
} else {
    if(process.argv[0] === "-d") {
        action = "uninstall";
        process.argv.shift();
    }
    platform = process.argv.shift();
    projectDir = process.argv.shift();
    pluginDir = process.argv.shift();

    // clone from git repository
    if(pluginDir.indexOf('https://') == 0 || pluginDir.indexOf('git://') == 0) {
        // FIXME: need to find a portable way to get the os temporary directory 
        tmpPluginDir = '/tmp/plugin';
        gitProc = spawn('git', ['clone', pluginDir, tmpPluginDir], {cwd: '/tmp'});
        gitProc.on('exit', function(code) {
            if(code != 0) {
                console.log('plugin not installed!');
            } else {
                processPlugin(action, platform, projectDir, tmpPluginDir);
            }
        });
        process.on('exit', function(code) {
            spawn('rm', ['-rf', tmpPluginDir]);
        });
    // or use local path
    } else {
        processPlugin(action, platform, projectDir, pluginDir);
    }
}

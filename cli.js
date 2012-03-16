#!/usr/bin/env node
var pluginstall = require('./pluginstall'),
    platform, projectDir, pluginDir,
    config, plugin, package;

if (process.argv[0] == 'node') process.argv.shift()

process.argv.shift() // skip "cli.js"

if (process.argv.length == 0) {
    console.log('Usage: pluginstall [platform] [project directory] [plugin directory]')
} else if (process.argv[0] === '-v') {
    package = require('./package')
    console.log('pluginstall version ' + package.version)
} else {
    platform = process.argv.shift()
    projectDir = process.argv.shift()
    pluginDir = process.argv.shift()

    config = pluginstall.init(platform, projectDir, pluginDir)
    plugin = pluginstall.parseXml(config)

    pluginstall.installPlugin(config, plugin, function (err) {
        if (err) {
            console.error(err)
        } else {
            console.log('plugin installed')
        }
    });
}

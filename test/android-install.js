var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf')
    pluginstall = require('../pluginstall'),
    android = require('../platforms/android'),
    config = {
        platform: 'android',
        projectPath: fs.realpathSync('test/project'),
        pluginPath: fs.realpathSync('test/plugin')
    },
    plugin = pluginstall.parseXml(config),
    assetsDir = path.resolve(config.projectPath, 'assets/www'),
    jsPath = assetsDir + '/childbrowser.js',
    assetPath = assetsDir + '/childbrowser'

// global setup
exports.setUp = function (callback) {
    fs.stat(jsPath, function (err, stats) {
        if (stats) {
            fs.unlinkSync(jsPath)
        }

        fs.stat(assetPath, function (err, stat) {
            if (err && err.code == 'ENOENT') {
                callback()
            } else {
                rimraf(assetPath, function () {
                    callback()
                });
            }
        })
    })
}

exports['should move the js file'] = function (test) {
    android.installPlugin(config, plugin, function (err) {
        test.ok(fs.statSync(jsPath))
        test.done();
    })
}

exports['should move the directory'] = function (test) {
    android.installPlugin(config, plugin, function (err) {
        var assets = fs.statSync(assetPath);

        test.ok(assets.isDirectory())
        test.ok(fs.statSync(assetPath + '/image.jpg'))
        test.done();
    })
}

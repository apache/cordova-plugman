var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),

    pluginstall = require('../pluginstall'),
    www = require('../platforms/www'),
    nCallbacks = require('../util/ncallbacks'),

    config = {
        platform: 'www',
        projectPath: fs.realpathSync('test/project/www-only'),
        pluginPath: fs.realpathSync('test/plugin')
    },
    plugin = pluginstall.parseXml(config),
    assetsDir = path.resolve(config.projectPath),
    jsPath = assetsDir + '/childbrowser.js';

exports.setUp = function (callback) {
    var ASYNC_OPS = 2,
        end = nCallbacks(ASYNC_OPS, callback);

    rimraf(assetsDir + '/childbrowser', end)
    unlinkIfThere(jsPath, end)
}

exports['should move the js file'] = function (test) {
    www.installPlugin(config, plugin, function (err) {
        test.ok(fs.statSync(jsPath))
        test.done();
    })
}

exports['should move the directory'] = function (test) {
    www.installPlugin(config, plugin, function (err) {
        var assetPath = path.resolve(config.projectPath, "childbrowser/")
        var assets = fs.statSync(assetPath);
        test.ok(assets.isDirectory())
        test.ok(fs.statSync(assetPath + '/image.jpg'))
        test.done();
    })
}

function unlinkIfThere(filepath, cb) {
    fs.stat(filepath, function (err, stat) {
        if (err) {
            cb(null);
            return;
        }

        if (stat)
            fs.unlinkSync(filepath);

        cb(null);
    })
}
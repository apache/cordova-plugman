var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf')
    pluginstall = require('../pluginstall'),
    android = require('../platforms/android'),
    nCallbacks = require('../util/ncallbacks'),
    config = {
        platform: 'android',
        projectPath: fs.realpathSync('test/project'),
        pluginPath: fs.realpathSync('test/plugin')
    },
    plugin = pluginstall.parseXml(config),
    assetsDir = path.resolve(config.projectPath, 'assets/www'),
    srcDir = path.resolve(config.projectPath, 'src'),
    jsPath = assetsDir + '/childbrowser.js',
    assetPath = assetsDir + '/childbrowser',
    javaDir  = path.resolve(config.projectPath,
                            'src/com/phonegap/plugins/childBrowser'),
    javaPath = path.resolve(javaDir, 'ChildBrowser.java')

// global setup
exports.setUp = function (callback) {
    var ASYNC_OPS = 3,
        end = nCallbacks(ASYNC_OPS, callback);

    // remove JS (that should be moved)
    fs.stat(jsPath, function (err, stats) {
        if (stats) {
            fs.unlinkSync(jsPath)
        }

        end(null);
    });

    // remove web assets (www/childbrowser)
    rimraf(assetPath, function () {
        end(null)
    });

    // remove src code directory
    rimraf(javaDir, function () {
        end(null)
    });
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

exports['should move the src file'] = function (test) {
    android.installPlugin(config, plugin, function (err) {
        test.ok(fs.statSync(javaPath))
        test.done();
    })
}

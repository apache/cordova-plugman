    // core
var fs = require('fs'),
    path = require('path'),

    // libs
    rimraf = require('rimraf'),
    et = require('elementtree'),

    // parts of this lib
    pluginstall = require('../pluginstall'),
    android = require('../platforms/android'),
    nCallbacks = require('../util/ncallbacks'),

    // setup
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

function moveProjFile(origFile, callback) {
    var src = path.resolve(config.projectPath, origFile),
        dest = src.replace('.orig', '')

    fs.createReadStream(src)
        .pipe(fs.createWriteStream(dest))
        .on('close', callback);
}

function clean(callback) {
    var ASYNC_OPS = 5,
        end = nCallbacks(ASYNC_OPS, callback);

    // remove JS (that should be moved)
    fs.stat(jsPath, function (err, stats) {
        if (stats) {
            fs.unlinkSync(jsPath)
        }

        end(null);
    });

    // remove web assets (www/childbrowser)
    rimraf(assetPath, end);

    // remove src code directory
    rimraf(javaDir, end);

    // copy in original plugins.xml
    moveProjFile('res/xml/plugins.orig.xml', end)

    // copy in original AndroidManifest.xml
    moveProjFile('AndroidManifest.orig.xml', end)
}

// global setup/teardown
exports.setUp = clean;
exports.tearDown = clean;

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

exports['should add ChildBrowser to plugins.xml'] = function (test) {
    android.installPlugin(config, plugin, function (err) {
        var pluginsTxt = fs.readFileSync('test/project/res/xml/plugins.xml', 'utf-8'),
            pluginsDoc = new et.ElementTree(et.XML(pluginsTxt)),
            expected = 'plugin[@name="ChildBrowser"]' +
                        '[@value="com.phonegap.plugins.childBrowser.ChildBrowser"]';

        test.ok(pluginsDoc.find(expected));
        test.done();
    })
}

exports['should add ChildBrowser to AndroidManifest.xml'] = function (test) {
    android.installPlugin(config, plugin, function (err) {
        var manifestTxt = fs.readFileSync('test/project/AndroidManifest.xml', 'utf-8'),
            manifestDoc = new et.ElementTree(et.XML(manifestTxt)),
            expected = 'application/activity[@android:name=' +
                        '"com.phonegap.plugins.childBrowser.ChildBrowser"]';

        test.ok(manifestDoc.find(expected));
        test.done();
    })
}

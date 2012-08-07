// Test installation on Cordova 1.x project
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

    // helpers
    helpers = require('../util/test-helpers'),
    moveProjFile = helpers.moveProjFile,

    // setup
    config = {
        platform: 'android',
        projectPath: fs.realpathSync('test/project/android_one'),
        pluginPath: fs.realpathSync('test/plugin')
    },
    plugin = pluginstall.parseXml(config),
    assetsDir = path.resolve(config.projectPath, 'assets/www'),
    srcDir = path.resolve(config.projectPath, 'src'),
    jsPath = assetsDir + '/childbrowser.js',
    assetPath = assetsDir + '/childbrowser',
    javaDir  = path.resolve(config.projectPath,
                            'src/com/phonegap/plugins/childBrowser'),
    javaPath = path.resolve(javaDir, 'ChildBrowser.java'),
    pluginsXmlPath = path.resolve(config.projectPath, 'res/xml/plugins.xml'),
    manifestPath = path.resolve(config.projectPath, 'AndroidManifest.xml');

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
    moveProjFile('res/xml/plugins.orig.xml', config.projectPath, end)

    // copy in original AndroidManifest.xml
    moveProjFile('AndroidManifest.orig.xml', config.projectPath, end)
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
        var pluginsTxt = fs.readFileSync(pluginsXmlPath, 'utf-8'),
            pluginsDoc = new et.ElementTree(et.XML(pluginsTxt)),
            expected = 'plugin[@name="ChildBrowser"]' +
                        '[@value="com.phonegap.plugins.childBrowser.ChildBrowser"]';

        test.ok(pluginsDoc.find(expected));
        test.done();
    })
}

exports['should add ChildBrowser to AndroidManifest.xml'] = function (test) {
    android.installPlugin(config, plugin, function (err) {
        var manifestTxt = fs.readFileSync(manifestPath, 'utf-8'),
            manifestDoc = new et.ElementTree(et.XML(manifestTxt)),
            activities = manifestDoc.findall('application/activity'), i;

        var found = false;
        for (i=0; i<activities.length; i++) {
            if ( activities[i].attrib['android:name'] === 'com.phonegap.plugins.childBrowser.ChildBrowser' ) {
                found = true;
                break;
            }
        }
        test.ok(found);
        test.done();
    })
}

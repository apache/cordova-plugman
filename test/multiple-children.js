// Test plugin.xml with multiple child elements
    // core
var fs = require('fs'),
    path = require('path'),

    // libs
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
        projectPath: fs.realpathSync('test/multiple-children/project'),
        pluginPath: fs.realpathSync('test/multiple-children/plugin')
    },
    plugin = pluginstall.parseXml(config),
    manifestPath = path.resolve(config.projectPath, 'AndroidManifest.xml');

function start(callback) {
    // copy in original AndroidManifest.xml
    moveProjFile('AndroidManifest.orig.xml', config.projectPath, callback);
}

exports.setUp = start;

exports['should install okay'] = function (test) {
    android.installPlugin(config, plugin, function (err) {
        test.ok(!err);
        test.done();
    })
}

exports['should install all the uses-permission tags'] = function (test) {
    android.installPlugin(config, plugin, function (err) {
        var manifestTxt = fs.readFileSync(manifestPath, 'utf-8'),
            mDoc = new et.ElementTree(et.XML(manifestTxt)),
            found, receive;

        found = mDoc.findall(usesPermission('READ_PHONE_STATE'))
        test.equal(found.length, 1, 'READ_PHONE_STATE permission');

        found = mDoc.findall(usesPermission('INTERNET'))
        test.equal(found.length, 1, 'INTERNET permission');

        found = mDoc.findall(usesPermission('GET_ACCOUNTS'))
        test.equal(found.length, 1, 'GET_ACCOUNTS permission');

        found = mDoc.findall(usesPermission('WAKE_LOCK'))
        test.equal(found.length, 1, 'WAKE_LOCK permission');

        receive = 'uses-permission[@android:name=' + 
            '"com.google.android.c2dm.permission.RECEIVE"]';
        found = mDoc.findall(receive)
        test.equal(found.length, 1, 'RECEVIE permission');

        // TODO: interpolation - PACKAGE_NAME.permission.C2D_MESSAGE

        test.done();
    })
}

function usesPermission(name) {
    return 'uses-permission[@android:name="android.permission.' + name + '"]';
}

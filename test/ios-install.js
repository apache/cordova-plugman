var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),

    pluginstall = require('../pluginstall'),
    ios = require('../platforms/ios'),
    nCallbacks = require('../util/ncallbacks'),

    config = {
        platform: 'ios',
        projectPath: fs.realpathSync('test/project'),
        pluginPath: fs.realpathSync('test/plugin')
    },
    plugin = pluginstall.parseXml(config),
    assetsDir = path.resolve(config.projectPath, 'www'),
    srcDir = path.resolve(config.projectPath, 'SampleApp/Plugins'),
    jsPath = assetsDir + '/childbrowser.js';

function moveProjFile(origFile, callback) {
    var src = path.resolve(config.projectPath, origFile),
        dest = src.replace('.orig', '')

    fs.createReadStream(src)
        .pipe(fs.createWriteStream(dest))
        .on('close', callback);
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

exports.setUp = function (calllback) {
    var ASYNC_OPS = 7,
        end = nCallbacks(ASYNC_OPS, calllback);

    rimraf(assetsDir + '/childbrowser', end)
    unlinkIfThere(jsPath, end)
    unlinkIfThere(srcDir + '/ChildBrowserCommand.m', end)
    unlinkIfThere(srcDir + '/ChildBrowserViewController.m', end)
    unlinkIfThere(srcDir + '/ChildBrowserCommand.h', end)
    unlinkIfThere(srcDir + '/ChildBrowserViewController.h', end)

    // move plist file into place
    moveProjFile('SampleApp/PhoneGap.orig.plist', end);
}

exports['should move the js file'] = function (test) {
    ios.installPlugin(config, plugin, function (err) {
        test.ok(fs.statSync(jsPath))
        test.done();
    })
}

exports['should move the source files'] = function (test) {
    ios.installPlugin(config, plugin, function (err) {
        test.ok(fs.statSync(srcDir + '/ChildBrowserCommand.m'))
        test.ok(fs.statSync(srcDir + '/ChildBrowserViewController.m'))
        test.done();
    })
}

exports['should move the header files'] = function (test) {
    ios.installPlugin(config, plugin, function (err) {
        test.ok(fs.statSync(srcDir + '/ChildBrowserCommand.h'))
        test.ok(fs.statSync(srcDir + '/ChildBrowserViewController.h'))
        test.done();
    })
}

exports['should move the xib file']

exports['should move the bundle']

exports['should edit PhoneGap.plist']

exports['should edit the pbxproj file']

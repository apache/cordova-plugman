var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    plist = require('plist'),
    xcode = require('xcode'),

    pluginstall = require('../pluginstall'),
    ios = require('../platforms/ios'),
    nCallbacks = require('../util/ncallbacks'),

    // helpers
    helpers = require('../util/test-helpers'),
    moveProjFile = helpers.moveProjFile,

    config = {
        platform: 'ios',
        projectPath: fs.realpathSync('test/project/ios'),
        pluginPath: fs.realpathSync('test/plugin')
    },
    plugin = pluginstall.parseXml(config),
    assetsDir = path.resolve(config.projectPath, 'www'),
    srcDir = path.resolve(config.projectPath, 'SampleApp/Plugins'),
    jsPath = assetsDir + '/childbrowser.js';

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

function clean(calllback) {
    var ASYNC_OPS = 10,
        end = nCallbacks(ASYNC_OPS, calllback);

    rimraf(assetsDir + '/childbrowser', end)
    rimraf(srcDir + '/ChildBrowser.bundle', end)
    unlinkIfThere(jsPath, end)
    unlinkIfThere(srcDir + '/ChildBrowserCommand.m', end)
    unlinkIfThere(srcDir + '/ChildBrowserViewController.m', end)
    unlinkIfThere(srcDir + '/ChildBrowserCommand.h', end)
    unlinkIfThere(srcDir + '/ChildBrowserViewController.h', end)
    unlinkIfThere(srcDir + '/ChildBrowserViewController.xib', end)
    
    rimraf(srcDir + '/targetDir', end)
    rimraf(srcDir + '/preserveDirs', end)

    moveProjFile('SampleApp/PhoneGap.orig.plist', config.projectPath, end);
    moveProjFile('SampleApp.xcodeproj/project.orig.pbxproj', config.projectPath, end);
}

exports.setUp = clean;
exports.tearDown = clean;

exports['should remove the js file'] = function (test) {
    ios.installPlugin(config, plugin, function () {
        ios.uninstallPlugin(config, plugin, function (err) {
            test.ok(!fs.existsSync(jsPath))
            test.done();
        });
    });
}

exports['should remove the source files'] = function (test) {
    ios.installPlugin(config, plugin, function () {
        ios.uninstallPlugin(config, plugin, function (err) {
            test.ok(!fs.existsSync(srcDir + '/ChildBrowserCommand.m'))
            test.ok(!fs.existsSync(srcDir + '/ChildBrowserViewController.m'))
            test.ok(!fs.existsSync(srcDir + '/preserveDirs/PreserveDirsTest.m'))
            test.ok(!fs.existsSync(srcDir + '/targetDir/TargetDirTest.m'))
            test.done();
        });
    });
}

exports['should remove the header files'] = function (test) {
    ios.installPlugin(config, plugin, function () {
        ios.uninstallPlugin(config, plugin, function (err) {
            test.ok(!fs.existsSync(srcDir + '/ChildBrowserCommand.h'))
            test.ok(!fs.existsSync(srcDir + '/ChildBrowserViewController.h'))
            test.ok(!fs.existsSync(srcDir + '/preserveDirs/PreserveDirsTest.h'))
            test.ok(!fs.existsSync(srcDir + '/targetDir/TargetDirTest.h'))
            test.done();
        });
    });
}

exports['should remove the xib file'] = function (test) {
    ios.installPlugin(config, plugin, function () {
        ios.uninstallPlugin(config, plugin, function (err) {
            test.ok(!fs.existsSync(srcDir + '/ChildBrowserViewController.xib'))
            test.done();
        });
    });
}

exports['should remove the bundle'] = function (test) {
    ios.installPlugin(config, plugin, function () {
        ios.uninstallPlugin(config, plugin, function (err) {
            test.ok(!fs.existsSync(srcDir + '/ChildBrowser.bundle'))
            test.done();
        });
    });
}

exports['should edit PhoneGap.plist'] = function (test) {
    ios.installPlugin(config, plugin, function () {
        ios.uninstallPlugin(config, plugin, function (err) {
            var plistPath = config.projectPath + '/SampleApp/PhoneGap.plist';
            plist.parseFile(plistPath, function (err, obj) {

                test.notEqual(obj.Plugins['com.phonegap.plugins.childbrowser'],
                    'ChildBrowserCommand');
                    
                test.equal(obj.ExternalHosts.length, 2)    
                test.equal(obj.ExternalHosts[0], "build.phonegap.com")
                test.equal(obj.ExternalHosts[1], "s3.amazonaws.com")

                test.done();
            });
        });
    });
}

exports['should edit the pbxproj file'] = function (test) {
    ios.installPlugin(config, plugin, function () {
        ios.uninstallPlugin(config, plugin, function (err) {
            var projPath = config.projectPath + '/SampleApp.xcodeproj/project.pbxproj';

            xcode.project(projPath).parse(function (err, obj) {
                var fileRefSection = obj.project.objects['PBXFileReference'],
                    fileRefLength = Object.keys(fileRefSection).length,
                    EXPECTED_TOTAL_REFERENCES = 78; // magic number ahoy!

                test.equal(fileRefLength, EXPECTED_TOTAL_REFERENCES);
                test.done();
            })
        });
    });
}

exports['should remove the framework references from the pbxproj file'] = function (test) {
    ios.installPlugin(config, plugin, function () {
        ios.uninstallPlugin(config, plugin, function (err) {
            var projPath = config.projectPath + '/SampleApp.xcodeproj/project.pbxproj',
                projContents = fs.readFileSync(projPath, 'utf8'),
                projLines = projContents.split("\n"),
                references;

            references = projLines.filter(function (line) {
                return !!(line.match("libsqlite3.dylib"));
            })

            // should be four libsqlite3 reference lines added
            // pretty low-rent test eh
            test.equal(references.length, 1);
            test.done();
        });
    });
}

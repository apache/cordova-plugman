var fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    plist = require('plist'),
    xcode = require('xcode'),

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

    moveProjFile('SampleApp/PhoneGap.orig.plist', end);
    moveProjFile('SampleApp.xcodeproj/project.orig.pbxproj', end);
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

exports['should move the xib file'] = function (test) {
    ios.installPlugin(config, plugin, function (err) {
        test.ok(fs.statSync(srcDir + '/ChildBrowserViewController.xib'))
        test.done();
    })
}

exports['should move the bundle'] = function (test) {
    ios.installPlugin(config, plugin, function (err) {
        var bundle = fs.statSync(srcDir + '/ChildBrowser.bundle');

        test.ok(bundle.isDirectory())
        test.done();
    })
}

exports['should edit PhoneGap.plist'] = function (test) {
    ios.installPlugin(config, plugin, function (err) {
        var plistPath = config.projectPath + '/SampleApp/PhoneGap.plist';
        plist.parseFile(plistPath, function (err, obj) {

            test.equal(obj.Plugins['com.phonegap.plugins.childbrowser'],
                'ChildBrowserCommand');

            test.done();
        });
    })
}

exports['should edit the pbxproj file'] = function (test) {
    ios.installPlugin(config, plugin, function (err) {
        var projPath = config.projectPath + '/SampleApp.xcodeproj/project.pbxproj';

        xcode.project(projPath).parse(function (err, obj) {
            var fileRefSection = obj.project.objects['PBXFileReference'],
                fileRefLength = Object.keys(fileRefSection).length,
                EXPECTED_TOTAL_REFERENCES = 84; // magic number ahoy!

            test.equal(fileRefLength, EXPECTED_TOTAL_REFERENCES);
            test.done();
        })
    });
}

exports['should add the framework references to the pbxproj file'] = function (test) {
    ios.installPlugin(config, plugin, function (err) {
        var projPath = config.projectPath + '/SampleApp.xcodeproj/project.pbxproj',
            projContents = fs.readFileSync(projPath, 'utf8'),
            projLines = projContents.split("\n"),
            references;

        references = projLines.filter(function (line) {
            return !!(line.match("libsqlite3.dylib"));
        })

        // should be four libsqlite3 reference lines added
        // pretty low-rent test eh
        test.equal(references.length, 4);
        test.done();
    });
}

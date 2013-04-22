var uninstall = require('../src/uninstall'),
    install = require('../src/install'),
    android = require('../src/platforms/android'),
    ios     = require('../src/platforms/ios'),
    blackberry = require('../src/platforms/blackberry'),
    plugman = require('../plugman'),
    fs      = require('fs'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
    temp    = path.join(os.tmpdir(), 'plugman'),
    childbrowser = path.join(__dirname, 'plugins', 'ChildBrowser'),
    dummyplugin = path.join(__dirname, 'plugins', 'DummyPlugin'),
    variableplugin = path.join(__dirname, 'plugins', 'VariablePlugin'),
    faultyplugin = path.join(__dirname, 'plugins', 'FaultyPlugin'),
    android_one_project = path.join(__dirname, 'projects', 'android_one', '*');
    blackberry_project = path.join(__dirname, 'projects', 'blackberry', '*');
    ios_project = path.join(__dirname, 'projects', 'ios-config-xml', '*');
    plugins_dir = path.join(temp, 'cordova', 'plugins');

describe('uninstall', function() {
    var copied_plugin_path = path.join(temp,'ChildBrowser');

    beforeEach(function() {
        shell.mkdir('-p', temp);
        shell.mkdir('-p', plugins_dir);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    describe('success', function() {
        it('on an Android project should call into Android module\'s handleUninstall', function() {
            // Set up android project w/ one plugin
            shell.cp('-rf', android_one_project, temp);
            shell.cp('-rf', dummyplugin, plugins_dir);
            install('android', temp, 'DummyPlugin', plugins_dir, {});

            var s = spyOn(android, 'handleUninstall');
            uninstall('android', temp, 'DummyPlugin', plugins_dir, {});
            expect(s).toHaveBeenCalled();
        });
        it('on a BlackBerry project should call into BlackBerry module\'s handleUninstall', function() {
            // Set up blackberry project w/ one plugin
            shell.cp('-rf', blackberry_project, temp);
            shell.cp('-rf', dummyplugin, plugins_dir);
            install('blackberry', temp, 'DummyPlugin', plugins_dir, {});

            var s = spyOn(blackberry, 'handleUninstall');
            uninstall('blackberry', temp, 'DummyPlugin', plugins_dir, {});
            expect(s).toHaveBeenCalled();
        });
        it('on an iOS project should call into iOS module\'s handleUninstall', function() {
            // Set up ios project w/ one plugin
            shell.cp('-rf', ios_project, temp);
            shell.cp('-rf', dummyplugin, plugins_dir);
            install('ios', temp, 'DummyPlugin', plugins_dir, {});

            var s = spyOn(ios, 'handleUninstall');
            uninstall('ios', temp, 'DummyPlugin', plugins_dir, {});
            expect(s).toHaveBeenCalled();
        });
    });

    describe('failure', function() {
        beforeEach(function() {
            shell.cp('-rf', android_one_project, temp);
            shell.cp('-rf', dummyplugin, plugins_dir);
            install('android', temp, 'DummyPlugin', plugins_dir, {});
        });
        afterEach(function() {
            shell.rm('-rf', temp);
        });
        it('should throw if platform is unrecognized', function() {
            expect(function() {
                uninstall('atari', temp, 'SomePlugin', plugins_dir, {});
            }).toThrow('atari not supported.');
        });
        it('should throw if the plugin was not found', function() {
            expect(function() {
                uninstall('android', temp, 'SomePlugin', plugins_dir, {});
            }).toThrow('Plugin "SomePlugin" not found. Already uninstalled?');
        });
    });
});

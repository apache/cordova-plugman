var install = require('../src/install'),
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

describe('install', function() {
    var copied_plugin_path = path.join(temp,'ChildBrowser');

    beforeEach(function() {
        shell.mkdir('-p', temp);
        shell.mkdir('-p', plugins_dir);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    describe('success', function() {
        beforeEach(function() {
            shell.cp('-rf', dummyplugin, plugins_dir);
        });

        it('should call prepare after a successful install', function() {
            shell.cp('-rf', android_one_project, temp);
            var s = spyOn(plugman, 'prepare');
            install('android', temp, 'DummyPlugin', plugins_dir, {});
            expect(s).toHaveBeenCalled();
        });
        it('on an Android project should call into Android module\'s handleInstall', function() {
            shell.cp('-rf', android_one_project, temp);
            var s = spyOn(android, 'handleInstall');
            install('android', temp, 'DummyPlugin', plugins_dir, {});
            expect(s).toHaveBeenCalled();
        });
        it('on a BlackBerry project should call into BlackBerry module\'s handleInstall', function() {
            shell.cp('-rf', blackberry_project, temp);
            var s = spyOn(blackberry, 'handleInstall');
            install('blackberry', temp, 'DummyPlugin', plugins_dir, {});
            expect(s).toHaveBeenCalled();
        });
        it('on an iOS project should call into iOS module\'s handleInstall', function() {
            shell.cp('-rf', ios_project, temp);
            var s = spyOn(ios, 'handleInstall');
            install('ios', temp, 'DummyPlugin', plugins_dir, {});
            expect(s).toHaveBeenCalled();
        });
    });

    describe('failure', function() {
        it('should throw if platform is unrecognized', function() {
            expect(function() {
                install('atari', temp, 'SomePlugin', plugins_dir, {});
            }).toThrow('atari not supported.');
        });
        it('should throw if variables are missing', function() {
            shell.cp('-rf', variableplugin, plugins_dir);
            expect(function() {
                install('android', temp, 'VariablePlugin', plugins_dir, {});
            }).toThrow('Variable(s) missing: API_KEY');
        });
        it('should throw if installation failed', function() {
            shell.cp('-rf', android_one_project, temp);
            shell.cp('-rf', faultyplugin, plugins_dir);
            var didThrow = false;
            try {
                install('android', temp, 'FaultyPlugin', plugins_dir, {});
            } catch(e) {
                didThrow = true;
                expect(e.message).toMatch(/does not exist/);
            }
            expect(didThrow).toBe(true);
        });
        it('should call forceUninstall if installation fails to revert changes', function() {
            shell.cp('-rf', android_one_project, temp);
            shell.cp('-rf', faultyplugin, plugins_dir);
            var s = spyOn(android, 'forceUninstall');
            expect(function() {
                install('android', temp, 'FaultyPlugin', plugins_dir, {});
            }).toThrow();
            expect(s).toHaveBeenCalled();
        });
        it('should throw an extra-long error if both installation and reversion failed', function() {
            shell.cp('-rf', android_one_project, temp);
            shell.cp('-rf', faultyplugin, plugins_dir);
            var didThrow = false;
            try {
                install('android', temp, 'FaultyPlugin', plugins_dir, {});
            } catch(e) {
                didThrow = true;
                expect(e.message).toMatch(/reverting changes also caused issues!/);
            }
            expect(didThrow).toBe(true);
        });
    });
});

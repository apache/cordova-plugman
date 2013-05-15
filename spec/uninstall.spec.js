var uninstall = require('../src/uninstall'),
    install = require('../src/install'),
    common = require('../src/platforms/common'),
    actions = require('../src/util/action-stack'),
    android = require('../src/platforms/android'),
    ios     = require('../src/platforms/ios'),
    blackberry = require('../src/platforms/blackberry'),
    xml_helpers = require('../src/util/xml-helpers'),
    config_changes = require('../src/util/config-changes'),
    plugman = require('../plugman'),
    fs      = require('fs'),
    et      = require('elementtree'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
    temp    = path.join(os.tmpdir(), 'plugman'),
    dummyplugin = path.join(__dirname, 'plugins', 'DummyPlugin'),
    dummy_id = 'com.phonegap.plugins.dummyplugin',
    faultyplugin = path.join(__dirname, 'plugins', 'FaultyPlugin'),
    childbrowserplugin = path.join(__dirname, 'plugins', 'ChildBrowser'),
    dep_a = path.join(__dirname, 'plugins', 'dependencies', 'A'),
    dep_b = path.join(__dirname, 'plugins', 'dependencies', 'B'),
    dep_c = path.join(__dirname, 'plugins', 'dependencies', 'C'),
    dep_d = path.join(__dirname, 'plugins', 'dependencies', 'D'),
    dep_e = path.join(__dirname, 'plugins', 'dependencies', 'E'),
    android_one_project = path.join(__dirname, 'projects', 'android_one', '*'),
    ios_project = path.join(__dirname, 'projects', 'ios-config-xml', '*'),
    plugins_dir = path.join(temp, 'cordova', 'plugins');

describe('uninstall', function() {
    var copied_plugin_path = path.join(temp,'ChildBrowser');
    var dummy_plugin_path = path.join(plugins_dir, dummy_id);

    beforeEach(function() {
        shell.mkdir('-p', temp);
        shell.cp('-rf', android_one_project, temp);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    describe('success', function() {
        beforeEach(function() {
            install('android', temp, dummyplugin, plugins_dir, '.', {});
        });
        it('should properly uninstall assets', function() {
            var s = spyOn(common, 'removeFile').andCallThrough();
            var s2 = spyOn(common, 'removeFileF').andCallThrough();
            // making sure the right methods were called
            uninstall('android', temp, dummy_id, plugins_dir, {});
            expect(s).toHaveBeenCalled();
            expect(s.calls.length).toEqual(2);
            
            expect(s2).toHaveBeenCalled();
            expect(s2.calls.length).toEqual(2);

            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin.js'))).toBe(false);
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin'))).toBe(false);
        });
        it('should properly revert all assets on asset uninstall error', function() {
            var sRemoveFile = spyOn(common, 'removeFile').andCallThrough();
            var sCopyFile = spyOn(common, 'copyFile').andCallThrough();
            // making sure the right methods were called
            
            shell.rm('-rf', path.join(temp, 'assets', 'www', 'dummyplugin'));
            
            expect(function() {
                uninstall('android', temp, dummy_id, plugins_dir, {});
            }).toThrow();

            expect(sRemoveFile).toHaveBeenCalled();
            expect(sRemoveFile.calls.length).toEqual(2);
            expect(sCopyFile).toHaveBeenCalled();
            expect(sCopyFile.calls.length).toEqual(2);
            
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin.js'))).toBe(true);
        });
        it('should call the config-changes module\'s add_uninstalled_plugin_to_prepare_queue method', function() {
            var spy = spyOn(config_changes, 'add_uninstalled_plugin_to_prepare_queue');
            uninstall('android', temp, dummy_id, plugins_dir, {});
            expect(spy).toHaveBeenCalledWith(plugins_dir, dummy_id, 'android', true);
        });

        describe('with dependencies', function() {
            it('should uninstall any dependent plugins', function() {
                shell.mkdir('-p', plugins_dir);
                shell.cp('-rf', dep_a, plugins_dir);
                shell.cp('-rf', dep_d, plugins_dir);
                shell.cp('-rf', dep_c, plugins_dir);
                install('android', temp, 'A', plugins_dir, '.', {});
                var spy = spyOn(actions.prototype, 'process').andCallThrough();
                uninstall('android', temp, 'A', plugins_dir, {});
                expect(spy.calls.length).toEqual(3);
            });
            it('should not uninstall any dependent plugins that are required by other top-level plugins', function() {
                shell.mkdir('-p', plugins_dir);
                shell.cp('-rf', dep_a, plugins_dir);
                shell.cp('-rf', dep_b, plugins_dir);
                shell.cp('-rf', dep_d, plugins_dir);
                shell.cp('-rf', dep_c, plugins_dir);
                shell.cp('-rf', dep_e, plugins_dir);
                install('android', temp, 'A', plugins_dir, '.', {});
                install('android', temp, 'B', plugins_dir, '.', {});
                var spy = spyOn(actions.prototype, 'process').andCallThrough();
                uninstall('android', temp, 'A', plugins_dir, {});
                expect(spy.calls.length).toEqual(2);
            });
        });
    });

    describe('failure', function() {
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

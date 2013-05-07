var uninstall = require('../src/uninstall'),
    install = require('../src/install'),
    common = require('../src/platforms/common'),
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
    faultyplugin = path.join(__dirname, 'plugins', 'FaultyPlugin'),
    childbrowserplugin = path.join(__dirname, 'plugins', 'ChildBrowser'),
    android_one_project = path.join(__dirname, 'projects', 'android_one', '*'),
    ios_project = path.join(__dirname, 'projects', 'ios-config-xml', '*'),
    plugins_dir = path.join(temp, 'cordova', 'plugins');

describe('uninstall', function() {
    var copied_plugin_path = path.join(temp,'ChildBrowser');

    beforeEach(function() {
        shell.mkdir('-p', temp);
        shell.mkdir('-p', plugins_dir);
        shell.cp('-rf', android_one_project, temp);
        shell.cp('-rf', dummyplugin, plugins_dir);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    describe('success', function() {
        var android_uninstaller;
        beforeEach(function() {
            install('android', temp, 'DummyPlugin', plugins_dir, {});
            android_uninstaller = spyOn(android, 'uninstall');
        });
        it('should properly uninstall assets', function() {
            var s = spyOn(common, 'removeFile').andCallThrough();
            var s2 = spyOn(common, 'removeFileF').andCallThrough();
            // making sure the right methods were called
            uninstall('android', temp, 'DummyPlugin', plugins_dir, {});
            expect(s).toHaveBeenCalled();
            expect(s.calls.length).toEqual(2);
            
            expect(s2).toHaveBeenCalled();
            expect(s2.calls.length).toEqual(1);

            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin.js'))).toBe(false);
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin'))).toBe(false);
        });
        it('should properly revert all assets on asset uninstall error', function() {
            var sRemoveFile = spyOn(common, 'removeFile').andCallThrough();
            var sCopyFile = spyOn(common, 'copyFile').andCallThrough();
            // making sure the right methods were called
            
            shell.rm('-rf', path.join(temp, 'assets', 'www', 'dummyplugin'));
            
            expect(function() {
                uninstall('android', temp, 'DummyPlugin', plugins_dir, {});
            }).toThrow();

            expect(sRemoveFile).toHaveBeenCalled();
            expect(sRemoveFile.calls.length).toEqual(2);
            expect(sCopyFile).toHaveBeenCalled();
            expect(sCopyFile.calls.length).toEqual(1);
            
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin.js'))).toBe(true);
        });
        it('should generate and pass uninstall transaction log to appropriate platform handler\'s uninstall', function() {
            uninstall('android', temp, 'DummyPlugin', plugins_dir, {});
            var transactions = android_uninstaller.mostRecentCall.args[0];

            expect(transactions.length).toEqual(1);
            expect(transactions[0].tag).toBe('source-file');
        });
        it('should call the config-changes module\'s add_uninstalled_plugin_to_prepare_queue method', function() {
            uninstall('android', temp, 'DummyPlugin', plugins_dir, {});
            var spy = spyOn(config_changes, 'add_uninstalled_plugin_to_prepare_queue');
            android_uninstaller.mostRecentCall.args[4](null); // fake out handler uninstall callback
            expect(spy).toHaveBeenCalledWith(plugins_dir, 'DummyPlugin', 'android');
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
       // it('should handle a failed uninstall by passing completed transactions into appropriate handler\'s install method', function() {
       //     shell.rm('-rf', path.join(temp, '*'));
       //     shell.mkdir('-p', plugins_dir);
       //     
       //     shell.cp('-rf', ios_project, temp);
       //     shell.cp('-rf', childbrowserplugin, plugins_dir);
       //     install('ios', temp, 'ChildBrowser', plugins_dir, {});

       //     // make uninstall fail by removing a js asset
       //     shell.rm(path.join(temp, 'SampleApp', 'Plugins', 'ChildBrowserCommand.m'));
       //     var s = spyOn(ios, 'install');
       //     uninstall('ios', temp, 'ChildBrowser', plugins_dir, {});
       //     var executed_txs = s.mostRecentCall.args[0];
       //     expect(executed_txs.length).toEqual(1);
       //     // It only ended up "uninstalling" one source file, so install reversion should pass in that source file to re-install
       //     expect(executed_txs[0].tag).toEqual('source-file');
       // });
        it('should revert assets when uninstall fails', function() {
            install('android', temp, 'DummyPlugin', plugins_dir, {});
            
            var s = spyOn(common, 'copyFile').andCallThrough();
            
            shell.rm('-rf', path.join(temp, 'src', 'com', 'phonegap', 'plugins', 'dummyplugin'));
            expect(function() {
                uninstall('android', temp, 'DummyPlugin', plugins_dir, {});
            }).toThrow();
            expect(s).toHaveBeenCalled();
            expect(s.calls.length).toEqual(2);
            
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin.js'))).toBe(true);
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin'))).toBe(true);
        });
    });
});

var install = require('../src/install'),
    android = require('../src/platforms/android'),
    common = require('../src/platforms/common'),
    //ios     = require('../src/platforms/ios'),
    //blackberry10 = require('../src/platforms/blackberry10'),
    config_changes = require('../src/util/config-changes'),
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
    //blackberry10_project = path.join(__dirname, 'projects', 'blackberry10', '*');
    //ios_project = path.join(__dirname, 'projects', 'ios-config-xml', '*');
    plugins_dir = path.join(temp, 'cordova', 'plugins');

describe('install', function() {
    var copied_plugin_path = path.join(temp,'ChildBrowser');

    beforeEach(function() {
        shell.mkdir('-p', temp);
        shell.mkdir('-p', plugins_dir);
        shell.cp('-rf', android_one_project, temp);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });


    describe('success', function() {
        var android_installer;
        beforeEach(function() {
            shell.cp('-rf', dummyplugin, plugins_dir);
            android_installer = spyOn(android, 'install');
        });
        it('should properly install assets', function() {
            var s = spyOn(common, 'copyFile').andCallThrough();
            install('android', temp, 'DummyPlugin', plugins_dir, {});
            // making sure the right methods were called
            expect(s).toHaveBeenCalled();
            expect(s.calls.length).toEqual(2);

            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin.js'))).toBe(true);
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin'))).toBe(true);
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin', 'image.jpg'))).toBe(true);
            expect(fs.statSync(path.join(temp, 'assets', 'www', 'dummyplugin.js')).isFile()).toBe(true);
            expect(fs.statSync(path.join(temp, 'assets', 'www', 'dummyplugin')).isDirectory()).toBe(true);
            expect(fs.statSync(path.join(temp, 'assets', 'www', 'dummyplugin', 'image.jpg')).isFile()).toBe(true);
        });
        it('should revert all assets on asset install error', function() {
            var sCopyFile = spyOn(common, 'copyFile').andCallThrough();
            var sRemoveFile = spyOn(common, 'removeFile').andCallThrough();
            var sRemoveFileF = spyOn(common, 'removeFileF').andCallThrough();
            
            // messing the plugin
            shell.rm('-rf', path.join(plugins_dir, 'dummyplugin', 'www', 'dummyplugin')); 
            expect(function() {
                install('android', temp, 'DummyPlugin', plugins_dir, {});
            }).toThrow();
            // making sure the right methods were called
            expect(sCopyFile).toHaveBeenCalled();
            expect(sCopyFile.calls.length).toEqual(2);

            expect(sRemoveFile).toHaveBeenCalled();
            expect(sRemoveFile.calls.length).toEqual(1);
            expect(sRemoveFileF).toHaveBeenCalled();
            expect(sRemoveFileF.calls.length).toEqual(1);
           
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin.js'))).toBe(false);
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin'))).toBe(false);
        });

        it('should properly install assets into a custom www dir', function() {
            var s = spyOn(common, 'copyFile').andCallThrough();
            install('android', temp, 'DummyPlugin', plugins_dir, {}, path.join(temp, 'staging'));
            // making sure the right methods were called
            expect(s).toHaveBeenCalled();
            expect(s.calls.length).toEqual(2);

            expect(fs.existsSync(path.join(temp, 'staging', 'dummyplugin.js'))).toBe(true);
            expect(fs.existsSync(path.join(temp, 'staging', 'dummyplugin'))).toBe(true);
            expect(fs.existsSync(path.join(temp, 'staging', 'dummyplugin', 'image.jpg'))).toBe(true);
            expect(fs.statSync(path.join(temp, 'staging', 'dummyplugin.js')).isFile()).toBe(true);
            expect(fs.statSync(path.join(temp, 'staging', 'dummyplugin')).isDirectory()).toBe(true);
            expect(fs.statSync(path.join(temp, 'staging', 'dummyplugin', 'image.jpg')).isFile()).toBe(true);
        });

        it('should revert all assets on asset install error with a custom www dir', function() {
            var sCopyFile = spyOn(common, 'copyFile').andCallThrough();
            var sRemoveFile = spyOn(common, 'removeFile').andCallThrough();
            var sRemoveFileF = spyOn(common, 'removeFileF').andCallThrough();
            
            // messing the plugin
            shell.rm('-rf', path.join(plugins_dir, 'dummyplugin', 'www', 'dummyplugin')); 
            expect(function() {
                install('android', temp, 'DummyPlugin', plugins_dir, {}, path.join(temp, 'staging'));
            }).toThrow();
            // making sure the right methods were called
            expect(sCopyFile).toHaveBeenCalled();
            expect(sCopyFile.calls.length).toEqual(2);

            expect(sRemoveFile).toHaveBeenCalled();
            expect(sRemoveFile.calls.length).toEqual(1);
            expect(sRemoveFileF).toHaveBeenCalled();
            expect(sRemoveFileF.calls.length).toEqual(1);
           
            expect(fs.existsSync(path.join(temp, 'staging', 'dummyplugin.js'))).toBe(false);
            expect(fs.existsSync(path.join(temp, 'staging', 'dummyplugin'))).toBe(false);
        });

        it('should call prepare after a successful install', function() {
            var s = spyOn(plugman, 'prepare');
            install('android', temp, 'DummyPlugin', plugins_dir, {});
            android_installer.mostRecentCall.args[5](); // fake the installer calling back successfully
            expect(s).toHaveBeenCalled();
        });

        it('should call fetch if provided plugin cannot be resolved locally', function() {
            var s = spyOn(plugman, 'fetch');
            install('android', temp, 'CLEANYOURSHORTS', plugins_dir, {});
            expect(s).toHaveBeenCalled();
        });
        it('should generate an array of transactions required to run an installation and pass into appropriate platform handler\'s install method', function() {
            install('android', temp, 'DummyPlugin', plugins_dir, {});
            var transactions = android_installer.mostRecentCall.args[0];

            expect(transactions.length).toEqual(1);
            expect(transactions[0].tag).toBe('source-file');
        });
        it('should call the config-changes module\'s add_installed_plugin_to_prepare_queue method', function() {
            install('android', temp, 'DummyPlugin', plugins_dir, {});
            var spy = spyOn(config_changes, 'add_installed_plugin_to_prepare_queue');
            android_installer.mostRecentCall.args[5](null); // fake out handler install callback
            expect(spy).toHaveBeenCalledWith(plugins_dir, 'DummyPlugin', 'android', {});
        });
    });

    describe('failure', function() {
        it('should throw if asset target already exists', function() {
            shell.cp('-rf', dummyplugin, plugins_dir);
            var target = path.join(temp, 'assets', 'www', 'dummyplugin.js');
            fs.writeFileSync(target, 'some bs', 'utf-8');
            expect(function() {
                install('android', temp, 'DummyPlugin', plugins_dir, {});
            }).toThrow();
        });
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
        it('should handle a failed install by passing completed transactions into appropriate handler\'s uninstall method', function() {
            shell.cp('-rf', faultyplugin, plugins_dir);
            var s = spyOn(android, 'uninstall');
            install('android', temp, 'FaultyPlugin', plugins_dir, {});

            var executed_txs = s.mostRecentCall.args[0];
            expect(executed_txs.length).toEqual(0);
        });
        it('should throw if plugin is already installed into project', function() {
            // TODO: plugins and their version can be recognized using the platform.json file
            shell.cp('-rf', dummyplugin, plugins_dir);
            expect(function() {
                install('android', temp, 'DummyPlugin', plugins_dir, {});
            }).not.toThrow();
            expect(function() {
                install('android', temp, 'DummyPlugin', plugins_dir, {});
            }).toThrow();
        });
        it('should revert web assets if an install error occurs', function() {
            var sRemoveFile = spyOn(common, 'removeFile').andCallThrough();
            var sRemoveFileF = spyOn(common, 'removeFileF').andCallThrough();
            shell.cp('-rf', dummyplugin, plugins_dir);
            shell.rm(path.join(plugins_dir, 'DummyPlugin', 'src', 'android', 'DummyPlugin.java')); 
            
            install('android', temp, 'DummyPlugin', plugins_dir, {}, undefined, function() {});
            
            expect(sRemoveFile).toHaveBeenCalled();
            expect(sRemoveFile.calls.length).toEqual(2);
            expect(sRemoveFileF).toHaveBeenCalled();
            expect(sRemoveFileF.calls.length).toEqual(1);
           
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin.js'))).toBe(false);
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin'))).toBe(false);
        });
    });
});

var install = require('../src/install'),
    common = require('../src/platforms/common'),
    actions = require('../src/util/action-stack'),
    //ios     = require('../src/platforms/ios'),
    //blackberry = require('../src/platforms/blackberry'),
    config_changes = require('../src/util/config-changes'),
    plugman = require('../plugman'),
    fs      = require('fs'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
    temp    = path.join(os.tmpdir(), 'plugman'),
    childbrowser = path.join(__dirname, 'plugins', 'ChildBrowser'),
    dep_a = path.join(__dirname, 'plugins', 'dependencies', 'A'),
    dep_b = path.join(__dirname, 'plugins', 'dependencies', 'B'),
    dep_c = path.join(__dirname, 'plugins', 'dependencies', 'C'),
    dep_d = path.join(__dirname, 'plugins', 'dependencies', 'D'),
    dep_e = path.join(__dirname, 'plugins', 'dependencies', 'E'),
    dummyplugin = path.join(__dirname, 'plugins', 'DummyPlugin'),
    dummy_id = 'com.phonegap.plugins.dummyplugin',
    variableplugin = path.join(__dirname, 'plugins', 'VariablePlugin'),
    faultyplugin = path.join(__dirname, 'plugins', 'FaultyPlugin'),
    android_one_project = path.join(__dirname, 'projects', 'android_one', '*');
    //blackberry_project = path.join(__dirname, 'projects', 'blackberry', '*');
    //ios_project = path.join(__dirname, 'projects', 'ios-config-xml', '*');
    plugins_dir = path.join(temp, 'cordova', 'plugins');

describe('install', function() {
    var copied_plugin_path = path.join(temp,'ChildBrowser');

    beforeEach(function() {
        shell.mkdir('-p', temp);
        shell.cp('-rf', android_one_project, temp);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    describe('success', function() {
        it('should properly install assets', function() {
            var s = spyOn(common, 'copyFile').andCallThrough();
            install('android', temp, dummyplugin, plugins_dir, '.', {});
            // making sure the right methods were called
            expect(s).toHaveBeenCalled();
            expect(s.calls.length).toEqual(3);

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
            
            // messing with the plugin
            shell.mkdir('-p', plugins_dir);
            shell.cp('-rf', dummyplugin, plugins_dir);
            shell.rm('-rf', path.join(plugins_dir, 'DummyPlugin', 'www', 'dummyplugin')); 
            expect(function() {
                install('android', temp, 'DummyPlugin', plugins_dir, '.', {});
            }).toThrow();
            // making sure the right methods were called
            expect(sCopyFile).toHaveBeenCalled();
            expect(sCopyFile.calls.length).toEqual(3);

            expect(sRemoveFile).toHaveBeenCalled();
            expect(sRemoveFile.calls.length).toEqual(1);
            expect(sRemoveFileF).toHaveBeenCalled();
            expect(sRemoveFileF.calls.length).toEqual(1);
           
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin.js'))).toBe(false);
            expect(fs.existsSync(path.join(temp, 'assets', 'www', 'dummyplugin'))).toBe(false);
        });

        it('should properly install assets into a custom www dir', function() {
            var s = spyOn(common, 'copyFile').andCallThrough();
            install('android', temp, dummyplugin, plugins_dir, '.', {}, path.join(temp, 'staging'));
            // making sure the right methods were called
            expect(s).toHaveBeenCalled();
            expect(s.calls.length).toEqual(3);

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
            shell.mkdir('-p', plugins_dir);
            shell.cp('-rf', dummyplugin, plugins_dir);
            shell.rm('-rf', path.join(plugins_dir, 'dummyplugin', 'www', 'dummyplugin')); 
            expect(function() {
                install('android', temp, 'DummyPlugin', plugins_dir, '.', {}, path.join(temp, 'staging'));
            }).toThrow();
            // making sure the right methods were called
            expect(sCopyFile).toHaveBeenCalled();
            expect(sCopyFile.calls.length).toEqual(3);

            expect(sRemoveFile).toHaveBeenCalled();
            expect(sRemoveFile.calls.length).toEqual(1);
            expect(sRemoveFileF).toHaveBeenCalled();
            expect(sRemoveFileF.calls.length).toEqual(1);
           
            expect(fs.existsSync(path.join(temp, 'staging', 'dummyplugin.js'))).toBe(false);
            expect(fs.existsSync(path.join(temp, 'staging', 'dummyplugin'))).toBe(false);
        });

        it('should call prepare after a successful install', function() {
            var s = spyOn(plugman, 'prepare');
            install('android', temp, dummyplugin, plugins_dir, '.', {});
            expect(s).toHaveBeenCalled();
        });

        it('should call fetch if provided plugin cannot be resolved locally', function() {
            var s = spyOn(plugman, 'fetch');
            install('android', temp, 'CLEANYOURSHORTS', plugins_dir, '.', {});
            expect(s).toHaveBeenCalled();
        });
        it('should call the config-changes module\'s add_installed_plugin_to_prepare_queue method', function() {
            var spy = spyOn(config_changes, 'add_installed_plugin_to_prepare_queue');
            install('android', temp, dummyplugin, plugins_dir, '.', {});
            expect(spy).toHaveBeenCalledWith(plugins_dir, dummy_id, 'android', {}, true);
        });
        it('should notify if plugin is already installed into project', function() {
            expect(function() {
                install('android', temp, dummyplugin, plugins_dir,'.',  {});
            }).not.toThrow();
            var spy = spyOn(console, 'log');
            install('android', temp, dummyplugin, plugins_dir, '.', {});
            expect(spy).toHaveBeenCalledWith('Plugin "com.phonegap.plugins.dummyplugin" already installed, \'sall good.');
        });

        describe('with dependencies', function() {
            it('should process all dependent plugins', function() {
                var spy = spyOn(actions.prototype, 'process').andCallThrough();
                shell.mkdir('-p', plugins_dir);
                shell.cp('-rf', dep_a, plugins_dir);
                shell.cp('-rf', dep_d, plugins_dir);
                shell.cp('-rf', dep_c, plugins_dir);
                install('android', temp, 'A', plugins_dir, '.', {});
                expect(spy.calls.length).toEqual(3);
            });
            it('should fetch any dependent plugins if missing', function() {
                var spy = spyOn(plugman, 'fetch');
                shell.mkdir('-p', plugins_dir);
                shell.cp('-rf', dep_a, plugins_dir);
                shell.cp('-rf', dep_c, plugins_dir);
                install('android', temp, 'A', plugins_dir, '.', {});
                expect(spy).toHaveBeenCalled();
            });
        });
    });

    describe('failure', function() {
        it('should throw if asset target already exists', function() {
            var target = path.join(temp, 'assets', 'www', 'dummyplugin.js');
            fs.writeFileSync(target, 'some bs', 'utf-8');
            expect(function() {
                install('android', temp, dummyplugin, plugins_dir, '.', {});
            }).toThrow();
        });
        it('should throw if platform is unrecognized', function() {
            expect(function() {
                install('atari', temp, 'SomePlugin', plugins_dir, {});
            }).toThrow('atari not supported.');
        });
        it('should throw if variables are missing', function() {
            expect(function() {
                install('android', temp, variableplugin, plugins_dir, '.', {});
            }).toThrow('Variable(s) missing: API_KEY');
        });
        it('should throw if a file required for installation cannot be found', function() {
            shell.mkdir('-p', plugins_dir);
            shell.cp('-rf', dummyplugin, plugins_dir);
            shell.rm(path.join(plugins_dir, 'DummyPlugin', 'src', 'android', 'DummyPlugin.java')); 
            
            expect(function() {
                install('android', temp, 'DummyPlugin', plugins_dir, '.', {});
            }).toThrow();
        });
        it('should pass error into specified callback if a file required for installation cannot be found', function(done) {
            shell.mkdir('-p', plugins_dir);
            shell.cp('-rf', dummyplugin, plugins_dir);
            shell.rm(path.join(plugins_dir, 'DummyPlugin', 'src', 'android', 'DummyPlugin.java')); 
            
            install('android', temp, 'DummyPlugin', plugins_dir, '.', {}, null, function(err) {
                expect(err).toBeDefined();
                done();
            });
        });
    });
});

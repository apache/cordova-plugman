var install = require('../src/install'),
    android = require('../src/platforms/android'),
    ios     = require('../src/platforms/ios'),
    blackberry = require('../src/platforms/blackberry'),
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
    blackberry_project = path.join(__dirname, 'projects', 'blackberry', '*');
    ios_project = path.join(__dirname, 'projects', 'ios-config-xml', '*');
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
    });
});

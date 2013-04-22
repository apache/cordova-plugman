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
        shell.cp('-rf', android_one_project, temp);
        shell.cp('-rf', dummyplugin, plugins_dir);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    describe('success', function() {
        // TODO: possibly test how diff platform transaction logs are created
        it('should generate and pass uninstall transaction log to appropriate platform handler\'s uninstall', function() {
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
        it('should handle a failed uninstall by passing completed transactions into appropriate handler\'s uninstall method'); 
    });
});

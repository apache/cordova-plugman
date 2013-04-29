var uninstall = require('../src/uninstall'),
    install = require('../src/install'),
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
    childbrowser = path.join(__dirname, 'plugins', 'ChildBrowser'),
    dummyplugin = path.join(__dirname, 'plugins', 'DummyPlugin'),
    variableplugin = path.join(__dirname, 'plugins', 'VariablePlugin'),
    faultyplugin = path.join(__dirname, 'plugins', 'FaultyPlugin'),
    android_one_project = path.join(__dirname, 'projects', 'android_one', '*'),
    blackberry_project = path.join(__dirname, 'projects', 'blackberry', '*'),
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
        it('should generate and pass uninstall transaction log to appropriate platform handler\'s uninstall', function() {
            uninstall('android', temp, 'DummyPlugin', plugins_dir, {});
            var transactions = android_uninstaller.mostRecentCall.args[0];

            expect(transactions.length).toEqual(6);
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
        it('should handle a failed uninstall by passing completed transactions into appropriate handler\'s install method', function() {
            shell.cp('-rf', faultyplugin, plugins_dir);
            install('android', temp, 'DummyPlugin', plugins_dir, {});
            var s = spyOn(android, 'install');
            // destroy android manifest /manifest/application so pruneXML fails 
            var manifest_path = path.join(temp, 'AndroidManifest.xml');
            var manifest = xml_helpers.parseElementtreeSync(manifest_path);
            var app_el = manifest.find('application');
            manifest.getroot().remove(0, app_el);
            var output = manifest.write({indent:4});
            fs.writeFileSync(manifest_path, output);

            uninstall('android', temp, 'DummyPlugin', plugins_dir, {});
            var executed_txs = s.mostRecentCall.args[0];
            expect(executed_txs.length).toEqual(1);
            // It only ended up "uninstalling" one source file, so install reversion should pass in that source file to re-install
            expect(executed_txs[0].tag).toEqual('source-file');
        }); 
    });
});

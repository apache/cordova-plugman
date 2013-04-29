var configChanges = require('../../src/util/config-changes'),
    xml_helpers = require('../../src/util/xml-helpers'),
    fs      = require('fs'),
    os      = require('osenv'),
    et      = require('elementtree'),
    path    = require('path'),
    plist = require('plist'),
    shell   = require('shelljs'),
    temp    = path.join(os.tmpdir(), 'plugman'),
    dummyplugin = path.join(__dirname, '..', 'plugins', 'DummyPlugin'),
    childrenplugin = path.join(__dirname, '..', 'plugins', 'multiple-children'),
    configplugin = path.join(__dirname, '..', 'plugins', 'ConfigTestPlugin'),
    varplugin = path.join(__dirname, '..', 'plugins', 'VariablePlugin'),
    android_two_project = path.join(__dirname, '..', 'projects', 'android_two', '*'),
    ios_plist_project = path.join(__dirname, '..', 'projects', 'ios-plist', '*'),
    ios_config_xml = path.join(__dirname, '..', 'projects', 'ios-config-xml', '*'),
    plugins_dir = path.join(temp, 'cordova', 'plugins');

var dummy_xml = new et.ElementTree(et.XML(fs.readFileSync(path.join(dummyplugin, 'plugin.xml'), 'utf-8')));

function innerXML(xmltext) {
    return xmltext.replace(/^<[\w\s\-=\/"\.]+>/, '').replace(/<\/[\w\s\-=\/"\.]+>$/,'');
}

describe('config-changes module', function() {
    beforeEach(function() {
        shell.mkdir('-p', temp);
        shell.mkdir('-p', plugins_dir);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    it('should have queue methods', function() {
        expect(configChanges.add_installed_plugin_to_prepare_queue).toBeDefined();
        expect(configChanges.add_uninstalled_plugin_to_prepare_queue).toBeDefined();
    });
    it('should have a get_platform_json method', function() {
        expect(configChanges.get_platform_json).toBeDefined();
    });
    it('should have a save_platform_json method', function() {
        expect(configChanges.save_platform_json).toBeDefined();
    });
    it('should have a generate_plugin_config_munge method', function() {
        expect(configChanges.generate_plugin_config_munge).toBeDefined();
    });
    it('should have a process method', function() {
        expect(configChanges.process).toBeDefined();
    });

    describe('queue methods', function() {
        describe('add_installed_plugin_to_prepare_queue', function() {
            it('should call get_platform_json method', function() {
                var spy = spyOn(configChanges, 'get_platform_json').andReturn({
                    prepare_queue:{
                        installed:[],
                        uninstalled:[]
                    }
                });
                configChanges.add_installed_plugin_to_prepare_queue(plugins_dir, 'PooPlugin', 'android', {});
                expect(spy).toHaveBeenCalledWith(plugins_dir, 'android');
            });
            it('should append specified plugin to platform.json', function() {
                configChanges.add_installed_plugin_to_prepare_queue(plugins_dir, 'PooPlugin', 'android', {});
                var json = configChanges.get_platform_json(plugins_dir, 'android');
                expect(json.prepare_queue.installed[0].plugin).toEqual('PooPlugin');
                expect(json.prepare_queue.installed[0].vars).toEqual({});
            });
            it('should append specified plugin with any variables to platform.json', function() {
                configChanges.add_installed_plugin_to_prepare_queue(plugins_dir, 'PooPlugin', 'android', {'dude':'man'});
                var json = configChanges.get_platform_json(plugins_dir, 'android');
                expect(json.prepare_queue.installed[0].plugin).toEqual('PooPlugin');
                expect(json.prepare_queue.installed[0].vars).toEqual({'dude':'man'});
            });
            it('should call save_platform_json with updated config', function() {
                var spy = spyOn(configChanges, 'save_platform_json');
                configChanges.add_installed_plugin_to_prepare_queue(plugins_dir, 'PooPlugin', 'android', {});
                var config = spy.mostRecentCall.args[0];
                expect(config.prepare_queue.installed[0].plugin).toEqual('PooPlugin');
            });
        });
        
        describe('add_uninstalled_plugin_to_prepare_queue', function() {
            beforeEach(function() {
                shell.cp('-rf', dummyplugin, plugins_dir);
            });

            it('should call get_platform_json method', function() {
                var spy = spyOn(configChanges, 'get_platform_json').andReturn({
                    prepare_queue:{
                        installed:[],
                        uninstalled:[]
                    }
                });
                configChanges.add_uninstalled_plugin_to_prepare_queue(plugins_dir, 'DummyPlugin', 'android');
                expect(spy).toHaveBeenCalledWith(plugins_dir, 'android');
            });
            it('should append specified plugin to platform.json', function() {
                configChanges.add_uninstalled_plugin_to_prepare_queue(plugins_dir, 'DummyPlugin', 'android');
                var json = configChanges.get_platform_json(plugins_dir, 'android');
                expect(json.prepare_queue.uninstalled[0].plugin).toEqual('DummyPlugin');
                expect(json.prepare_queue.uninstalled[0].id).toEqual('com.phonegap.plugins.dummyplugin');
            });
            it('should call save_platform_json with updated config', function() {
                var spy = spyOn(configChanges, 'save_platform_json');
                configChanges.add_uninstalled_plugin_to_prepare_queue(plugins_dir, 'DummyPlugin', 'android', {});
                var config = spy.mostRecentCall.args[0];
                expect(config.prepare_queue.uninstalled[0].plugin).toEqual('DummyPlugin');
                expect(config.prepare_queue.uninstalled[0].id).toEqual('com.phonegap.plugins.dummyplugin');
            });
        });
    });

    describe('get_platform_json method', function() {
        it('should write out and return an empty config json file if it doesn\'t exist', function() {
            var filepath = path.join(plugins_dir, 'android.json');
            var cfg = configChanges.get_platform_json(plugins_dir, 'android');
            expect(cfg).toBeDefined();
            expect(cfg.prepare_queue).toBeDefined();
            expect(cfg.config_munge).toBeDefined();
            expect(cfg.installed_plugins).toBeDefined();
            expect(fs.existsSync(filepath)).toBe(true);
            expect(fs.readFileSync(filepath, 'utf-8')).toEqual(JSON.stringify(cfg));
        });
        it('should return the json file if it exists', function() {
            var filepath = path.join(plugins_dir, 'android.json');
            var json = {prepare_queue:{installed:[],uninstalled:[]},config_munge:{somechange:"blah"},installed_plugins:{}};
            fs.writeFileSync(filepath, JSON.stringify(json), 'utf-8');
            var cfg = configChanges.get_platform_json(plugins_dir, 'android');
            expect(JSON.stringify(json)).toEqual(JSON.stringify(cfg));
        });
    });

    xdescribe('save_platform_json method', function() {
        it('should write out specified json', function() {
            var filepath = path.join(plugins_dir, 'android.json');
            var cfg = {poop:true};
            configChanges.save_platform_json(cfg, plugins_dir, 'android');
            expect(fs.existsSync(filepath)).toBe(true);
            expect(fs.readFileSync(filepath, 'utf-8')).toEqual(JSON.stringify(cfg));
        });
    });

    describe('generate_plugin_config_munge method', function() {
        it('should return a flat config heirarchy for simple, one-off config changes', function() {
            var xml;
            var munge = configChanges.generate_plugin_config_munge(dummyplugin, 'android');
            expect(munge['AndroidManifest.xml']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest/application']).toBeDefined();
            xml = (new et.ElementTree(dummy_xml.find('./platform[@name="android"]/config-file[@target="AndroidManifest.xml"]'))).write({xml_declaration:false});
            xml = innerXML(xml);
            expect(munge['AndroidManifest.xml']['/manifest/application'][xml]).toEqual(1);
            expect(munge['res/xml/plugins.xml']).toBeDefined();
            expect(munge['res/xml/plugins.xml']['/plugins']).toBeDefined();
            xml = (new et.ElementTree(dummy_xml.find('./platform[@name="android"]/config-file[@target="res/xml/plugins.xml"]'))).write({xml_declaration:false});
            xml = innerXML(xml);
            expect(munge['res/xml/plugins.xml']['/plugins'][xml]).toEqual(1);
            expect(munge['res/xml/config.xml']).toBeDefined();
            expect(munge['res/xml/config.xml']['/cordova/plugins']).toBeDefined();
            xml = (new et.ElementTree(dummy_xml.find('./platform[@name="android"]/config-file[@target="res/xml/config.xml"]'))).write({xml_declaration:false});
            xml = innerXML(xml);
            expect(munge['res/xml/config.xml']['/cordova/plugins'][xml]).toEqual(1);
        });
        it('should split out multiple children of config-file elements into individual leaves', function() {
            var munge = configChanges.generate_plugin_config_munge(childrenplugin, 'android');
            expect(munge['AndroidManifest.xml']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']['<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']['<uses-permission android:name="android.permission.READ_PHONE_STATE" />']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']['<uses-permission android:name="android.permission.INTERNET" />']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']['<uses-permission android:name="android.permission.GET_ACCOUNTS" />']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']['<uses-permission android:name="android.permission.WAKE_LOCK" />']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']['<permission android:name="$PACKAGE_NAME.permission.C2D_MESSAGE" android:protectionLevel="signature" />']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']['<uses-permission android:name="$PACKAGE_NAME.permission.C2D_MESSAGE" />']).toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']['<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />']).toBeDefined();
        });
        it('should not use xml comments as config munge leaves', function() {
            var munge = configChanges.generate_plugin_config_munge(childrenplugin, 'android');
            expect(munge['AndroidManifest.xml']['/manifest']['<!--library-->']).not.toBeDefined();
            expect(munge['AndroidManifest.xml']['/manifest']['<!-- GCM connects to Google Services. -->']).not.toBeDefined();
        });
        it('should increment config heirarchy leaves if dfferent config-file elements target the same file + selector + xml', function() {
            var munge = configChanges.generate_plugin_config_munge(configplugin, 'android');
            expect(munge['res/xml/config.xml']['/widget']['<poop />']).toEqual(2);
        });
        it('should take into account interpolation variables', function() {
            var munge = configChanges.generate_plugin_config_munge(childrenplugin, 'android', {PACKAGE_NAME:'ca.filmaj.plugins'});
            expect(munge['AndroidManifest.xml']['/manifest']['<uses-permission android:name="ca.filmaj.plugins.permission.C2D_MESSAGE" />']).toBeDefined();
        });
        it('should special case plugins-plist elements into own property', function() {
            var munge = configChanges.generate_plugin_config_munge(dummyplugin, 'ios', {});
            expect(munge['plugins-plist']).toBeDefined();
            expect(munge['plugins-plist']['com.phonegap.plugins.dummyplugin']).toEqual('DummyPluginCommand');
        });
    });

    describe('processing of plugins (via process method)', function() {
        beforeEach(function() {
            shell.cp('-rf', dummyplugin, plugins_dir);
        });
        it('should generate config munges for queued plugins', function() {
            shell.cp('-rf', android_two_project, temp);
            var cfg = configChanges.get_platform_json(plugins_dir, 'android');
            cfg.prepare_queue.installed = [{'plugin':'DummyPlugin', 'vars':{}}];
            configChanges.save_platform_json(cfg, plugins_dir, 'android');
            var spy = spyOn(configChanges, 'generate_plugin_config_munge').andReturn({});
            configChanges.process(plugins_dir, temp, 'android');
            expect(spy).toHaveBeenCalledWith(path.join(plugins_dir, 'DummyPlugin'), 'android', {});
        });
        it('should get a reference to existing config munge by calling get_platform_json', function() {
            shell.cp('-rf', android_two_project, temp);
            var spy = spyOn(configChanges, 'get_platform_json').andReturn({
                prepare_queue:{
                    installed:[],
                    uninstalled:[]
                },
                config_munge:{}
            });
            configChanges.process(plugins_dir, temp, 'android');
            expect(spy).toHaveBeenCalledWith(plugins_dir, 'android');
        });
        describe(': installation', function() {

            it('should call graftXML for every new config munge it introduces (every leaf in config munge that does not exist)', function() {
                shell.cp('-rf', android_two_project, temp);
                var cfg = configChanges.get_platform_json(plugins_dir, 'android');
                cfg.prepare_queue.installed = [{'plugin':'DummyPlugin', 'vars':{}}];
                configChanges.save_platform_json(cfg, plugins_dir, 'android');

                var spy = spyOn(xml_helpers, 'graftXML').andReturn(true);

                var manifest_doc = new et.ElementTree(et.XML(fs.readFileSync(path.join(temp, 'AndroidManifest.xml'), 'utf-8')));
                var munge = dummy_xml.find('./platform[@name="android"]/config-file[@target="AndroidManifest.xml"]');
                configChanges.process(plugins_dir, temp, 'android');
                expect(spy.calls.length).toEqual(2);
                expect(spy.argsForCall[0][2]).toEqual('/manifest/application');
                expect(spy.argsForCall[1][2]).toEqual('/cordova/plugins');
            });
            it('should not call graftXML for a config munge that already exists from another plugin', function() {
                shell.cp('-rf', android_two_project, temp);
                shell.cp('-rf', configplugin, plugins_dir);
                var cfg = configChanges.get_platform_json(plugins_dir, 'android');
                cfg.prepare_queue.installed = [{'plugin':'ConfigTestPlugin', 'vars':{}}];
                configChanges.save_platform_json(cfg, plugins_dir, 'android');

                var spy = spyOn(xml_helpers, 'graftXML').andReturn(true);
                configChanges.process(plugins_dir, temp, 'android');
                expect(spy.calls.length).toEqual(1);
            });
            it('should not call graftXML for a config munge targeting a config file that does not exist', function() {
                shell.cp('-rf', android_two_project, temp);
                var cfg = configChanges.get_platform_json(plugins_dir, 'android');
                cfg.prepare_queue.installed = [{'plugin':'DummyPlugin', 'vars':{}}];
                configChanges.save_platform_json(cfg, plugins_dir, 'android');

                var spy = spyOn(fs, 'readFileSync').andCallThrough();

                configChanges.process(plugins_dir, temp, 'android');
                expect(spy).not.toHaveBeenCalledWith(path.join(temp, 'res', 'xml', 'plugins.xml'), 'utf-8');
            });
            it('should move successfully installed plugins from queue to installed plugins section, and include/retain vars if applicable', function() {
                shell.cp('-rf', varplugin, plugins_dir);
                var cfg = configChanges.get_platform_json(plugins_dir, 'android');
                cfg.prepare_queue.installed = [{'plugin':'VariablePlugin', 'vars':{"API_KEY":"hi"}}];
                configChanges.save_platform_json(cfg, plugins_dir, 'android');

                configChanges.process(plugins_dir, temp, 'android');

                cfg = configChanges.get_platform_json(plugins_dir, 'android');
                expect(cfg.prepare_queue.installed.length).toEqual(0);
                expect(cfg.installed_plugins['com.adobe.vars']).toBeDefined();
                expect(cfg.installed_plugins['com.adobe.vars']['API_KEY']).toEqual('hi');
            });
            it('should save changes to global config munge after completing an install', function() {
                shell.cp('-rf', android_two_project, temp);
                shell.cp('-rf', varplugin, plugins_dir);
                var cfg = configChanges.get_platform_json(plugins_dir, 'android');
                cfg.prepare_queue.installed = [{'plugin':'VariablePlugin', 'vars':{"API_KEY":"hi"}}];
                configChanges.save_platform_json(cfg, plugins_dir, 'android');

                var spy = spyOn(configChanges, 'save_platform_json');
                configChanges.process(plugins_dir, temp, 'android');
                expect(spy).toHaveBeenCalled();
            });
            describe('of <plugins-plist> elements', function() {
                it('should only be used in an applicably old cordova-ios projects', function() {
                    shell.cp('-rf', ios_plist_project, temp);
                    shell.cp('-rf', dummyplugin, plugins_dir);
                    var cfg = configChanges.get_platform_json(plugins_dir, 'ios');
                    cfg.prepare_queue.installed = [{'plugin':'DummyPlugin', 'vars':{}}];
                    configChanges.save_platform_json(cfg, plugins_dir, 'ios');

                    var spy = spyOn(plist, 'parseFileSync').andReturn({Plugins:{}});
                    configChanges.process(plugins_dir, temp, 'ios');
                    expect(spy).toHaveBeenCalledWith(path.join(temp, 'SampleApp', 'PhoneGap.plist'));
                });
            });
        });

        describe(': uninstallation', function() {
            it('should call pruneXML for every config munge it completely removes from the app (every leaf that is decremented to 0)', function() {
            });
            it('should call pruneXML with variables to interpolate if applicable', function() {
            });
            it('should not call pruneXML for a config munge that another plugin depends on', function() {
            });
            it('should not call pruneXML for a config munge targeting a config file that does not exist', function() {
            });
            it('should remove uninstalled plugins from installed plugins list', function() {
            });
            it('should only parse + remove plist plugin entries in applicably old ios projects', function() {
            });
            it('should save changes to global config munge after completing an uninstall', function() {
            });
        });
    });
});

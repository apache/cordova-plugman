var android = require('../../src/platforms/android'),
    common  = require('../../src/platforms/common'),
    install = require('../../src/install'),
    path    = require('path'),
    fs      = require('fs'),
    shell   = require('shelljs'),
    et      = require('elementtree'),
    os      = require('osenv'),
    temp    = path.join(os.tmpdir(), 'plugman'),
    plugins_dir = path.join(temp, 'cordova', 'plugins'),
    xml_helpers = require('../../src/util/xml-helpers'),
    plugins_module = require('../../src/util/plugins'),
    dummyplugin = path.join(__dirname, '..', 'plugins', 'DummyPlugin'),
    faultyplugin = path.join(__dirname, '..', 'plugins', 'FaultyPlugin'),
    variableplugin = path.join(__dirname, '..', 'plugins', 'VariablePlugin'),
    android_one_project = path.join(__dirname, '..', 'projects', 'android_one', '*'),
    android_two_project = path.join(__dirname, '..', 'projects', 'android_two', '*');

var xml_path     = path.join(dummyplugin, 'plugin.xml')
  , xml_text     = fs.readFileSync(xml_path, 'utf-8')
  , plugin_et    = new et.ElementTree(et.XML(xml_text));

var platformTag = plugin_et.find('./platform[@name="android"]');
var dummy_id = plugin_et._root.attrib['id'];
var valid_source = platformTag.findall('./source-file'),
    assets = plugin_et.findall('./asset'),
    configChanges = platformTag.findall('./config-file');

xml_path  = path.join(faultyplugin, 'plugin.xml')
xml_text  = fs.readFileSync(xml_path, 'utf-8')
plugin_et = new et.ElementTree(et.XML(xml_text));

platformTag = plugin_et.find('./platform[@name="android"]');
var invalid_source = platformTag.findall('./source-file');
var faulty_id = plugin_et._root.attrib['id'];

xml_path  = path.join(variableplugin, 'plugin.xml')
xml_text  = fs.readFileSync(xml_path, 'utf-8')
plugin_et = new et.ElementTree(et.XML(xml_text));
platformTag = plugin_et.find('./platform[@name="android"]');

var variable_id = plugin_et._root.attrib['id'];
var variable_configs = platformTag.findall('./config-file');

function copyArray(arr) {
    return Array.prototype.slice.call(arr, 0);
}

describe('android project handler', function() {
    it('should have an install function', function() {
        expect(typeof android.install).toEqual('function');
    });
    it('should have an uninstall function', function() {
        expect(typeof android.uninstall).toEqual('function');
    });
    it('should return cordova-android project www location using www_dir', function() {
        expect(android.www_dir('/')).toEqual('/assets/www');
    });

    describe('installation', function() {
        beforeEach(function() {
            shell.mkdir('-p', temp);
        });
        afterEach(function() {
            shell.rm('-rf', temp);
        });
        describe('of <source-file> elements', function() {
            beforeEach(function() {
                shell.cp('-rf', android_one_project, temp);
            });

            it('should copy stuff from one location to another by calling common.straightCopy', function() {
                var source = copyArray(valid_source);
                var s = spyOn(common, 'straightCopy');
                android.install(source, dummy_id, temp, dummyplugin, {});
                expect(s).toHaveBeenCalledWith(dummyplugin, 'src/android/DummyPlugin.java', temp, 'src/com/phonegap/plugins/dummyplugin/DummyPlugin.java');
            });
            it('should throw if source file cannot be found', function() {
                var source = copyArray(invalid_source);
                expect(function() {
                    android.install(source, faulty_id, temp, faultyplugin, {});
                }).toThrow('"' + path.resolve(faultyplugin, 'src/android/NotHere.java') + '" not found!');
            });
            it('should throw if target file already exists', function() {
                // write out a file
                var target = path.resolve(temp, 'src/com/phonegap/plugins/dummyplugin');
                shell.mkdir('-p', target);
                target = path.join(target, 'DummyPlugin.java');
                fs.writeFileSync(target, 'some bs', 'utf-8');

                var source = copyArray(valid_source);
                expect(function() {
                    android.install(source, dummy_id, temp, dummyplugin, {});
                }).toThrow('"' + target + '" already exists!');
            });
        });
        describe('of <config-file> elements', function() {
            it('should only target config.xml if that is applicable', function() {
                var config = copyArray(configChanges);
                shell.cp('-rf', android_two_project, temp);
                var s = spyOn(xml_helpers, 'parseElementtreeSync').andCallThrough();
                android.install(config, dummy_id, temp, dummyplugin, {});
                expect(s).toHaveBeenCalledWith(path.join(temp, 'res', 'xml', 'config.xml'));
                expect(s).not.toHaveBeenCalledWith(path.join(temp, 'res', 'xml', 'plugins.xml'));
            });
            it('should only target plugins.xml if that is applicable', function() {
                shell.cp('-rf', android_one_project, temp);
                var config = copyArray(configChanges);
                var s = spyOn(xml_helpers, 'parseElementtreeSync').andCallThrough();
                android.install(config, dummy_id, temp, dummyplugin, {});
                expect(s).not.toHaveBeenCalledWith(path.join(temp, 'res', 'xml', 'config.xml'));
                expect(s).toHaveBeenCalledWith(path.join(temp, 'res', 'xml', 'plugins.xml'));
            });
            it('should call into xml helper\'s graftXML', function() {
                shell.cp('-rf', android_one_project, temp);
                var config = copyArray(configChanges);
                var s = spyOn(xml_helpers, 'graftXML').andReturn(true);
                android.install(config, dummy_id, temp, dummyplugin, {});
                expect(s).toHaveBeenCalled();
            });
        });
        it('should call into plugins\'s searchAndReplace to interpolate variables properly', function() {
            shell.cp('-rf', android_one_project, temp);
            var config = copyArray(variable_configs);
            var s = spyOn(plugins_module, 'searchAndReplace');
            var vars = {
                'API_KEY':'batcountry'
            };
            android.install(config, variable_id, temp, variableplugin, vars);
            expect(s).toHaveBeenCalledWith(path.resolve(temp, 'AndroidManifest.xml'), vars);
            expect(s).toHaveBeenCalledWith(path.resolve(temp, 'res', 'xml', 'plugins.xml'), vars);
        });
    });

    describe('uninstallation', function() {
        beforeEach(function() {
            shell.mkdir('-p', temp);
            shell.mkdir('-p', plugins_dir);
            shell.cp('-rf', android_two_project, temp);
            shell.cp('-rf', dummyplugin, plugins_dir);
        });
        afterEach(function() {
            shell.rm('-rf', temp);
        });
        describe('of <source-file> elements', function() {
            it('should remove stuff by calling common.deleteJava', function(done) {
                var s = spyOn(common, 'deleteJava');
                install('android', temp, 'DummyPlugin', plugins_dir, {}, function() {
                    var source = copyArray(valid_source);
                    android.uninstall(source, dummy_id, temp, path.join(plugins_dir, 'DummyPlugin'));
                    expect(s).toHaveBeenCalledWith(temp, 'src/com/phonegap/plugins/dummyplugin/DummyPlugin.java');
                    done();
                });
            });
        });
        describe('of <config-file> elements', function() {
            it('should only target config.xml if that is applicable', function(done) {
                var config = copyArray(configChanges);
                var s = spyOn(xml_helpers, 'parseElementtreeSync').andCallThrough();
                install('android', temp, 'DummyPlugin', plugins_dir, {}, function() {
                    var config = copyArray(configChanges);
                    android.uninstall(config, dummy_id, temp, path.join(plugins_dir, 'DummyPlugin'));
                    expect(s).toHaveBeenCalledWith(path.join(temp, 'res', 'xml', 'config.xml'));
                    expect(s).not.toHaveBeenCalledWith(path.join(temp, 'res', 'xml', 'plugins.xml'));
                    done();
                });
            });
            it('should only target plugins.xml if that is applicable', function(done) {
                shell.rm('-rf', temp);
                shell.mkdir('-p', temp);
                shell.mkdir('-p', plugins_dir);
                shell.cp('-rf', android_one_project, temp);
                shell.cp('-rf', dummyplugin, plugins_dir);
                var config = copyArray(configChanges);
                var s = spyOn(xml_helpers, 'parseElementtreeSync').andCallThrough();
                install('android', temp, 'DummyPlugin', plugins_dir, {}, function() {
                    var config = copyArray(configChanges);
                    android.uninstall(config, dummy_id, temp, path.join(plugins_dir, 'DummyPlugin'));
                    expect(s).not.toHaveBeenCalledWith(path.join(temp, 'res', 'xml', 'config.xml'));
                    expect(s).toHaveBeenCalledWith(path.join(temp, 'res', 'xml', 'plugins.xml'));
                    done();
                });
            });
            it('should call into xml helper\'s pruneXML', function(done) {
                var config = copyArray(configChanges);
                install('android', temp, 'DummyPlugin', plugins_dir, {}, function() {
                    var s = spyOn(xml_helpers, 'pruneXML').andReturn(true);
                    android.uninstall(config, dummy_id, temp, path.join(plugins_dir, 'DummyPlugin'));
                    expect(s).toHaveBeenCalled();
                    done();
                });
            });
        });
        describe('of <asset> elements', function() {
            it('should remove www\'s plugins/<plugin-id> directory', function(done) {
                var as = copyArray(assets);
                install('android', temp, 'DummyPlugin', plugins_dir, {}, function() {
                    var s = spyOn(shell, 'rm');
                    android.uninstall(as, dummy_id, temp, path.join(plugins_dir, 'DummyPlugin'));
                    expect(s).toHaveBeenCalledWith('-rf', path.join(temp, 'assets', 'www', 'plugins', dummy_id));
                    done();
                });
            });
            it('should remove stuff specified by the element', function(done) {
                var as = copyArray(assets);
                install('android', temp, 'DummyPlugin', plugins_dir, {}, function() {
                    var s = spyOn(shell, 'rm');
                    android.uninstall(as, dummy_id, temp, path.join(plugins_dir, 'DummyPlugin'));
                    expect(s).toHaveBeenCalledWith('-rf', path.join(temp, 'assets', 'www', 'dummyplugin.js'));
                    expect(s).toHaveBeenCalledWith('-rf', path.join(temp, 'assets', 'www', 'dummyplugin'));
                    done();
                });
            });
        });
    });
});

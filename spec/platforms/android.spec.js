var android = require('../../src/platforms/android'),
    common  = require('../../src/platforms/common'),
    path    = require('path'),
    fs      = require('fs'),
    shell   = require('shelljs'),
    et      = require('elementtree'),
    os      = require('osenv'),
    temp    = path.join(os.tmpdir(), 'plugman'),
    dummyplugin = path.join(__dirname, '..', 'plugins', 'DummyPlugin'),
    faultyplugin = path.join(__dirname, '..', 'plugins', 'FaultyPlugin'),
    android_one_project = path.join(__dirname, '..', 'projects', 'android_one', '*');

var xml_path     = path.join(dummyplugin, 'plugin.xml')
  , xml_text     = fs.readFileSync(xml_path, 'utf-8')
  , plugin_et    = new et.ElementTree(et.XML(xml_text));

var platformTag = plugin_et.find('./platform[@name="android"]');
var dummy_id = plugin_et._root.attrib['id'];
var valid_source = platformTag.findall('./source-file'),
    libFiles = platformTag.findall('./library-file'),
    assets = plugin_et.findall('./asset'),
    configChanges = platformTag.findall('./config-file');

xml_path  = path.join(faultyplugin, 'plugin.xml')
xml_text  = fs.readFileSync(xml_path, 'utf-8')
plugin_et = new et.ElementTree(et.XML(xml_text));

platformTag = plugin_et.find('./platform[@name="android"]');
var invalid_source = platformTag.findall('./source-file');
var faulty_id = plugin_et._root.attrib['id'];

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
            shell.cp('-rf', android_one_project, temp);
        });
        afterEach(function() {
            shell.rm('-rf', temp);
        });
        describe('of <source-file> elements', function() {
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
        describe('of <library-file> elements', function() {
            it('should copy stuff from one location to another by calling common.straightCopy');
            it('should throw if source file cannot be found');
            it('should throw if target file already exists');
        });
        describe('of <config-file> elements', function() {
            it('should only target config.xml if that is applicable');
            it('should only target plugins.xml if that is applicable');
            it('should call into xml helper\'s graftXML');
        });
        it('should interpolate variables properly');
    });

    describe('uninstallation', function() {
        describe('of <source-file> elements', function() {
            it('should remove stuff by calling common.deleteJava');
            it('should remove empty dirs from java src dir heirarchy');
        });
        describe('of <library-file> elements', function() {
            it('should remove stuff using fs.unlinkSync');
        });
        describe('of <config-file> elements', function() {
            it('should only target config.xml if that is applicable');
            it('should only target plugins.xml if that is applicable');
            it('should call into xml helper\'s pruneXML');
        });
        describe('of <asset> elements', function() {
            it('should remove www\'s plugins <plugin-id> directory');
            it('should remove stuff specified by the element');
        });
    });
});

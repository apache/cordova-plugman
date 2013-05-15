var blackberry = require('../../src/platforms/blackberry'),
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
    blackberry_project = path.join(__dirname, '..', 'projects', 'blackberry', '*');

var xml_path     = path.join(dummyplugin, 'plugin.xml')
  , xml_text     = fs.readFileSync(xml_path, 'utf-8')
  , plugin_et    = new et.ElementTree(et.XML(xml_text));

var platformTag = plugin_et.find('./platform[@name="blackberry"]');
var dummy_id = plugin_et._root.attrib['id'];
var valid_source = platformTag.findall('./source-file'),
    assets = plugin_et.findall('./asset'),
    configChanges = platformTag.findall('./config-file');

xml_path  = path.join(faultyplugin, 'plugin.xml')
xml_text  = fs.readFileSync(xml_path, 'utf-8')
plugin_et = new et.ElementTree(et.XML(xml_text));

platformTag = plugin_et.find('./platform[@name="blackberry"]');
var invalid_source = platformTag.findall('./source-file');
var faulty_id = plugin_et._root.attrib['id'];

function copyArray(arr) {
    return Array.prototype.slice.call(arr, 0);
}

describe('blackberry project handler', function() {
    describe('www_dir method', function() {
        it('should return cordova-blackberry project www location using www_dir', function() {
            expect(blackberry.www_dir('/')).toEqual('/www');
        });
    });
    describe('package_name method', function() {
        it('should return the blackberry project package name based on what is in config.xml', function() {
            expect(blackberry.package_name(path.join(blackberry_project, '..'))).toEqual('cordovaExample');
        });
    });

    describe('installation', function() {
        beforeEach(function() {
            shell.mkdir('-p', temp);
            shell.cp('-rf', blackberry_project, temp);
        });
        afterEach(function() {
            shell.rm('-rf', temp);
        });
        describe('of <source-file> elements', function() {
            it('should copy stuff from one location to another by calling common.copyFile', function() {
                var source = copyArray(valid_source);
                var s = spyOn(common, 'copyFile');
                source.forEach(function(src) {
                    blackberry['source-file'].install(src, dummyplugin, temp);
                });
                expect(s).toHaveBeenCalledWith(dummyplugin, 'src/blackberry/client.js', temp, 'ext-qnx/cordova.echo/client.js');
                expect(s).toHaveBeenCalledWith(dummyplugin, 'src/blackberry/index.js', temp, 'ext-qnx/cordova.echo/index.js');
                expect(s).toHaveBeenCalledWith(dummyplugin, 'src/blackberry/manifest.json', temp, 'ext-qnx/cordova.echo/manifest.json');
            });
            it('should throw if source file cannot be found', function() {
                var source = copyArray(invalid_source);
                expect(function() {
                    blackberry['source-file'].install(source[1], faultyplugin, temp);
                }).toThrow('"' + path.resolve(faultyplugin, 'src/blackberry/device/echoJnext.so') + '" not found!');
            });
            it('should throw if target file already exists', function() {
                // write out a file
                var target = path.resolve(temp, 'ext-qnx/cordova.echo');
                shell.mkdir('-p', target);
                target = path.join(target, 'client.js');
                fs.writeFileSync(target, 'some bs', 'utf-8');

                var source = copyArray(valid_source);
                expect(function() {
                    blackberry['source-file'].install(source[0], dummyplugin, temp);
                }).toThrow('"' + target + '" already exists!');
            });
        });
    });

    describe('uninstallation', function() {
        beforeEach(function() {
            shell.mkdir('-p', temp);
            shell.mkdir('-p', plugins_dir);
            shell.cp('-rf', blackberry_project, temp);
            shell.cp('-rf', dummyplugin, plugins_dir);
        });
        afterEach(function() {
            shell.rm('-rf', temp);
        });
        describe('of <source-file> elements', function() {
            it('should remove stuff by calling common.deleteJava', function(done) {
                var s = spyOn(common, 'deleteJava');
                install('blackberry', temp, 'DummyPlugin', plugins_dir, '.', {}, undefined, function() {
                    var source = copyArray(valid_source);
                    source.forEach(function(src) {
                        blackberry['source-file'].uninstall(src, temp);
                    });
                    expect(s).toHaveBeenCalledWith(temp, 'ext-qnx/cordova.echo/client.js');
                    expect(s).toHaveBeenCalledWith(temp, 'ext-qnx/cordova.echo/index.js');
                    expect(s).toHaveBeenCalledWith(temp, 'ext-qnx/cordova.echo/manifest.json');
                    done();
                });
            });
        });
    });
});

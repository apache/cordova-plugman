var blackberry10 = require('../../src/platforms/blackberry10'),
    common = require('../../src/platforms/common'),
    install = require('../../src/install'),
    path = require('path'),
    fs = require('fs'),
    shell = require('shelljs'),
    et = require('elementtree'),
    os = require('osenv'),
    temp = path.join(os.tmpdir(), 'plugman'),
    plugins_dir = path.join(temp, 'cordova', 'plugins'),
    xml_helpers = require('../../src/util/xml-helpers'),
    plugins_module = require('../../src/util/plugins'),
    blackberry10_project = path.join(__dirname, '..', 'projects', 'blackberry10', '*'),
    plugins = {
        dummy: parsePlugin(path.join(__dirname, '..', 'plugins', 'DummyPlugin')),
        faulty: parsePlugin(path.join(__dirname, '..', 'plugins', 'FaultyPlugin')),
        echo: parsePlugin(path.join(__dirname, '..', 'plugins', 'cordova.echo'))
    };

function copyArray(arr) {
    return Array.prototype.slice.call(arr, 0);
}

function parsePlugin (pluginPath) {
    var pluginXML = fs.readFileSync(path.join(pluginPath, "plugin.xml"), "utf-8"),
        pluginEt = new et.ElementTree(et.XML(pluginXML)),
        platformTag = pluginEt.find('./platform[@name="blackberry10"]');

    return {
        path: pluginPath,
        id: pluginEt._root.attrib.id,
        assets: pluginEt.findall('./asset'),
        srcFiles: platformTag.findall('./source-file'),
        configChanges: platformTag.findall('./config-file'),
        libFiles: platformTag.findall('./lib-file')
    };
}


describe('blackberry10 project handler', function() {
    it('should have an install function', function() {
        expect(typeof blackberry10.install).toEqual('function');
    });
    it('should have an uninstall function', function() {
        expect(typeof blackberry10.uninstall).toEqual('function');
    });
    it('should return cordova-blackberry10 project www location using www_dir', function() {
        expect(blackberry10.www_dir('/')).toEqual('/www');
    });

    describe('installation', function() {
        beforeEach(function() {
            shell.mkdir('-p', temp);
            shell.cp('-rf', blackberry10_project, temp);
        });
        afterEach(function() {
            shell.rm('-rf', temp);
        });
        describe('of <lib-file> elements', function() {
            it("should copy so files to native/target/plugins", function () {
                var plugin = plugins.echo,
                    source = copyArray(plugin.libFiles),
                    s = spyOn(common, 'copyFile');

                blackberry10.install(source, plugin.id, temp, plugin.path, {});
                expect(s).toHaveBeenCalledWith(plugin.path, 'src/blackberry10/native/device/echoJnext.so', temp, 'native/device/plugins/jnext/echoJnext.so');
                expect(s).toHaveBeenCalledWith(plugin.path, 'src/blackberry10/native/simulator/echoJnext.so', temp, 'native/simulator/plugins/jnext/echoJnext.so');
            });
        });
        describe('of <source-file> elements', function() {
            it('should copy stuff from one location to another by calling common.copyFile', function() {
                var plugin = plugins.echo,
                    source = copyArray(plugin.srcFiles);
                    s = spyOn(common, 'copyFile');

                blackberry10.install(source, plugin.id, temp, plugin.path, {});
                expect(s).toHaveBeenCalledWith(plugin.path, 'src/blackberry10/index.js', temp, 'native/device/chrome/plugin/cordova.echo/index.js');
                expect(s).toHaveBeenCalledWith(plugin.path, 'src/blackberry10/index.js', temp, 'native/simulator/chrome/plugin/cordova.echo/index.js');
            });
            it('defaults to plugin id when dest is not present', function() {
                var source = copyArray(plugins.dummy.srcFiles);
                var s = spyOn(common, 'copyFile');
                blackberry10.install(source, plugins.dummy.id, temp, plugins.dummy.path, {});
                expect(s).toHaveBeenCalledWith(plugins.dummy.path, 'src/blackberry10/index.js', temp, 'native/device/chrome/plugin/' + plugins.dummy.id + '/index.js');
                expect(s).toHaveBeenCalledWith(plugins.dummy.path, 'src/blackberry10/index.js', temp, 'native/simulator/chrome/plugin/' + plugins.dummy.id + '/index.js');
            });
            it('should throw if source file cannot be found', function() {
                var source = copyArray(plugins.faulty.srcFiles);
                expect(function() {
                    blackberry10.install(source, plugins.faulty.id, temp, plugins.faulty.path, {});
                }).toThrow('"' + path.resolve(plugins.faulty.path, 'src/blackberry10/index.js') + '" not found!');
            });
            it('should throw if target file already exists', function() {
                // write out a file
                var target = path.resolve(temp, 'native/device/chrome/plugin/com.phonegap.plugins.dummyplugin');
                shell.mkdir('-p', target);
                target = path.join(target, 'index.js');
                fs.writeFileSync(target, 'some bs', 'utf-8');

                var source = copyArray(plugins.dummy.srcFiles);
                expect(function() {
                    blackberry10.install(source, plugins.dummy.id, temp, plugins.dummy.path, {});
                }).toThrow('"' + target + '" already exists!');
            });
        });
    });

    describe('uninstallation', function() {
        beforeEach(function() {
            shell.mkdir('-p', temp);
            shell.cp('-rf', blackberry10_project, temp);
        });
        afterEach(function() {
            shell.rm('-rf', temp);
        });
        describe('of <source-file> elements', function() {
            it('should remove stuff by calling common.removeFile', function(done) {
                var s = spyOn(common, 'removeFile'),
                    plugin = plugins.echo;
                install('blackberry10', temp, plugin.path, plugins_dir, {}, "", function() {
                    var source = copyArray(plugin.srcFiles);
                    blackberry10.uninstall(source, plugin.id, temp, plugin.path);
                    expect(s).toHaveBeenCalledWith(temp, 'native/device/chrome/plugin/cordova.echo/index.js');
                    expect(s).toHaveBeenCalledWith(temp, 'native/simulator/chrome/plugin/cordova.echo/index.js');
                    done();
                });
            });
            it('should remove stuff by calling common.removeFile', function(done) {
                var s = spyOn(common, 'removeFile'),
                    plugin = plugins.dummy;
                install('blackberry10', temp, plugin.path, plugins_dir, {}, "", function() {
                    var source = copyArray(plugin.srcFiles);
                    blackberry10.uninstall(source, plugin.id, temp, plugin.path);
                    expect(s).toHaveBeenCalledWith(temp, 'native/device/chrome/plugin/' + plugin.id + '/index.js');
                    expect(s).toHaveBeenCalledWith(temp, 'native/simulator/chrome/plugin/' + plugin.id + '/index.js');
                    done();
                });
            });
        });
        describe('of <lib-file> elements', function(done) {
            it("should remove so files from www/plugins", function (done) {
                var s = spyOn(common, 'removeFile'),
                    plugin = plugins.echo;
                install('blackberry10', temp, plugin.path, plugins_dir, {}, "", function() {
                    var source = copyArray(plugin.libFiles);
                    blackberry10.uninstall(source, plugin.id, temp, plugin.path);
                    expect(s).toHaveBeenCalledWith(temp, 'native/device/plugins/jnext/echoJnext.so');
                    expect(s).toHaveBeenCalledWith(temp, 'native/simulator/plugins/jnext/echoJnext.so');
                    done();
                });
            });
        });
        describe('of <asset> elements', function() {
            it('should remove www\'s plugins/<plugin-id> directory', function(done) {
                var plugin = plugins.dummy,
                    as = copyArray(plugin.assets);
                install('blackberry10', temp, plugin.path, plugins_dir, {}, "", function() {
                    var s = spyOn(shell, 'rm');
                    blackberry10.uninstall(as, plugin.id, temp, plugin.path);
                    expect(s).toHaveBeenCalledWith('-Rf', path.join(temp, 'www', 'plugins', plugin.id));
                    done();
                });
            });
            it('should remove stuff specified by the element', function(done) {
                var plugin = plugins.dummy,
                    as = copyArray(plugin.assets);
                install('blackberry10', temp, plugin.path, plugins_dir, {}, "", function() {
                    var s = spyOn(shell, 'rm');
                    blackberry10.uninstall(as, plugin.id, temp, plugin.path);
                    expect(s).toHaveBeenCalledWith('-Rf', path.join(temp, 'www', 'dummyplugin.js'));
                    expect(s).toHaveBeenCalledWith('-Rf', path.join(temp, 'www', 'dummyplugin'));
                    done();
                });
            });
        });
    });
});

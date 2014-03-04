var firefoxos = require('../../src/platforms/firefoxos'),
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
    firefoxos_project = path.join(__dirname, '..', 'projects', 'firefoxos', '*');

    // firefoxos_one_project = path.join(__dirname, '..', 'projects', 'firefoxos_one', '*'),
    // firefoxos_two_project = path.join(__dirname, '..', 'projects', 'firefoxos_two', '*');


var xml_path     = path.join(dummyplugin, 'plugin.xml'),
    xml_text     = fs.readFileSync(xml_path, 'utf-8'),
    plugin_et    = new et.ElementTree(et.XML(xml_text));

var platformTag = plugin_et.find('./platform[@name="firefoxos"]');
var dummy_id = plugin_et._root.attrib['id'];
var valid_source = platformTag.findall('./source-file'),
    valid_libs = platformTag.findall('./lib-file'),
    valid_resources = platformTag.findall('./resource-file'),
    assets = plugin_et.findall('./asset'),
    configChanges = platformTag.findall('./config-file');


xml_path  = path.join(faultyplugin, 'plugin.xml')
xml_text  = fs.readFileSync(xml_path, 'utf-8')
plugin_et = new et.ElementTree(et.XML(xml_text));

platformTag = plugin_et.find('./platform[@name="firefoxos"]');
var invalid_source = platformTag.findall('./source-file');

var faulty_id = plugin_et._root.attrib['id'];



xml_path  = path.join(variableplugin, 'plugin.xml')
xml_text  = fs.readFileSync(xml_path, 'utf-8')
plugin_et = new et.ElementTree(et.XML(xml_text));
platformTag = plugin_et.find('./platform[@name="firefoxos"]');

var variable_id = plugin_et._root.attrib['id'];
var variable_configs = platformTag.findall('./config-file');


function copyArray(arr) {
    return Array.prototype.slice.call(arr, 0);
}



describe('firefoxos project handler', function() {
    //require('../../plugman').on('verbose', console.log);
    //require('../../plugman').on('warn', console.log);

    describe('www_dir method', function() {
        it('should return cordova-firefoxos project www location using www_dir', function() {
            expect(firefoxos.www_dir(path.sep)).toEqual(path.sep + 'www');
        });
    });
    describe('package_name method', function() {
        it('should return an firefoxos project\'s proper package name', function() {
            expect(firefoxos.package_name(path.join(firefoxos_project, '..'))).toEqual('io.cordova.hellocordova');
        });
    });

    describe('installation', function() {
        beforeEach(function() {
            shell.mkdir('-p', temp);
        });
        afterEach(function() {
           shell.rm('-rf', temp);
        });
        describe('of <source-file> elements', function() {
            it('should copy stuff from one location to another by calling common.copyFile', function() {
                var source = copyArray(valid_source);
                var s = spyOn(common, 'copyFile');
                firefoxos['source-file'].install(source[0], dummyplugin, temp); 
                expect(s).toHaveBeenCalledWith(dummyplugin, 'src/firefoxos/DummyPlugin.js', temp, path.join('src', 'plugins', 'dummyplugin', 'DummyPlugin.js'));
            });
            it('should throw if source file cannot be found', function() {
                var source = copyArray(invalid_source);
                expect(function() {
                    firefoxos['source-file'].install(source[0], faultyplugin, temp); 
                }).toThrow('"' + path.resolve(faultyplugin, 'src/firefoxos/NotHere.js') + '" not found!');
            });
            it('should throw if target file already exists', function() {
                // write out a file
                var target = path.resolve(temp, 'src/plugins/dummyplugin');
                shell.mkdir('-p', target);
                target = path.join(target, 'DummyPlugin.js');
                fs.writeFileSync(target, 'some bs', 'utf-8');

                var source = copyArray(valid_source);
                expect(function() {
                    firefoxos['source-file'].install(source[0], dummyplugin, temp); 
                }).toThrow('"' + target + '" already exists!');
            });
        });
        /*
        describe('of <resource-file> elements', function() {
            it('should indicate that it is not suported', function() {
                var resource = copyArray(resource);
                expect(function() {
                    firefoxos['resource-file'].install(resource[0], faultyplugin, temp); 
                }).toThrow('"' + path.resolve(faultyplugin, 'src/firefoxos/NotHere.js') + '" not found!');
            });
        });*/
    });

    describe('uninstallation', function() {
        beforeEach(function() {
            shell.mkdir('-p', temp);
            shell.mkdir('-p', plugins_dir);
            shell.cp('-rf', firefoxos_project, temp);
        });
        afterEach(function() {
            shell.rm('-rf', temp);
        });
        describe('of <source-file> elements', function() {
            it('should remove stuff by calling common.removeFile', function(done) {
                var s = spyOn(common, 'removeFile');
                install('firefoxos', temp, dummyplugin, plugins_dir, {})
                .then(function() {
                    var source = copyArray(valid_source);
                    firefoxos['source-file'].uninstall(source[0], temp);
                    expect(s).toHaveBeenCalledWith(temp, path.join('src', 'plugins', 'dummyplugin', 'DummyPlugin.js'));
                    done();
                 });
            });
        });
    });
});






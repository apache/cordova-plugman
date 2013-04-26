var ios = require('../../src/platforms/ios'),
    install = require('../../src/install'),
    path = require('path'),
    fs = require('fs'),
    et = require('elementtree'),
    shell = require('shelljs'),
    os = require('osenv'),
    xcode = require('xcode'),
    plist = require('plist'),
    bplist = require('bplist-parser'),
    temp = path.join(os.tmpdir(), 'plugman'),
    plugins_dir = path.join(temp, 'cordova', 'plugins'),
    ios_config_xml_project = path.join(__dirname, '..', 'projects', 'ios-config-xml', '*'),
    ios_plist_project = path.join(__dirname, '..', 'projects', 'ios-plist', '*'),
    xml_helpers = require('../../src/util/xml-helpers'),
    variableplugin = path.join(__dirname, '..', 'plugins', 'VariablePlugin'),
    faultyplugin = path.join(__dirname, '..', 'plugins', 'FaultyPlugin'),
    plistplugin = path.join(__dirname, '..', 'plugins', 'PluginsPlistOnly'),
    dummyplugin = path.join(__dirname, '..', 'plugins', 'DummyPlugin');

var xml_path = path.join(dummyplugin, 'plugin.xml'),
    xml_test = fs.readFileSync(xml_path, 'utf-8'),
    plugin_et = new et.ElementTree(et.XML(xml_test));

var platformTag = plugin_et.find('./platform[@name="ios"]');
var dummy_id = plugin_et._root.attrib['id'];
var valid_source = platformTag.findall('./source-file'),
    valid_assets = plugin_et.findall('./asset'),
    valid_headers = platformTag.findall('./header-file'),
    valid_resources = platformTag.findall('./resource-file'),
    valid_frameworks = platformTag.findall('./framework'),
    plist_els = platformTag.findall('./plugins-plist'),
    dummy_configs = platformTag.findall('./config-file');

xml_path = path.join(variableplugin, 'plugin.xml');
xml_test = fs.readFileSync(xml_path, 'utf-8');
plugin_et = new et.ElementTree(et.XML(xml_test));
platformTag = plugin_et.find('./platform[@name="ios"]');

var variable_id = plugin_et._root.attrib['id'];
var variable_configs = platformTag.findall('./config-file');

xml_path = path.join(faultyplugin, 'plugin.xml');
xml_test = fs.readFileSync(xml_path, 'utf-8');
plugin_et = new et.ElementTree(et.XML(xml_test));
platformTag = plugin_et.find('./platform[@name="ios"]');

var faulty_id = plugin_et._root.attrib['id'];
var invalid_assets = plugin_et.findall('./asset');
var invalid_source = platformTag.findall('./source-file');
var invalid_headers = platformTag.findall('./header-file');
var invalid_resources = platformTag.findall('./resource-file');
var invalid_frameworks = platformTag.findall('./framework');

xml_path = path.join(plistplugin, 'plugin.xml');
xml_test = fs.readFileSync(xml_path, 'utf-8');
plugin_et = new et.ElementTree(et.XML(xml_test));
platformTag = plugin_et.find('./platform[@name="ios"]');

var plist_id = plugin_et._root.attrib['id'];
var plist_only_els = platformTag.findall('./plugins-plist');

function copyArray(arr) {
    return Array.prototype.slice.call(arr, 0);
}

describe('ios project handler', function() {
    beforeEach(function() {
        shell.mkdir('-p', temp);
        shell.mkdir('-p', plugins_dir);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    it('should have an install function', function() {
        expect(typeof ios.install).toEqual('function');
    });
    it('should have an uninstall function', function() {
        expect(typeof ios.uninstall).toEqual('function');
    });
    it('should return cordova-ios project www location using www_dir', function() {
        expect(ios.www_dir('/')).toEqual('/www');
    });

    describe('installation', function() {
        it('should throw if project is not an xcode project', function() {
            expect(function() {
                ios.install([], 'someid', temp, plugins_dir, {});
            }).toThrow('does not appear to be an xcode project (no xcode project file)');
        });
        it('should throw if project does not contain an appropriate PhoneGap/Cordova.plist file or config.xml file', function() {
            shell.cp('-rf', ios_config_xml_project, temp);
            shell.rm(path.join(temp, 'SampleApp', 'config.xml'));

            expect(function() {
                ios.install([], 'someid', temp, plugins_dir, {});
            }).toThrow('could not find PhoneGap/Cordova plist file, or config.xml file.');
        });

        describe('of <source-file> elements', function() {
            beforeEach(function() {
                shell.cp('-rf', ios_config_xml_project, temp);
            });

            it('should throw if source-file src cannot be found', function() {
                var source = copyArray(invalid_source);
                expect(function() {
                    ios.install(source, faulty_id, temp, faultyplugin, {});
                }).toThrow('cannot find "' + path.resolve(faultyplugin, 'src/ios/FaultyPluginCommand.m') + '" ios <source-file>');
            });
            it('should throw if source-file target already exists', function() {
                var source = copyArray(valid_source);
                var target = path.join(temp, 'SampleApp', 'Plugins', 'DummyPluginCommand.m');
                shell.mkdir('-p', path.dirname(target));
                fs.writeFileSync(target, 'some bs', 'utf-8');
                expect(function() {
                    ios.install(source, dummy_id, temp, dummyplugin, {});
                }).toThrow('target destination "' + target + '" already exists');
            });
            it('should call into xcodeproj\'s addSourceFile appropriately when element has no target-dir', function() {
                var source = copyArray(valid_source).filter(function(s) { return s.attrib['target-dir'] == undefined});
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addSourceFile:spy
                });
                ios.install(source, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join('Plugins', 'DummyPluginCommand.m'));
            });
            it('should call into xcodeproj\'s addSourceFile appropriately when element has a target-dir', function() {
                var source = copyArray(valid_source).filter(function(s) { return s.attrib['target-dir'] != undefined});
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addSourceFile:spy
                });
                ios.install(source, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join('Plugins', 'targetDir', 'TargetDirTest.m'));
            });
            it('should cp the file to the right target location when element has no target-dir', function() {
                var source = copyArray(valid_source).filter(function(s) { return s.attrib['target-dir'] == undefined});
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addSourceFile:function() {}
                });
                var spy = spyOn(shell, 'cp');
                ios.install(source, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join(dummyplugin, 'src', 'ios', 'DummyPluginCommand.m'), path.join(temp, 'SampleApp', 'Plugins', 'DummyPluginCommand.m'));
            });
            it('should cp the file to the right target location when element has a target-dir', function() {
                var source = copyArray(valid_source).filter(function(s) { return s.attrib['target-dir'] != undefined});
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addSourceFile:function() {}
                });
                var spy = spyOn(shell, 'cp');
                ios.install(source, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join(dummyplugin, 'src', 'ios', 'TargetDirTest.m'), path.join(temp, 'SampleApp', 'Plugins', 'targetDir', 'TargetDirTest.m'));
            });
        });

        describe('of <header-file> elements', function() {
            beforeEach(function() {
                shell.cp('-rf', ios_config_xml_project, temp);
            });

            it('should throw if header-file src cannot be found', function() {
                var headers = copyArray(invalid_headers);
                expect(function() {
                    ios.install(headers, faulty_id, temp, faultyplugin, {});
                }).toThrow('cannot find "' + path.resolve(faultyplugin, 'src/ios/FaultyPluginCommand.h') + '" ios <header-file>');
            });
            it('should throw if header-file target already exists', function() {
                var headers = copyArray(valid_headers);
                var target = path.join(temp, 'SampleApp', 'Plugins', 'DummyPluginCommand.h');
                shell.mkdir('-p', path.dirname(target));
                fs.writeFileSync(target, 'some bs', 'utf-8');
                expect(function() {
                    ios.install(headers, dummy_id, temp, dummyplugin, {});
                }).toThrow('target destination "' + target + '" already exists');
            });
            it('should call into xcodeproj\'s addHeaderFile appropriately when element has no target-dir', function() {
                var headers = copyArray(valid_headers).filter(function(s) { return s.attrib['target-dir'] == undefined});
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addHeaderFile:spy
                });
                ios.install(headers, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join('Plugins', 'DummyPluginCommand.h'));
            });
            it('should call into xcodeproj\'s addHeaderFile appropriately when element a no target-dir', function() {
                var headers = copyArray(valid_headers).filter(function(s) { return s.attrib['target-dir'] != undefined});
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addHeaderFile:spy
                });
                ios.install(headers, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join('Plugins', 'targetDir', 'TargetDirTest.h'));
            });
            it('should cp the file to the right target location when element has no target-dir', function() {
                var headers = copyArray(valid_headers).filter(function(s) { return s.attrib['target-dir'] == undefined});
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addHeaderFile:function() {}
                });
                var spy = spyOn(shell, 'cp');
                ios.install(headers, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join(dummyplugin, 'src', 'ios', 'DummyPluginCommand.h'), path.join(temp, 'SampleApp', 'Plugins', 'DummyPluginCommand.h'));
            });
            it('should cp the file to the right target location when element has a target-dir', function() {
                var headers = copyArray(valid_headers).filter(function(s) { return s.attrib['target-dir'] != undefined});
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addHeaderFile:function() {}
                });
                var spy = spyOn(shell, 'cp');
                ios.install(headers, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join(dummyplugin, 'src', 'ios', 'TargetDirTest.h'), path.join(temp, 'SampleApp', 'Plugins', 'targetDir', 'TargetDirTest.h'));
            });
        });

        describe('of <resource-file> elements', function() {
            beforeEach(function() {
                shell.cp('-rf', ios_config_xml_project, temp);
            });
            it('should throw if resource-file src cannot be found', function() {
                var resources = copyArray(invalid_resources);
                expect(function() {
                    ios.install(resources, faulty_id, temp, faultyplugin, {});
                }).toThrow('cannot find "' + path.resolve(faultyplugin, 'src/ios/IDontExist.bundle') + '" ios <resource-file>');
            });
            it('should throw if resource-file target already exists', function() {
                var resources = copyArray(valid_resources);
                var target = path.join(temp, 'SampleApp', 'Resources', 'DummyPlugin.bundle');
                shell.mkdir('-p', path.dirname(target));
                fs.writeFileSync(target, 'some bs', 'utf-8');
                expect(function() {
                    ios.install(resources, dummy_id, temp, dummyplugin, {});
                }).toThrow('target destination "' + target + '" already exists');
            });
            it('should call into xcodeproj\'s addResourceFile', function() {
                var resources = copyArray(valid_resources);
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addResourceFile:spy
                });
                ios.install(resources, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join('Resources', 'DummyPlugin.bundle'));
            });
            it('should cp the file to the right target location', function() {
                var resources = copyArray(valid_resources);
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addResourceFile:function() {}
                });
                var spy = spyOn(shell, 'cp');
                ios.install(resources, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith('-R', path.join(dummyplugin, 'src', 'ios', 'DummyPlugin.bundle'), path.join(temp, 'SampleApp', 'Resources'));
            });
        });
        
        describe('of <asset> elements', function() {
            beforeEach(function() {
                shell.cp('-rf', ios_config_xml_project, temp);
            });
            it('should throw if asset src cannot be found', function() {
                var assets = copyArray(invalid_assets);
                expect(function() {
                    ios.install(assets, faulty_id, temp, faultyplugin, {});
                }).toThrow('"' + path.resolve(faultyplugin, 'www/main.js') + '" not found!');
            });
            it('should throw if asset target already exists', function() {
                var assets = copyArray(valid_assets);
                var target = path.join(temp, 'www', 'dummyplugin.js');
                fs.writeFileSync(target, 'some bs', 'utf-8');
                expect(function() {
                    ios.install(assets, dummy_id, temp, dummyplugin, {});
                }).toThrow('"'+ target + '" already exists!');
            });
            it('should cp the file and directory to the right target location', function() {
                var assets = copyArray(valid_assets);
                var spy_cp = spyOn(shell, 'cp').andCallThrough();
                var spy_mkdir = spyOn(shell, 'mkdir').andCallThrough();
                ios.install(assets, dummy_id, temp, dummyplugin, {});
                expect(spy_mkdir).toHaveBeenCalledWith('-p', path.join(temp, 'www'));
                expect(spy_cp).toHaveBeenCalledWith(path.join(dummyplugin, 'www', 'dummyplugin.js'), path.join(temp, 'www', 'dummyplugin.js'));
                expect(spy_cp).toHaveBeenCalledWith('-R', path.join(dummyplugin, 'www', 'dummyplugin/*'), path.join(temp, 'www', 'dummyplugin'));
                
                // make sure the file and directory are properly copies
                expect(fs.existsSync(path.join(temp, 'www', 'dummyplugin.js'))).toBe(true);
                expect(fs.statSync(path.join(temp, 'www', 'dummyplugin.js')).isFile()).toBe(true);
                
                expect(fs.existsSync(path.join(temp, 'www', 'dummyplugin'))).toBe(true);
                expect(fs.statSync(path.join(temp, 'www', 'dummyplugin')).isDirectory()).toBe(true);
                
                expect(fs.existsSync(path.join(temp, 'www', 'dummyplugin', 'image.jpg'))).toBe(true);
                expect(fs.statSync(path.join(temp, 'www', 'dummyplugin', 'image.jpg')).isFile()).toBe(true);
            });
        });

        describe('of <framework> elements', function() {
            beforeEach(function() {
                shell.cp('-rf', ios_config_xml_project, temp);
            });
            it('should call into xcodeproj\'s addFramework with weak false by default' ,function() {
                var frameworks = copyArray(valid_frameworks).filter(function(f) { return f.attrib.weak == undefined; });
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addFramework:spy
                });
                ios.install(frameworks, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join('src', 'ios', 'libsqlite3.dylib'), {weak:false});
            });
            it('should pass in whether the framework is weak or not to xcodeproj.addFramework', function() {
                var frameworks = copyArray(valid_frameworks).filter(function(f) { return f.attrib.weak != undefined; });;
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    addFramework:spy
                });
                ios.install(frameworks, dummy_id, temp, dummyplugin, {});
                expect(spy).toHaveBeenCalledWith(path.join('src', 'ios', 'libsqlite3.dylib'), {weak:true});
            });
        });
    });

    describe('uninstallation', function() {
        it('should throw if project is not an xcode project', function() {
            expect(function() {
                ios.uninstall([], 'someid', temp, plugins_dir);
            }).toThrow('does not appear to be an xcode project (no xcode project file)');
        });
        it('should throw if project does not contain an appropriate PhoneGap/Cordova.plist file or config.xml file', function() {
            shell.cp('-rf', ios_config_xml_project, temp);
            shell.rm(path.join(temp, 'SampleApp', 'config.xml'));
            expect(function() {
                ios.uninstall([], 'someid', temp, plugins_dir);
            }).toThrow('could not find PhoneGap/Cordova plist file, or config.xml file.');
        });

        describe('of <source-file> elements', function() {
            it('should call into xcodeproj\'s removeSourceFile appropriately when element has no target-dir', function(){
                var source = copyArray(valid_source).filter(function(s) { return s.attrib['target-dir'] == undefined});
                shell.cp('-rf', ios_config_xml_project, temp);
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    removeSourceFile:spy
                });
                
                ios.uninstall(source, dummy_id, temp, dummyplugin);
                expect(spy).toHaveBeenCalledWith(path.join('Plugins', 'DummyPluginCommand.m'));
            });
            it('should call into xcodeproj\'s removeSourceFile appropriately when element a target-dir', function(){
                var source = copyArray(valid_source).filter(function(s) { return s.attrib['target-dir'] != undefined});
                shell.cp('-rf', ios_config_xml_project, temp);
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    removeSourceFile:function(){}
                });
                
                var spy = spyOn(shell, 'rm');
                ios.uninstall(source, dummy_id, temp, dummyplugin);
                expect(spy).toHaveBeenCalledWith('-rf', path.join(temp, 'SampleApp', 'Plugins', 'targetDir', 'TargetDirTest.m'));
            });
            it('should rm the file from the right target location when element has no target-dir', function(){
                var source = copyArray(valid_source).filter(function(s) { return s.attrib['target-dir'] == undefined});
                shell.cp('-rf', ios_config_xml_project, temp);
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    removeSourceFile:function(){}
                });
                
                var spy = spyOn(shell, 'rm');
                ios.uninstall(source, dummy_id, temp, dummyplugin);
                expect(spy).toHaveBeenCalledWith('-rf', path.join(temp, 'SampleApp', 'Plugins', 'DummyPluginCommand.m'));
            });
            it('should rm the file from the right target location when element has a target-dir', function(){
                var source = copyArray(valid_source).filter(function(s) { return s.attrib['target-dir'] != undefined});
                shell.cp('-rf', ios_config_xml_project, temp);
                var spy = jasmine.createSpy();
                spyOn(xcode, 'project').andReturn({
                    parseSync:function(){},
                    writeSync:function(){},
                    removeSourceFile:function(){}
                });
                
                var spy = spyOn(shell, 'rm');
                ios.uninstall(source, dummy_id, temp, dummyplugin);
                expect(spy).toHaveBeenCalledWith('-rf', path.join(temp, 'SampleApp', 'Plugins', 'targetDir', 'TargetDirTest.m'));
            });
        });

        describe('of <plugins-plist> elements', function() {
            it('should only be used in an applicably old cordova-ios project', function(){
                shell.cp('-rf', ios_plist_project, temp);
                var pls = copyArray(plist_els);
                var spy = spyOn(plist, 'parseFileSync').andReturn({Plugins:{}});
                ios.uninstall(pls, dummy_id, temp, dummyplugin);
                expect(spy).toHaveBeenCalledWith(path.join(temp, 'SampleApp', 'PhoneGap.plist'));
            });
            it('should not be used in an applicably old cordova-ios project', function() {
                shell.cp('-rf', ios_config_xml_project, temp);
                var pls = copyArray(plist_els);
                var spy = spyOn(plist, 'parseFileSync').andReturn({Plugins:{}});
                ios.uninstall(pls, dummy_id, temp, dummyplugin);
                expect(spy).not.toHaveBeenCalledWith(path.join(temp, 'SampleApp', 'config.xml'));
            });
            it('should remove the <plugin> element in applicably new cordova-ios projects with old-style plugins using only <plugins-plist> elements', function() {
                shell.cp('-rf', ios_config_xml_project, temp);
                var pls = copyArray(plist_only_els);
                ios.uninstall(pls, plist_id, temp, plistplugin);
                expect(fs.readFileSync(path.join(temp, 'SampleApp', 'config.xml'), 'utf-8')).toMatch(/<plugin name="OldSkewl"/gi);
            });
        });

        describe('of <config-file> elements', function() {
            it('should only be used in applicably new cordova-ios projects');
            it('should remove any applicable <plugin> elements in applicably new cordova-ios projects with old-style plugins using only <plugins-plist> elements');
            it('should call xml_helpers\' pruneXML');
            it('should write the new config file out after successfully pruning');
        });

        describe('of <asset> elements', function() {
            it('should call rm on specified asset',function(){
            
            });
            it('should call rm on the www/plugins/<plugin_id> folder');
        });

        describe('of <header-file> elements', function() {
            it('should call into xcodeproj\'s removeHeaderFile appropriately when element has no target-dir');
            it('should call into xcodeproj\'s removeHeaderFile appropriately when element a no target-dir');
            it('should rm the file from the right target location');
        });

        describe('of <resource-file> elements', function() {
            it('should call into xcodeproj\'s removeResourceFile');
            it('should rm the file from the right target location');
        });

        describe('of <framework> elements', function() {
            it('should call into xcodeproj\'s removeFramework');
        });
    });
});

var platforms = require('../src/platforms'),
    prepare = require('../src/prepare'),
    fs      = require('fs'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
    config_changes = require('../src/util/config-changes'),
    xml_helpers = require('../src/util/xml-helpers'),
    temp    = __dirname,
    childbrowser = 'ChildBrowser',
    dummyplugin = 'DummyPlugin',
    androidplugin = 'AndroidJS',
    plugins_dir = path.join(temp, 'plugins');
var json = path.join(temp, 'assets', 'www', 'cordova_plugins.json');
var js = path.join(temp, 'assets', 'www', 'cordova_plugins.js');

describe('prepare', function() {
    var proc, readdir, write, stat, read, parseET, mkdir;
    var root, findall, find;
    beforeEach(function() {
        mkdir = spyOn(shell, 'mkdir');
        proc = spyOn(config_changes, 'process');
        readdir = spyOn(fs, 'readdirSync').andReturn([]);
        write = spyOn(fs, 'writeFileSync');
        stat = spyOn(fs, 'statSync').andReturn({isDirectory:function() { return true; }});
        root = jasmine.createSpy('ElementTree getroot').andReturn({
            attrib:{
                id:'someid'
            }
        });
        findall = jasmine.createSpy('ElementTree findall');
        find = jasmine.createSpy('ElementTree find');
        parseET = spyOn(xml_helpers, 'parseElementtreeSync').andReturn({
            getroot:root,
            findall:findall,
            find:find
        });
    });
    it('should create a cordova_plugins.json file', function() {
        prepare(temp, 'android', plugins_dir);
        expect(write).toHaveBeenCalledWith(json, jasmine.any(String), 'utf-8');
    });
    it('should create a cordova_plugins.js file', function() {
        prepare(temp, 'android', plugins_dir);
        expect(write).toHaveBeenCalledWith(js, jasmine.any(String), 'utf-8');
    });
    describe('handling of js-modules', function() {
        var read, child_one;
        var fake_plugins = ['plugin_one', 'plugin_two'];
        beforeEach(function() {
            child_one = jasmine.createSpy('getchildren').andReturn([]);
            read = spyOn(fs, 'readFileSync').andReturn('JAVASCRIPT!');
            readdir.andReturn(fake_plugins);
            findall.andReturn([
                {attrib:{src:'somedir', name:'NAME'}, getchildren:child_one},
                {attrib:{src:'someotherdir', name:'NAME'}, getchildren:child_one}
            ]);
        });
        it('should create a plugins directory in an application\'s www directory', function() {
            prepare(temp, 'android', plugins_dir);
            expect(mkdir).toHaveBeenCalledWith('-p',path.join(temp, 'assets', 'www', 'plugins'));
        });
        it('should write out one file per js module', function() {
            prepare(temp, 'android', plugins_dir);
            expect(write).toHaveBeenCalledWith(path.join(temp, 'assets', 'www', 'plugins', 'someid', 'somedir'), jasmine.any(String), 'utf-8');
            expect(write).toHaveBeenCalledWith(path.join(temp, 'assets', 'www', 'plugins', 'someid', 'someotherdir'), jasmine.any(String), 'utf-8');
        });
    });
    it('should call into config-changes\' process method to do config processing', function() {
        prepare(temp, 'android', plugins_dir);
        expect(proc).toHaveBeenCalledWith(plugins_dir, temp, 'android');
    });
});

var platforms = require('../src/platforms'),
    prepare = require('../src/prepare'),
    common  = require('../src/platforms/common');
    fs      = require('fs'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
    config_changes = require('../src/util/config-changes'),
    temp    = __dirname,
    plugins_dir = path.join(temp, 'plugins');

var json = path.join(temp, 'assets', 'www', 'cordova_plugins.json');
var js = path.join(temp, 'assets', 'www', 'cordova_plugins.js');

describe('prepare', function() {
    var proc, platform_json, write, mkdir, rm;
    beforeEach(function() {
        rm = spyOn(shell, 'rm');
        mkdir = spyOn(shell, 'mkdir');
        proc = spyOn(config_changes, 'process');
        platform_json = spyOn(config_changes, 'get_platform_json').andReturn({installed_plugins:{},dependent_plugins:{},prepare_queue:{uninstalled:[]}});
        write = spyOn(fs, 'writeFileSync');
    });
    it('should create cordova_plugins.js file in a custom www directory', function() {
        var custom_www = path.join(temp, 'assets', 'custom_www'),
            js = path.join(temp, 'assets', 'custom_www', 'cordova_plugins.js');
        prepare(temp, 'android', plugins_dir, custom_www);
        expect(write).toHaveBeenCalledWith(js, jasmine.any(String), 'utf-8');
    });
    describe('handling of js-modules', function() {
        var copySpy;
        beforeEach(function() {
            copySpy = spyOn(common, 'copyFile');
            platform_json.andReturn({
                installed_plugins: {plugin_one: '', plugin_two: ''},
                dependent_plugins: {}, prepare_queue: {uninstalled:[]}
            });
        });
        describe('uninstallation/removal', function() {
            var existsSync;
            beforeEach(function() {
                existsSync = spyOn(fs, 'existsSync').andReturn(true);
                platform_json.andReturn({installed_plugins:{},dependent_plugins:{},prepare_queue:{uninstalled:[{
                    plugin:'nickelback',
                    id:'nickelback',
                    topLevel:true
                }]}});
            });
            it('should remove any www/plugins directories related to plugins being queued for removal', function() {
                prepare(temp, 'android', plugins_dir);
                expect(rm).toHaveBeenCalledWith('-rf', path.join(temp, 'assets', 'www', 'plugins', 'nickelback'));
            });
        });
    });
    it('should call into config-changes\' process method to do config processing', function() {
        prepare(temp, 'android', plugins_dir);
        expect(proc).toHaveBeenCalledWith(plugins_dir, temp, 'android');
    });
});

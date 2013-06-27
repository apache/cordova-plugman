var uninstall = require('../src/uninstall'),
    actions = require('../src/util/action-stack'),
    config_changes = require('../src/util/config-changes'),
    xml_helpers = require('../src/util/xml-helpers'),
    plugman = require('../plugman'),
    fs      = require('fs'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
    semver  = require('semver'),
    temp    = __dirname,
    dummyplugin = 'DummyPlugin',
    dummy_id = 'com.phonegap.plugins.dummyplugin',
    variableplugin = 'VariablePlugin',
    engineplugin = 'EnginePlugin',
    plugins_dir = path.join(temp, 'plugins');

describe('uninstall', function() {
    var exists, get_json, chmod, exec, proc, add_to_queue, prepare, actions_push, c_a, rm;
    beforeEach(function() {
        proc = spyOn(actions.prototype, 'process').andCallFake(function(platform, proj, cb) {
            cb();
        });
        actions_push = spyOn(actions.prototype, 'push');
        c_a = spyOn(actions.prototype, 'createAction');
        prepare = spyOn(plugman, 'prepare');
        exec = spyOn(shell, 'exec').andReturn({code:1});
        chmod = spyOn(fs, 'chmodSync');
        exists = spyOn(fs, 'existsSync').andReturn(true);
        get_json = spyOn(config_changes, 'get_platform_json').andReturn({
            installed_plugins:{},
            dependent_plugins:{}
        });
        rm = spyOn(shell, 'rm');
        add_to_queue = spyOn(config_changes, 'add_uninstalled_plugin_to_prepare_queue');
    });
    describe('success', function() {
        it('should call prepare after a successful uninstall', function() {
            uninstall('android', temp, dummyplugin, plugins_dir, {});
            expect(prepare).toHaveBeenCalled();
        });
        it('should call the config-changes module\'s add_uninstalled_plugin_to_prepare_queue method after processing an install', function() {
            uninstall('android', temp, dummyplugin, plugins_dir, {});
            expect(add_to_queue).toHaveBeenCalledWith(plugins_dir, 'DummyPlugin', 'android', true);
        });
        it('should queue up actions as appropriate for that plugin and call process on the action stack', function() {
            uninstall('android', temp, dummyplugin, plugins_dir, {});
            expect(actions_push.calls.length).toEqual(3);
            expect(c_a).toHaveBeenCalledWith(jasmine.any(Function), [jasmine.any(Object), temp, dummy_id], jasmine.any(Function), [jasmine.any(Object), path.join(plugins_dir, dummyplugin), temp, dummy_id]);
            expect(proc).toHaveBeenCalled();
        });

        describe('with dependencies', function() {
            it('should uninstall "dangling" dependencies');
            it('should not uninstall any dependencies that are relied on by other plugins'); 
        });
    });
    
    describe('failure', function() {
        it('should throw if platform is unrecognized', function() {
            expect(function() {
                uninstall('atari', temp, 'SomePlugin', plugins_dir, {});
            }).toThrow('atari not supported.');
        });
        it('should throw if plugin is missing', function() {
            exists.andReturn(false);
            expect(function() {
                uninstall('android', temp, 'SomePluginThatDoesntExist', plugins_dir, {});
            }).toThrow('Plugin "SomePluginThatDoesntExist" not found. Already uninstalled?');
        });
    });
});

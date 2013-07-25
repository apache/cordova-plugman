var install = require('../src/install'),
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
    childplugin = 'ChildBrowser',
    plugins_dir = path.join(temp, 'plugins');

describe('install', function() {
    var exists, get_json, chmod, exec, proc, add_to_queue, prepare, actions_push, c_a, mkdir;
    beforeEach(function() {
        proc = spyOn(actions.prototype, 'process').andCallFake(function(platform, proj, cb) {
            cb();
        });
        mkdir = spyOn(shell, 'mkdir');
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
        add_to_queue = spyOn(config_changes, 'add_installed_plugin_to_prepare_queue');
    });
    describe('success', function() {
        it('should check version if plugin has engine tag', function(){
            var spy = spyOn(semver, 'satisfies').andReturn(true);
            install('android', temp, 'engineplugin', plugins_dir, {});
            expect(spy).toHaveBeenCalledWith('5.0.0','9.2.1');
        });
        
        /*
        it('should check version and munge it a little if it has "rc" in it so it plays nice with semver (introduce a dash in it)', function() {
            var spy = spyOn(semver, 'satisfies').andReturn(true);
            exec.andReturn({code:0,output:"3.0.0rc1"});
            install('android', temp, 'engineplugin', plugins_dir, {});
            expect(spy).toHaveBeenCalledWith('3.0.0-rc1','>=2.3.0');
        });
        */
    });

});

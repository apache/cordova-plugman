var platforms = require('../src/platforms'),
    prepare = require('../src/prepare'),
    fs      = require('fs'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
    config_changes = require('../src/util/config-changes'),
    temp    = path.join(os.tmpdir(), 'plugman'),
    childbrowser = path.join(__dirname, 'plugins', 'ChildBrowser'),
    dummyplugin = path.join(__dirname, 'plugins', 'DummyPlugin'),
    androidplugin = path.join(__dirname, 'plugins', 'AndroidJS'),
    android_one_project = path.join(__dirname, 'projects', 'android_one', '*');
    plugins_dir = path.join(temp, 'cordova', 'plugins');

describe('prepare', function() {
    beforeEach(function() {
        shell.mkdir('-p', temp);
        shell.mkdir('-p', plugins_dir);
        shell.cp('-rf', childbrowser, plugins_dir);
        shell.cp('-rf', android_one_project, temp);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    var www = path.join(temp, 'assets', 'www');
    
    it('should create a cordova_plugins.json file', function() {
        prepare(temp, 'android', plugins_dir);
        expect(fs.existsSync(path.join(www, 'cordova_plugins.json'))).toBe(true);
    });
    it('should create a plugins directory in an application\'s www directory', function() {
        shell.cp('-rf', dummyplugin, plugins_dir);
        prepare(temp, 'android', plugins_dir);
        expect(fs.existsSync(path.join(www, 'plugins'))).toBe(true);
    });
    it('should not add code to load platform js in a project for a different platform', function() {
        shell.cp('-rf', dummyplugin, plugins_dir);
        prepare(temp, 'android', plugins_dir);
        var plugins = JSON.parse(fs.readFileSync(path.join(www, 'cordova_plugins.json'), 'utf-8'));
        expect(plugins.length).toEqual(1);
        expect(plugins[0].id).not.toMatch(/dummy/);
    });
    it('should add code to load platform js if platform is applicable', function() {
        shell.cp('-rf', androidplugin, plugins_dir);
        prepare(temp, 'android', plugins_dir);
        var plugins = JSON.parse(fs.readFileSync(path.join(www, 'cordova_plugins.json'), 'utf-8'));
        expect(plugins.length).toEqual(2);
        expect(plugins[0].id).toMatch(/android/);
    });
    it('should parse js modules for multiple plugins added to a single project', function() {
        shell.cp('-rf', androidplugin, plugins_dir);
        prepare(temp, 'android', plugins_dir);
        var plugins = JSON.parse(fs.readFileSync(path.join(www, 'cordova_plugins.json'), 'utf-8'));
        expect(plugins.length).toEqual(2);
    });
    it('should write out an empty cordova_plugins.json if no plugins are applicable', function() {
        shell.rm('-rf', path.join(plugins_dir, '*'));
        prepare(temp, 'android', plugins_dir);
        var plugins = JSON.parse(fs.readFileSync(path.join(www, 'cordova_plugins.json'), 'utf-8'));
        expect(plugins.length).toEqual(0);
    });

    it('should call into config-changes\' process method to do config processing', function() {
        var spy = spyOn(config_changes, 'process');
        prepare(temp, 'android', plugins_dir);
        expect(spy).toHaveBeenCalledWith(plugins_dir, temp, 'android');
    });
});

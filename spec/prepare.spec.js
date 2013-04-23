var prepare = require('../src/prepare'),
    fs      = require('fs'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
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
        shell.cp('-rf', android_one_project, temp);
        shell.cp('-rf', childbrowser, plugins_dir);
    });
    afterEach(function() {
        shell.rm('-rf', temp);
    });

    var www = path.join(temp, 'assets', 'www');
    
    it('should create a cordova_plugins.json file', function() {
        prepare(temp, 'android', plugins_dir);
        expect(fs.existsSync(path.join(www, 'cordova_plugins.json'))).toBe(true);
    });
    it('should copy over assets defined in <asset> elements', function() {
        prepare(temp, 'android', plugins_dir);
        expect(fs.existsSync(path.join(www, 'childbrowser_file.html'))).toBe(true);
        expect(fs.statSync(path.join(www, 'childbrowser')).isDirectory()).toBe(true);
    });
    it('should create a plugins directory in an application\'s www directory', function() {
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
});

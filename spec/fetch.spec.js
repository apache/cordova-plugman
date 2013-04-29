var fetch   = require('../src/fetch'),
    fs      = require('fs'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
    temp    = path.join(os.tmpdir(), 'plugman'),
    test_plugin = path.join(__dirname, 'plugins', 'ChildBrowser'),
    plugins = require('../src/util/plugins');

describe('fetch', function() {
    var copied_plugin_path = path.join(temp,'ChildBrowser');

    beforeEach(function() {
        shell.mkdir('-p', temp);
    });
    afterEach(function() {
        try{shell.rm('-rf', temp);}catch(e){}
    });

    describe('local plugins', function() {
        it('should copy locally-available plugin to plugins directory', function() {
            fetch(test_plugin, temp, false);
            expect(fs.existsSync(copied_plugin_path)).toBe(true);
        });
        it('should copy locally-available plugin to plugins directory when specified with a trailing slash', function() {
            fetch(test_plugin+'/', temp, false);
            expect(fs.existsSync(copied_plugin_path)).toBe(true);
        });
        it('should create a symlink if used with `link` param', function() {
            fetch(test_plugin, temp, true);
            expect(fs.lstatSync(copied_plugin_path).isSymbolicLink()).toBe(true);
        });
    });
    describe('remote plugins', function() {
        it('should call clonePluginGitRepo for https:// and git:// based urls', function() {
            var s = spyOn(plugins, 'clonePluginGitRepo');
            fetch("https://github.com/bobeast/GAPlugin.git", temp, false);
            expect(s).toHaveBeenCalled();
        });
        it('should throw if used with url and `link` param', function() {
            expect(function() {
                fetch("https://github.com/bobeast/GAPlugin.git", temp, true);
            }).toThrow();
        });
        it('should call getPluginInfo and clonePluginRepo for names', function() {
            var s1 = spyOn(plugins, 'getPluginInfo').andCallFake(function(plugin_name, callback) {
                callback(null, {url:"https://github.com/imhotep/ChildBrowser.git"});
            });
            var s2 = spyOn(plugins, 'clonePluginGitRepo');
            fetch("ChildBrowser", temp, false, null);
            expect(s1).toHaveBeenCalled();
            expect(s2).toHaveBeenCalledWith('https://github.com/imhotep/ChildBrowser.git', temp, null);
        });
        it('should throw if used with name and `link` param', function() {
            expect(function() {
                fetch('ChildBrowser', temp, true);
            }).toThrow();
        });
    });
});

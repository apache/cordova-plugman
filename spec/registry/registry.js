var registry = require('../../src/registry/registry'),
    npm = require('npm');

describe('registry', function() {
    beforeEach(function() {
        registry.settings = {
            cache: plugmanCacheDir,
            force: true,
            logstream: fs.createWriteStream(path.resolve(plugmanConfigDir, 'plugman.log')),
            userconfig: path.resolve(plugmanConfigDir, 'config')
        };
    });
    it('should run config', function() {
        var sLoad = spyOn(npm, 'load').andCallThrough(); 
        var sConfig = spyOn(npm, 'config');
        registry.config(new Array('/path/to/myplugin'));
        expect(sLoad).toHaveBeenCalledWith(registry.settings, jasmine.any(Function));
        expect(sPublish).toHaveBeenCalledWith(['/path/to/myplugin'], jasmine.any(Function));
    });
});

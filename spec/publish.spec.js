var publish = require('../src/publish'),
    config = require('../config'),
    registry = require('plugman-registry');

describe('publish', function() {
    it('should publish a plugin', function() {
        var sUse = spyOn(registry, 'use').andCallThrough(); 
        var sPublish = spyOn(registry, 'publish');
        publish(new Array('/path/to/myplugin'));
        expect(sUse).toHaveBeenCalledWith(config.registry, jasmine.any(Function));
        expect(sPublish).toHaveBeenCalledWith(['/path/to/myplugin'], jasmine.any(Function));
    });
});

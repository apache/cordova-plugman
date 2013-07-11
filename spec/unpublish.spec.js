var unpublish = require('../src/unpublish'),
    config = require('../config'),
    registry = require('plugman-registry');

describe('unpublish', function() {
    it('should unpublish a plugin', function() {
        var sUse = spyOn(registry, 'use').andCallThrough();
        var sUnpublish = spyOn(registry, 'unpublish');
        unpublish(new Array('myplugin@0.0.1'));
        expect(sUse).toHaveBeenCalledWith(config.registry, jasmine.any(Function));
        expect(sUnpublish).toHaveBeenCalledWith(['myplugin@0.0.1'], jasmine.any(Function));
    });
});

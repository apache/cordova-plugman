var search = require('../src/search'),
    config = require('../config'),
    registry = require('plugman-registry');

describe('search', function() {
    it('should search a plugin', function() {
        var sUse = spyOn(registry, 'use').andCallThrough();
        var sSearch = spyOn(registry, 'search');
        search(new Array('myplugin', 'keyword'));
        expect(sUse).toHaveBeenCalledWith(config.registry, jasmine.any(Function));
        expect(sSearch).toHaveBeenCalledWith(['myplugin', 'keyword'], jasmine.any(Function));
    });
});

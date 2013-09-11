var owner = require('../src/owner'),
    registry = require('../src/registry/registry');

describe('owner', function() {
    it('should run owner', function() {
        var sOwner = spyOn(registry, 'owner');
        var params = ['add', 'anis', 'com.phonegap.plugins.dummyplugin'];
        owner(params, function(err, result) { });
        expect(sOwner).toHaveBeenCalledWith(params, jasmine.any(Function));
    });
});

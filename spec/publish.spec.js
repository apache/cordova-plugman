var publish = require('../src/publish'),
    Q = require('q'),
    registry = require('../src/registry/registry');

describe('publish', function() {
    it('should publish a plugin', function() {
        var sPublish = spyOn(registry, 'publish').andReturn(Q(['/path/to/my/plugin']));
        publish(new Array('/path/to/myplugin'));
        expect(sPublish).toHaveBeenCalledWith(['/path/to/myplugin']);
    });
});

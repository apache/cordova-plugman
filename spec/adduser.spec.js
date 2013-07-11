var adduser = require('../src/adduser'),
    config = require('../config'),
    registry = require('plugman-registry');

describe('adduser', function() {
    it('should add a user', function() {
        var sUse = spyOn(registry, 'use').andCallThrough();
        var sAddUser = spyOn(registry, 'adduser');
        adduser();
        expect(sUse).toHaveBeenCalledWith(config.registry, jasmine.any(Function));
        expect(sAddUser).toHaveBeenCalled();
    });
});

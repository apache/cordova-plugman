var platforms = require('../src/platforms')
var pluginTags = ["source-file", "header-file", "lib-file", "resource-file", "framework"];

function getTest(platformId, pluginTag) {
    return function() {
        it('should exist', function() {
            expect(platforms[platformId][pluginTag] ).toBeDefined();
        });
        it('with an install method', function() {
            expect(platforms[platformId][pluginTag].install ).toBeDefined();
        });
        it('with an uninstall method', function() {
            expect(platforms[platformId][pluginTag].uninstall ).toBeDefined();
        });
    }
}

for(var platformId in platforms) {
    for(var index = 0, len = pluginTags.length; index < len; index++) {
        var funk = getTest(platformId,pluginTags[index]);
        describe(platformId + " should have a " + pluginTags[index] + " object", funk);
    }

}



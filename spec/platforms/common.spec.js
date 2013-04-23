var common = require('../../src/platforms/common');

describe('common platform handler', function() {
    describe('resolveSrcPath', function() {
        it('should throw if path cannot be resolved');
        it('should not throw if path exists');
    });

    describe('resolveTargetPath', function() {
        it('should throw if path exists');
        it('should not throw if path cannot be resolved');
    });

    describe('straightCopy', function() {
        it('should throw if source path cannot be resolved');
        it('should throw if target path exists');
        it('should call mkdir -p on target path');
        it('should call cp -f with source/dest paths');
    });

    describe('deleteJava', function() {
        it('should call fs.unlinkSync on the provided paths');
        it('should delete empty directories after removing source code in a java src path heirarchy');
        it('should never delete the top-level src directory, even if all plugins added were removed');
    });
});

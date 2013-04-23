var android = require('../../src/platforms/android');

describe('android project handler', function() {
    it('should have an install function', function() {
        expect(typeof android.install).toEqual('function');
    });
    it('should have an uninstall function', function() {
        expect(typeof android.uninstall).toEqual('function');
    });
    it('should return cordova-android project www location using www_dir', function() {
        expect(android.www_dir('/')).toEqual('/assets/www');
    });

    describe('installation', function() {
        describe('of <source-file> elements', function() {
            it('should copy stuff from one location to another by calling common.straightCopy');
            it('should throw if source file cannot be found');
            it('should throw if target file already exists');
        });
        describe('of <library-file> elements', function() {
            it('should copy stuff from one location to another by calling common.straightCopy');
            it('should throw if source file cannot be found');
            it('should throw if target file already exists');
        });
        describe('of <config-file> elements', function() {
            it('should only target config.xml if that is applicable');
            it('should only target plugins.xml if that is applicable');
            it('should call into xml helper\'s graftXML');
        });
        it('should interpolate variables properly');
    });

    describe('uninstallation', function() {
        describe('of <source-file> elements', function() {
            it('should remove stuff by calling common.deleteJava');
            it('should remove empty dirs from java src dir heirarchy');
        });
        describe('of <library-file> elements', function() {
            it('should remove stuff using fs.unlinkSync');
        });
        describe('of <config-file> elements', function() {
            it('should only target config.xml if that is applicable');
            it('should only target plugins.xml if that is applicable');
            it('should call into xml helper\'s pruneXML');
        });
        describe('of <asset> elements', function() {
            it('should remove www\'s plugins <plugin-id> directory');
            it('should remove stuff specified by the element');
        });
    });
});

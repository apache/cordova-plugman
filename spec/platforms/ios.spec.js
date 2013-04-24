var ios = require('../../src/platforms/ios');

describe('ios project handler', function() {
    it('should have an install function', function() {
        expect(typeof ios.install).toEqual('function');
    });
    it('should have an uninstall function', function() {
        expect(typeof ios.uninstall).toEqual('function');
    });
    it('should return cordova-ios project www location using www_dir', function() {
        expect(ios.www_dir('/')).toEqual('/www');
    });

    describe('installation', function() {
        it('should throw if project is not an xcode project');
        it('should throw if project does not contain an appropriate PhoneGap/Cordova.plist file or config.xml file');
        it('should interpolate any variables correctly into pbx, plist and config files');

        describe('of <source-file> elements', function() {
            it('should throw if source-file src cannot be found');
            it('should throw if source-file target already exists');
            it('should use appropriate paths based on preserve-dirs attribute');
            it('should call into xcodeproj\'s addSourceFile');
            it('should cp the file to the right target location');
        });

        describe('of <plugins-plist> elements', function() {
            it('should only be used in an applicably old cordova-ios projects');
        });

        describe('of <config-file> elements', function() {
            it('should only be used in applicably new cordova-ios projects');
            it('should add a <plugin> element in applicably new cordova-ios projects with old-style plugins using only <plugins-plist> elements');
            it('should call xml_helpers\' graftXML');
            it('should write the new config file out after successfully grafting');
        });

        describe('of <header-file> elements', function() {
            it('should throw if header-file src cannot be found');
            it('should throw if header-file target already exists');
            it('should use appropriate paths based on preserve-dirs attribute');
            it('should call into xcodeproj\'s addHeaderFile');
            it('should cp the file to the right target location');
        });

        describe('of <resource-file> elements', function() {
            it('should throw if resource-file src cannot be found');
            it('should throw if resource-file target already exists');
            it('should call into xcodeproj\'s addResourceFile');
            it('should cp the file to the right target location');
        });

        describe('of <framework> elements', function() {
            it('should throw if framework src cannot be found');
            it('should call into xcodeproj\'s addFramework');
            it('should pass in whether the framework is weak or not into xcodeproj');
        });
    });

    describe('uninstallation', function() {
        it('should throw if project is not an xcode project');
        it('should throw if project does not contain an appropriate PhoneGap/Cordova.plist file or config.xml file');

        describe('of <source-file> elements', function() {
            it('should use appropriate paths based on preserve-dirs attribute');
            it('should call into xcodeproj\'s removeSourceFile');
            it('should rm the file from the right target location');
        });

        describe('of <plugins-plist> elements', function() {
            it('should only be used in an applicably old cordova-ios project');
        });

        describe('of <config-file> elements', function() {
            it('should only be used in applicably new cordova-ios projects');
            it('should remove any applicable <plugin> elements in applicably new cordova-ios projects with old-style plugins using only <plugins-plist> elements');
            it('should call xml_helpers\' pruneXML');
            it('should write the new config file out after successfully pruning');
        });

        describe('of <asset> elements', function() {
            it('should call rm on specified asset');
            it('should call rm on the www/plugins/<plugin_id> folder');
        });

        describe('of <header-file> elements', function() {
            it('should use appropriate paths based on preserve-dirs attribute');
            it('should call into xcodeproj\'s removeHeaderFile');
            it('should rm the file from the right target location');
        });

        describe('of <resource-file> elements', function() {
            it('should call into xcodeproj\'s removeResourceFile');
            it('should rm the file from the right target location');
        });

        describe('of <framework> elements', function() {
            it('should call into xcodeproj\'s removeFramework');
        });
    });
});

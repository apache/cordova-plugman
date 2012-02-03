var pbxFile = require('../lib/pbxFile');

exports['lastType'] = {
    'should detect that a .m path means sourcecode.c.objc': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m');

        test.equal('sourcecode.c.objc', sourceFile.lastType);
        test.done();
    },

    'should detect that a .h path means sourceFile.c.h': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.h');

        test.equal('sourcecode.c.h', sourceFile.lastType);
        test.done();
    },

    'should detect that a .bundle path means "wrapper.plug-in"': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.bundle');

        test.equal('"wrapper.plug-in"', sourceFile.lastType);
        test.done();
    },

    'should detect that a .xib path means file.xib': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.xib');

        test.equal('file.xib', sourceFile.lastType);
        test.done();
    },

    'should allow lastType to be overridden': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m',
                { lastType: 'somestupidtype' });

        test.equal('somestupidtype', sourceFile.lastType);
        test.done();
    },

    'should set lastType to unknown if undetectable': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.guh');

        test.equal('unknown', sourceFile.lastType);
        test.done();
    }
}

exports['group'] = {
    'should be Sources for source files': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m');

        test.equal('Sources', sourceFile.group);
        test.done();
    },
    'should be Resources for all other files': function (test) {
        var headerFile = new pbxFile('Plugins/ChildBrowser.h'),
            xibFile = new pbxFile('Plugins/ChildBrowser.xib');

        test.equal('Resources', headerFile.group);
        test.equal('Resources', xibFile.group);
        test.done();
    }
}

exports['basename'] = {
    'should be as expected': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m');

        test.equal('ChildBrowser.m', sourceFile.basename);
        test.done();
    }
}

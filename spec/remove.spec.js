var remove  = require('../src/remove'),
    fetch   = require('../src/fetch'),
    fs      = require('fs'),
    os      = require('osenv'),
    path    = require('path'),
    shell   = require('shelljs'),
    temp    = path.join(os.tmpdir(), 'plugman'),
    test_plugin = path.join(__dirname, 'plugins', 'ChildBrowser');

describe('remove', function() {
    var copied_plugin_path = path.join(temp,'com.phonegap.plugins.childbrowser');

    beforeEach(function() {
        shell.mkdir('-p', temp);
    });
    afterEach(function() {
        try{shell.rm('-rf', temp);}catch(e){}
    });

    it('should remove symbolically-linked plugins', function() {
        fetch(test_plugin, temp, true);
        remove('com.phonegap.plugins.childbrowser', temp);
        expect(fs.readdirSync(temp).length).toEqual(0);
    });
    it('should remove non-linked plugins', function() {
        fetch(test_plugin, temp, false);
        remove('com.phonegap.plugins.childbrowser', temp);
        expect(fs.readdirSync(temp).length).toEqual(0);
    });
});

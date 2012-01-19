var pluginstall = require('../pluginstall');

exports.testInitExists = function (test) {
    test.equal(typeof pluginstall.init, 'function');
    test.done();
}

exports.testInitReturns = function (test) {
    var initObj = pluginstall.init('android', '.', 'test/project'),
        projPath = process.cwd(),
        plugPath = projPath + '/test/project'

    test.equal(initObj.platform, 'android');
    test.equal(initObj.projectPath, projPath);
    test.equal(initObj.pluginPath, plugPath);

    test.done();
}

exports.testPlatformExists = function (test) {
    test.throws(function () {
        pluginstall.init('palm-treo', '.', 'test/project');
    });

    test.done();
}

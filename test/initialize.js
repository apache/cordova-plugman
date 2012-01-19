var pluginstall = require('../pluginstall');

exports['should exist'] = function (test) {
    test.equal(typeof pluginstall.init, 'function');
    test.done();
}

exports['should return expected values'] = function (test) {
    var initObj = pluginstall.init('android', '.', 'test/project'),
        projPath = process.cwd(),
        plugPath = projPath + '/test/project'

    test.equal(initObj.platform, 'android');
    test.equal(initObj.projectPath, projPath);
    test.equal(initObj.pluginPath, plugPath);

    test.done();
}

exports['should throw for unsupported platforms'] = function (test) {
    test.throws(function () {
        pluginstall.init('palm-treo', '.', 'test/project');
    });

    test.done();
}

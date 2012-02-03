var pluginstall = require('../pluginstall'),
    fs = require('fs'),
    et = require('elementtree'),
    configObj = {
        platform: 'android',
        projectPath: fs.realpathSync('test/project'),
        pluginPath: fs.realpathSync('test/plugin')
    };

exports['should exist'] = function (test) {
    test.equals(typeof pluginstall.parseXml, 'function');
    test.done();
}

exports['should return an object with an xmlDoc'] = function (test) {
    var dataObj = pluginstall.parseXml(configObj);

    test.equals(et.ElementTree, dataObj.xmlDoc.constructor);
    test.done();
}

exports['should return an object with the correct fields'] = function (test) {
    var dataObj = pluginstall.parseXml(configObj);

    test.equals('com.phonegap.plugins.childbrowser', dataObj._id);
    test.equals('0.6.0', dataObj.version);
    test.equals(2, dataObj.platforms.length);
    test.equals('android', dataObj.platforms[0]);

    test.done();
}

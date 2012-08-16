var equalNodes = require('../util/equalNodes'),
    et = require('elementtree'),

    title = et.XML('<title>HELLO</title>'),
    usesNetworkOne = et.XML('<uses-permission ' +
			'android:name="PACKAGE_NAME.permission.C2D_MESSAGE"/>'),
    usesNetworkTwo = et.XML("<uses-permission android:name=\
            \"PACKAGE_NAME.permission.C2D_MESSAGE\" />"),
    usesReceive = et.XML("<uses-permission android:name=\
            \"com.google.android.c2dm.permission.RECEIVE\"/>");

exports['should return false for different tags'] = function (test) {
    test.ok(!equalNodes(usesNetworkOne, title));
    test.done();
}

exports['should return true for identical tags'] = function (test) {
    test.ok(equalNodes(usesNetworkOne, usesNetworkTwo));
    test.done();
}

exports['should return false for different attributes'] = function (test) {
    test.ok(!equalNodes(usesNetworkOne, usesReceive));
    test.done();
}

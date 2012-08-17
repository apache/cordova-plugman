var equalNodes = require('../util/equalNodes'),
    et = require('elementtree'),

    title = et.XML('<title>HELLO</title>'),
    usesNetworkOne = et.XML('<uses-permission ' +
			'android:name="PACKAGE_NAME.permission.C2D_MESSAGE"/>'),
    usesNetworkTwo = et.XML("<uses-permission android:name=\
            \"PACKAGE_NAME.permission.C2D_MESSAGE\" />"),
    usesReceive = et.XML("<uses-permission android:name=\
            \"com.google.android.c2dm.permission.RECEIVE\"/>"),
    helloTagOne = et.XML("<h1>HELLO</h1>"),
    goodbyeTag = et.XML("<h1>GOODBYE</h1>"),
    helloTagTwo = et.XML("<h1>  HELLO  </h1>");

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

exports['should distinguish between text'] = function (test) {
    test.ok(!equalNodes(helloTagOne, goodbyeTag));
    test.done();
}

exports['should ignore whitespace in text'] = function (test) {
    test.ok(equalNodes(helloTagOne, helloTagTwo));
    test.done();
}

exports['should compare children'] = {
    'by child quantity': function (test) {
        var one = et.XML('<i><b>o</b></i>'),
            two = et.XML('<i><b>o</b><u></u></i>');

        test.ok(!equalNodes(one, two));
        test.done();
    },
    'by child equality': function (test) {
        var one = et.XML('<i><b>o</b></i>'),
            two = et.XML('<i><u></u></i>'),
            uno = et.XML('<i>\n<b>o</b>\n</i>');

        test.ok(equalNodes(one, uno));
        test.ok(!equalNodes(one, two));
        test.done();
    }
}

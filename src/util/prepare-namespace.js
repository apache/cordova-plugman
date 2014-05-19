var util = require('util');

// FIXME this is extremely guettho
module.exports = function(target, method) {
    var old = target;
    var target = target.replace(/^window(\.)?/, '');

    var lastDot = target.lastIndexOf('.');
    var namespace = target.substr(0, lastDot);
    var lastName = target.substr(lastDot + 1);
    var props = target.split(".");
    var code = "";

    if(target !== "") {
        for(var i = 1, len = props.length ; i <= len ; i++) {
            var sub = props.slice(0, i).join(".");
            code += util.format("window.%s = window.%s || {};\n", sub, sub);
        }
    }

    props.unshift('window');  
    var object = props.slice(0, props.length - 1).join('.');
    //  code = "\n";
    if(method === "c") {
        return util.format(
                "%s\nrequire('cordova/builder').assignOrWrapInDeprecateGetter(%s, '%s', module.exports);", 
                code,
                object,
                lastName
                );
    } else if(method === "m" && old !== "") {
        return util.format(
                "%s\n;require('cordova/builder').recursiveMerge(%s, module.exports);", 
                code,
                old
                );
    } else {
        return "// no clobber or merges";
    }
}

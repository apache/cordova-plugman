var fs = require('fs'),
    path = require('path')
    shell = require('shelljs');

exports.moveProjFile = function moveProjFile(origFile, projPath) {
    var src = path.resolve(projPath, origFile),
        dest = src.replace('.orig', '')

    shell.rm('-rf', dest);
    shell.cp(src, dest);
}

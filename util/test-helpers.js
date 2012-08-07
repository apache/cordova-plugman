var fs = require('fs'),
    path = require('path');

exports.moveProjFile = function moveProjFile(origFile, projPath, callback) {
    var src = path.resolve(projPath, origFile),
        dest = src.replace('.orig', '')

    fs.createReadStream(src)
        .pipe(fs.createWriteStream(dest))
        .on('close', callback);
}

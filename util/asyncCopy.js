var fs = require('fs'),
    fstream = require('fstream');

// includes support for recursively copying directories
// srcPath must exist
module.exports = function asyncCopy(srcPath, targetPath, callback) {
    var read = fstream.Reader(srcPath);

    if (fs.statSync(srcPath).isDirectory()) {
        read.pipe(fstream.Writer({ path: targetPath,
                                    type: 'Directory'}));
    } else {
        read.pipe(fstream.Writer(targetPath));
    }

    read.on('end', callback);
}

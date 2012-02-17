var ncp = require('ncp').ncp;

// includes support for recursively copying directories
// srcPath must exist
module.exports = function asyncCopy(srcPath, targetPath, callback) {
    ncp(srcPath, targetPath, callback);
}

var fs = require('fs');

// polyfill for Node 0.6.x
if (!fs.existsSync) {
    fs.existsSync = function (path) {
        try {
            fs.statSync(path);
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = fs;

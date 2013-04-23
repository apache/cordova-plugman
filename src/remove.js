var shell = require('shelljs'),
    fs    = require('fs'),
    path  = require('path');

module.exports = function removePlugin(name, plugins_dir) {
    var target = path.join(plugins_dir, name);
    var stat = fs.lstatSync(target);

    if (stat.isSymbolicLink()) {
        fs.unlinkSync(target);
    } else {
        shell.rm('-rf', target);
    }
};

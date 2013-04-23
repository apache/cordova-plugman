var shell = require('shelljs'),
    path  = require('path'),
    fs    = require('fs');

module.exports = {
    // helper for resolving source paths from plugin.xml
    // throws File Not Found
    resolveSrcPath:function(plugin_dir, relative_path) {
        var full_path = path.resolve(plugin_dir, relative_path);
        if (!fs.existsSync(full_path)) throw new Error('"' + full_path + '" not found!');
        else return full_path;
    },
    // helper for resolving target paths from plugin.xml into a cordova project
    // throws File Exists
    resolveTargetPath:function(project_dir, relative_path) {
        var full_path = path.resolve(project_dir, relative_path);
        if (fs.existsSync(full_path)) throw new Error('"' + full_path + '" already exists!');
        else return full_path;
    },
    // Many times we simply need to copy shit over, knowing if a source path doesnt exist or if a target path already exists
    straightCopy:function(plugin_dir, src, project_dir, dest) {
        src = module.exports.resolveSrcPath(plugin_dir, src);
        dest = module.exports.resolveTargetPath(project_dir, dest);
        shell.mkdir('-p', path.dirname(dest));
        shell.cp('-r', src, dest);
    },
    // Sometimes we want to remove some java, and prune any unnecessary empty directories
    deleteJava:function(project_dir, destFile) {
        fs.unlinkSync(path.resolve(project_dir,destFile));
        // check if directory is empty
        var curDir = path.resolve(project_dir, path.basename(destFile));
        while(curDir !== path.resolve(project_dir, 'src')) {
            if(fs.readdirSync(curDir).length == 0) {
                fs.rmdirSync(curDir);
                curDir = path.resolve(curDir, '..');
            } else {
                // directory not empty...do nothing
                break;
            }
        }
    }
};

var fs = require('fs'),
    path = require('path'),
    fstream = require('fstream'),
    mkdirp = require('mkdirp'),
    assetsDir = "assets/www", // relative path to project's web assets
    sourceDir = "src",
    counter = {};

exports.installPlugin = function (config, plugin, callback) {
    // look for assets in the plugin 
    var assets = plugin.xmlDoc.findall('./asset'),
        platformTag = plugin.xmlDoc.find('./platform[@name="android"]'),
        endCallback, srcPath, targetPath;

    endCallback = nCallbacks(assets.length, callback)

    assets.forEach(function (asset) {
        var srcPath = path.resolve(
                        config.pluginPath,
                        asset.attrib['src']);

        var targetPath = path.resolve(
                            config.projectPath,
                            assetsDir,
                            asset.attrib['target']);

        if (fs.statSync(srcPath).isDirectory()) {
            var read = fstream.Reader(srcPath);
            read.pipe(fstream.Writer({ path: targetPath,
                                        type: "Directory"}));
            read.on('end', endCallback);
        } else {
            var read = fstream.Reader(srcPath);
            read.pipe(fstream.Writer(targetPath));
            read.on('end', endCallback);
        }
    });
}

function moveFilesAround(config, plugin, cb) { }

function editCorrectFiles(config, plugin, cb) {}

// ensure callback gets called n times
function nCallbacks(count, callback) {
    var n = count;
    return function (err) {
        if (err) callback(err)
        --n
        if (n == 0) callback(null)
    }
}

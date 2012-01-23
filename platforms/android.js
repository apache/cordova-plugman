var fs = require('fs'),
    path = require('path'),
    fstream = require('fstream'),
    mkdirp = require('mkdirp'),
    nCallbacks = require('../util/ncallbacks'),
    assetsDir = 'assets/www', // relative path to project's web assets
    sourceDir = 'src',
    counter = {};

exports.installPlugin = function (config, plugin, callback) {
    // look for assets in the plugin 
    var assets = plugin.xmlDoc.findall('./asset'),
        platformTag = plugin.xmlDoc.find('./platform[@name="android"]'),
        sourceFiles = platformTag.findall('./source-code')

    var endCallback = nCallbacks((assets.length + sourceFiles.length),
                                    callback)

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
                                        type: 'Directory'}));
            read.on('end', endCallback);
        } else {
            var read = fstream.Reader(srcPath);
            read.pipe(fstream.Writer(targetPath));
            read.on('end', endCallback);
        }
    });

    /*
       example:
        <source-code src="src/android/ChildBrowser.java"
                target-dir="src/com/phonegap/plugins/childBrowser" />
     */
    sourceFiles.forEach(function (sourceFile) {
        var srcDir = path.resolve(config.projectPath,
                                sourceFile.attrib['target-dir'])

        mkdirp(srcDir, function (err) {
            var srcFile = path.resolve(config.pluginPath,
                                        sourceFile.attrib['src']),
                destFile = path.resolve(srcDir,
                                path.basename(sourceFile.attrib['src'])),
                read = fstream.Reader(srcFile);

            read.pipe(fstream.Writer(destFile))
            read.on('end', endCallback);
        });
    })
}

function moveFilesAround(config, plugin, cb) { }

function editCorrectFiles(config, plugin, cb) {}

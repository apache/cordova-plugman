var path = require('path'),
    fs = require('fs'),
    fstream = require('fstream'),
    glob = require('glob'),
    nCallbacks = require('../util/nCallbacks'),
    assetsDir = 'www'; // relative path to project's web assets

exports.installPlugin = function (config, plugin, callback) {
    var assets = plugin.xmlDoc.findall('./asset'),
        platformTag = plugin.xmlDoc.find('./platform[@name="ios"]'),
        sourceFiles = platformTag.findall('./source-file'),
        headerFiles = platformTag.findall('./header-file'),
        callbackCount = assets.length + sourceFiles.length + headerFiles.length,
        end = nCallbacks(callbackCount, callback);

    // move asset files
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
            read.on('end', end);
        } else {
            var read = fstream.Reader(srcPath);
            read.pipe(fstream.Writer(targetPath));
            read.on('end', end);
        }
    });

    // move source files
    // first, need to find the correct directory
    glob(config.projectPath + '/**/PhoneGap.plist', function (err, files) {
        if (!files.length) throw "does not appear to be a PhoneGap project";

        var pluginsDir = path.resolve(files[0], '..', 'Plugins');

        sourceFiles.forEach(function (sourceFile) {
            var srcFile = path.resolve(config.pluginPath,
                                        'src/ios',
                                        sourceFile.attrib['src']),
                destFile = path.resolve(pluginsDir,
                                path.basename(sourceFile.attrib['src'])),
                read = fstream.Reader(srcFile);

            read.pipe(fstream.Writer(destFile))
            read.on('end', end);
        })

        headerFiles.forEach(function (headerFile) {
            var srcFile = path.resolve(config.pluginPath,
                                        'src/ios',
                                        headerFile.attrib['src']),
                destFile = path.resolve(pluginsDir,
                                path.basename(headerFile.attrib['src'])),
                read = fstream.Reader(srcFile);

            read.pipe(fstream.Writer(destFile))
            read.on('end', end);
        })
    });

    // first parse the xcodeproj file
    // and parse the PhoneGap.plist file

    // after that
    //   move each asset file into place
    //   move the native files into place, editing the xcodeproj
    //   add the plugin key to the plist

    // after that
    //   write out xcodeproj file
    //   write out plist
    //   call callback
}

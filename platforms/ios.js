var path = require('path'),
    fs = require('fs'),
    glob = require('glob'),
    xcode = require('xcode'),
    plist = require('plist'),
    nCallbacks = require('../util/nCallbacks'),
    asyncCopy = require('../util/asyncCopy'),
    assetsDir = 'www'; // relative path to project's web assets

exports.installPlugin = function (config, plugin, callback) {
    glob(config.projectPath + '/**/PhoneGap.plist', function (err, files) {
        if (!files.length) throw "does not appear to be a PhoneGap project";

        // parse the xcodeproj file
        // and parse the PhoneGap.plist file
        var plistPath = files[0],
            pluginsDir = path.resolve(files[0], '..', 'Plugins'),

            assets = plugin.xmlDoc.findall('./asset'),
            platformTag = plugin.xmlDoc.find('./platform[@name="ios"]'),
            sourceFiles = platformTag.findall('./source-file'),
            headerFiles = platformTag.findall('./header-file'),
            resourceFiles = platformTag.findall('./resource-file'),

            callbackCount = 0, end;

        // callback for every file/dir to add
        callbackCount += assets.length;
        callbackCount += sourceFiles.length;
        callbackCount += headerFiles.length;
        callbackCount += resourceFiles.length;
        callbackCount++; // for editing the plist file

        end = nCallbacks(callbackCount, callback);

        // move asset files into www
        assets.forEach(function (asset) {
            var srcPath = path.resolve(
                            config.pluginPath, asset.attrib['src']);

            var targetPath = path.resolve(
                                config.projectPath,
                                assetsDir, asset.attrib['target']);

            asyncCopy(srcPath, targetPath, end);
        });

        // move native files (source/header/resource)
        sourceFiles.forEach(function (sourceFile) {
            var src = sourceFile.attrib['src'],
                srcFile = path.resolve(config.pluginPath, 'src/ios', src),
                destFile = path.resolve(pluginsDir, path.basename(src));

            asyncCopy(srcFile, destFile, end);
        })

        headerFiles.forEach(function (headerFile) {
            var src = headerFile.attrib['src'],
                srcFile = path.resolve(config.pluginPath, 'src/ios', src),
                destFile = path.resolve(pluginsDir, path.basename(src));

            asyncCopy(srcFile, destFile, end);
        })

        resourceFiles.forEach(function (resource) {
            var src = resource.attrib['src'],
                srcFile = path.resolve(config.pluginPath, 'src/ios', src),
                destFile = path.resolve(pluginsDir, path.basename(src));

            asyncCopy(srcFile, destFile, end);
        })

        // edit the plist file
        plist.parseFile(plistPath, function (err, obj) {
            var plistEle = platformTag.find('./plugins-plist');

            obj[0].Plugins[plistEle.attrib['key']] = plistEle.attrib['string'];

            fs.writeFile(plistPath, plist.stringify(obj), end);
        });
    });

    // after that
    //   move the native files into place, editing the xcodeproj
    //   add the plugin key to the plist

    // after that
    //   write out xcodeproj file
    //   write out plist
    //   call callback
}

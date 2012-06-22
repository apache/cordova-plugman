var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    et = require('elementtree'),
    nCallbacks = require('../util/ncallbacks'),
    asyncCopy = require('../util/asyncCopy'),
    assetsDir = 'assets/www', // relative path to project's web assets
    sourceDir = 'src',
    counter = {};

exports.installPlugin = function (config, plugin, callback) {
    // look for assets in the plugin 
    var assets = plugin.xmlDoc.findall('./asset'),
        platformTag = plugin.xmlDoc.find('./platform[@name="android"]'),
        sourceFiles = platformTag.findall('./source-file'),
        libFiles = platformTag.findall('./library-file'),
        pluginsChanges = platformTag.findall('./config-file[@target="res/xml/plugins.xml"]'),
        manifestChanges = platformTag.findall('./config-file[@target="AndroidManifest.xml"]'),

        callbackCount = assets.length + sourceFiles.length + pluginsChanges.length
            + manifestChanges.length,
        endCallback = nCallbacks(callbackCount, callback)

    // move asset files
    assets.forEach(function (asset) {
        var srcPath = path.resolve(
                        config.pluginPath,
                        asset.attrib['src']);

        var targetPath = path.resolve(
                            config.projectPath,
                            assetsDir,
                            asset.attrib['target']);

        asyncCopy(srcPath, targetPath, endCallback);
    });

    // move source files
    sourceFiles.forEach(function (sourceFile) {
        var srcDir = path.resolve(config.projectPath,
                                sourceFile.attrib['target-dir'])

        mkdirp(srcDir, function (err) {
            var srcFile = path.resolve(config.pluginPath, 'src/android',
                                        sourceFile.attrib['src']),
                destFile = path.resolve(srcDir,
                                path.basename(sourceFile.attrib['src']));

            asyncCopy(srcFile, destFile, endCallback);
        });
    })
    
    // move library files
    libFiles.forEach(function (libFile) {
        var libDir = path.resolve(config.projectPath,
                                libFile.attrib['target-dir'])

        mkdirp(libDir, function (err) {
            var src = path.resolve(config.pluginPath, 'src/android',
                                        libFile.attrib['src']),
                dest = path.resolve(libDir,
                                path.basename(libFile.attrib['src']));
            console.log(src, dest);

            asyncCopy(src, dest, endCallback);
        });
    })

    // edit plugins.xml
    pluginsChanges.forEach(function (configNode) {
        var pluginsPath = path.resolve(config.projectPath, 'res/xml/plugins.xml'),
            pluginsDoc = readAsETSync(pluginsPath),
            selector = configNode.attrib["parent"],
            child = configNode.find('*');

        if (addToDoc(pluginsDoc, child, selector)) {
            fs.writeFile(pluginsPath, pluginsDoc.write(), function (err) {
                if (err) endCallback(err);

                endCallback();
            });
        } else {
            endCallback('failed to add node to plugins.xml');
        }
    });

    // edit AndroidManifest.xml
    manifestChanges.forEach(function (configNode) {
        var manifestPath = path.resolve(config.projectPath, 'AndroidManifest.xml'),
            manifestDoc  = readAsETSync(manifestPath),
            selector = configNode.attrib["parent"],
            child = configNode.find('*');

        if (addToDoc(manifestDoc, child, selector)) {
            fs.writeFile(manifestPath, manifestDoc.write(), function (err) {
                if (err) endCallback(err);

                endCallback();
            });
        } else {
            endCallback('failed to add node to AndroidManifest.xml')
        }
    })
}

// adds node to doc at selector
function addToDoc(doc, node, selector) {
    var ROOT = /^\/([^\/]*)/,
        ABSOLUTE = /^\/([^\/]*)\/(.*)/,
        parent, tagName, subSelector;

    // handle absolute selector (which elementtree doesn't like)
    if (ROOT.test(selector)) {
        tagName = selector.match(ROOT)[1];
        if (tagName === doc._root.tag) {
            parent = doc._root;

            // could be an absolute path, but not selecting the root
            if (ABSOLUTE.test(selector)) {
                subSelector = selector.match(ABSOLUTE)[2];
                parent = parent.find(subSelector)
            }
        } else {
            return false;
        }
    } else {
        parent = doc.find(selector)
    }

    parent.append(node);
    return true;
}

function readAsETSync(filename) {
    var contents = fs.readFileSync(filename, 'utf-8');

    return new et.ElementTree(et.XML(contents));
}

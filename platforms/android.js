var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    et = require('elementtree'),
    nCallbacks = require('../util/ncallbacks'),
    asyncCopy = require('../util/asyncCopy'),
    getConfigChanges = require('../util/config-changes'),
    assetsDir = 'assets/www', // relative path to project's web assets
    sourceDir = 'src',
    counter = {};

exports.installPlugin = function (config, plugin, callback) {
    // look for assets in the plugin 
    var assets = plugin.xmlDoc.findall('./asset'),
        platformTag = plugin.xmlDoc.find('./platform[@name="android"]'),
        sourceFiles = platformTag.findall('./source-file'),
        libFiles = platformTag.findall('./library-file'),

        configChanges = getConfigChanges(platformTag),

        callbackCount = assets.length + sourceFiles.length + libFiles.length,
        endCallback;

    // find which config-files we're interested in
    Object.keys(configChanges).forEach(function (configFile) {
        if (fs.existsSync(path.resolve(config.projectPath, configFile))) {
            // if so, add length to callbackCount
            callbackCount += configChanges[configFile].length
        } else {
            delete configChanges[configFile];
        }
    });
    
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
            var srcFile = srcPath(config.pluginPath, sourceFile.attrib['src']),
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

    Object.keys(configChanges).forEach(function (filename) {
        configChanges[filename].forEach(function (configNode) {
            var filepath = path.resolve(config.projectPath, filename),
                xmlDoc = readAsETSync(filepath),
                selector = configNode.attrib["parent"],
                child = configNode.find('*');

            if (addToDoc(xmlDoc, child, selector)) {
                fs.writeFile(filepath, xmlDoc.write(), function (err) {
                    if (err) endCallback(err);

                    endCallback();
                });
            } else {
                endCallback('failed to add node to ' + filename);
            }
        });
    });
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

function srcPath(pluginPath, filename) {
    var prefix = /^src\/android/;

    if (prefix.test(filename)) {
        return path.resolve(pluginPath, filename);
    } else {
        return path.resolve(pluginPath, 'src/android', filename);
    }
}

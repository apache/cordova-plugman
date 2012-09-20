var fs = require('../util/fs'), // use existsSync in 0.6.x
    path = require('path'),
    mkdirp = require('mkdirp'),
    et = require('elementtree'),
    rimraf = require('rimraf'),

    nCallbacks = require('../util/ncallbacks'),
    asyncCopy = require('../util/asyncCopy'),
    equalNodes = require('../util/equalNodes'),
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
        PACKAGE_NAME = packageName(config),

        configChanges = getConfigChanges(platformTag),

        callbackCount = assets.length + sourceFiles.length + libFiles.length,
        endCallback;

    // find which config-files we're interested in
    Object.keys(configChanges).forEach(function (configFile) {
        if (fs.existsSync(path.resolve(config.projectPath, configFile))) {
            callbackCount++;
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

    // edit configuration files
    Object.keys(configChanges).forEach(function (filename) {
        var filepath = path.resolve(config.projectPath, filename),
            xmlDoc = readAsETSync(filepath),
            output;

        configChanges[filename].forEach(function (configNode) {
            var selector = configNode.attrib["parent"],
                children = configNode.findall('*');

            if (!addToDoc(xmlDoc, children, selector)) {
                endCallback('failed to add children to ' + filename);
            }
        });

        output = xmlDoc.write();
        output = output.replace(/\$PACKAGE_NAME/g, PACKAGE_NAME);

        fs.writeFile(filepath, output, function (err) {
            if (err) endCallback(err);

            endCallback();
        });
    });
}

exports.uninstallPlugin = function (config, plugin, callback) {
    
    // look for assets in the plugin 
    var assets = plugin.xmlDoc.findall('./asset'),
        platformTag = plugin.xmlDoc.find('./platform[@name="android"]'),
        sourceFiles = platformTag.findall('./source-file'),
        libFiles = platformTag.findall('./library-file'),
        PACKAGE_NAME = packageName(config),

        configChanges = getConfigChanges(platformTag),

        callbackCount = assets.length + sourceFiles.length + libFiles.length,
        endCallback;

    // find which config-files we're interested in
    Object.keys(configChanges).forEach(function (configFile) {
        if (fs.existsSync(path.resolve(config.projectPath, configFile))) {
            callbackCount++;
        } else {
            delete configChanges[configFile];
        }
    });

    endCallback = nCallbacks(callbackCount, callback)

    // move asset files
    assets.forEach(function (asset) {
        var targetPath = path.resolve(
                            config.projectPath,
                            assetsDir,
                            asset.attrib['target']);
        fs.stat(targetPath, function(err, stats) {
            if(err) {
                endCallback(err);
            }
            if(stats.isDirectory()) {
                rimraf(targetPath, endCallback);
            } else {
                fs.unlink(targetPath, endCallback);
            }
        });
    });

    // move source files
    sourceFiles.forEach(function (sourceFile) {
        var srcDir = path.resolve(config.projectPath,
                                sourceFile.attrib['target-dir']),
            destFile = path.resolve(srcDir,
                                path.basename(sourceFile.attrib['src']));
        
        fs.unlink(destFile, function(err) {
            // check if directory is empty
            fs.readdir(srcDir, function(err, files) {
                if(err) {
                    endCallback(err);
                }
                if(files.length == 0) {
                    fs.rmdir(srcDir, endCallback);
                }
            });
        });

    });
    
    // move library files
    libFiles.forEach(function (libFile) {
        var libDir = path.resolve(config.projectPath,
                                libFile.attrib['target-dir'])
        
        var destFile = path.resolve(libDir,
                            path.basename(libFile.attrib['src']));

        fs.unlink(destFile, function(err) {
            // check if directory is empty
            fs.readdir(libDir, function(err, files) {
                if(files.length == 0) {
                    fs.rmdir(libDir, endCallback);
                }
            });
        });
    });

    // edit configuration files
    Object.keys(configChanges).forEach(function (filename) {
        var filepath = path.resolve(config.projectPath, filename),
            xmlDoc = readAsETSync(filepath),
            output;
        configChanges[filename].forEach(function (configNode) {
            var selector = configNode.attrib["parent"],
                children = configNode.findall('*');
            if (!removeFromDoc(xmlDoc, children, selector)) {
                endCallback('failed to add children to ' + filename);
            }
        });

        output = xmlDoc.write();
        output = output.replace(/\$PACKAGE_NAME/g, PACKAGE_NAME);

        fs.writeFile(filepath, output, function (err) {
            if (err) endCallback(err);

            endCallback();
        });
    });
}

// adds node to doc at selector
function addToDoc(doc, nodes, selector) {
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

    nodes.forEach(function (node) {
        // check if child is unique first
        if (uniqueChild(node, parent)) {
            parent.append(node);
        }
    });

    return true;
}

// removes node from doc at selector
function removeFromDoc(doc, nodes, selector) {
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
    nodes.forEach(function (node) {
        var matchingKid = null;
        if ((matchingKid = findChild(node, parent)) != null) {
            // stupid elementtree takes an index argument it doesn't use
            // and does not conform to the python lib
            parent.remove(0, matchingKid);
        }
    });

    return true;
}

function findChild(node, parent) {
    var matchingKids = parent.findall(node.tag),
        i, j;

    for (i = 0, j = matchingKids.length ; i < j ; i++) {
        if (equalNodes(node, matchingKids[i])) {
            return matchingKids[i];
        }
    }

    return null;

}

function uniqueChild(node, parent) {
    var matchingKids = parent.findall(node.tag),
        i = 0;

    if (matchingKids.length == 0) {
        return true;
    } else  {
        for (i; i < matchingKids.length; i++) {
            if (equalNodes(node, matchingKids[i])) {
                return false;
            }
        }

        return true;
    }
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

function packageName(config) {
    var mDoc = readAsETSync(
            path.resolve(config.projectPath, 'AndroidManifest.xml'));

    return mDoc._root.attrib['package'];
}

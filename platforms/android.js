var fs = require('fs'),
    path = require('path'),
    fstream = require('fstream'),
    mkdirp = require('mkdirp'),
    et = require('elementtree'),
    nCallbacks = require('../util/ncallbacks'),
    assetsDir = 'assets/www', // relative path to project's web assets
    sourceDir = 'src',
    counter = {};

exports.installPlugin = function (config, plugin, callback) {
    // look for assets in the plugin 
    var assets = plugin.xmlDoc.findall('./asset'),
        platformTag = plugin.xmlDoc.find('./platform[@name="android"]'),
        sourceFiles = platformTag.findall('./source-code'),
        pluginsChanges = platformTag.findall('./config-file[@target="res/xml/plugins.xml"]')

    var endCallback = nCallbacks((assets.length + sourceFiles.length + pluginsChanges.length),
                                    callback)

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
            read.on('end', endCallback);
        } else {
            var read = fstream.Reader(srcPath);
            read.pipe(fstream.Writer(targetPath));
            read.on('end', endCallback);
        }
    });

    // move source files
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

    // edit plugins.xml
    pluginsChanges.forEach(function (configNode) {
        var pluginsPath = path.resolve(config.projectPath, 'res/xml/plugins.xml'),
            pluginsFile = readAsETSync(pluginsPath),
            selector = configNode.attrib["parent"],
            child = configNode.find('*');

        if (addToDoc(pluginsFile, child, selector)) {
            fs.writeFile(pluginsPath, pluginsFile.write(), function (err) {
                if (err) endCallback(err);

                endCallback();
            });
        } else {
            endCallback('failed to add node to plugins.xml');
        }
    });
}

// adds node to doc at selector
function addToDoc(doc, node, selector) {
    var ABSOLUTE = /^\/([^\/]*)/, // is an absolute selector
        parent, tagName;

    // handle absolute selector (which elementtree doesn't like)
    if (ABSOLUTE.test(selector)) {
        tagName = selector.match(ABSOLUTE)[1];
        if (tagName === doc._root.tag) {
            parent = doc._root
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

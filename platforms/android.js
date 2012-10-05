var fs = require('../util/fs')  // use existsSync in 0.6.x
   , path = require('path')
   , shell = require('shelljs')
   , et = require('elementtree')
   , getConfigChanges = require('../util/config-changes')

   , assetsDir = 'assets/www'  // relative path to project's web assets
   , sourceDir = 'src'
   , xml_helpers = require(path.join(__dirname, '..', 'util', 'xml-helpers'));


exports.handlePlugin = function (action, project_dir, plugin_dir, plugin_et) {
    var plugin_id = plugin_et._root.attrib['id']
      , version = plugin_et._root.attrib['version']
      , external_hosts = []
      , i = 0
      // look for assets in the plugin 
      , assets = plugin_et.findall('./asset')
      , platformTag = plugin_et.find('./platform[@name="android"]')
      , sourceFiles = platformTag.findall('./source-file')
      , libFiles = platformTag.findall('./library-file')
      , PACKAGE_NAME = packageName(config)
      , configChanges = getConfigChanges(platformTag);

    // find which config-files we're interested in
    Object.keys(configChanges).forEach(function (configFile) {
        if (!fs.existsSync(path.resolve(config.projectPath, configFile))) {
            delete configChanges[configFile];
        }
    });

    // move asset files
    assets.forEach(function (asset) {
        var srcPath = path.resolve(
                        plugin_dir,
                        asset.attrib['src']);

        var targetPath = path.resolve(
                            project_dir,
                            assetsDir,
                            asset.attrib['target']);

        if (action == 'install') {
            shell.cp(srcPath, targetPath);
        } else {
            var stats = fs.stat(targetPath);
            if(stats.isDirectory()) {
                shell.rm('-rf', targetPath);
            } else {
                fs.unlinkSync(targetPath);
            }
        }
    });

    // move source files
    sourceFiles.forEach(function (sourceFile) {
        var srcDir = path.resolve(project_dir,
                                sourceFile.attrib['target-dir'])
          , destFile = path.resolve(srcDir,
                                path.basename(sourceFile.attrib['src']));

        if (action == 'install') {
            shell.mkdir('-p', srcDir);
            var srcFile = srcPath(plugin_dir, sourceFile.attrib['src']);
            shell.cp(srcFile, destFile);
        } else {
            fs.unlinkSync(destFile);
            // check if directory is empty
            var files = fs.readdirSync(srcDir);
            if(files.length == 0) {
                shell.rm('-rf', srcDir);
            }
        }
    })

    // move library files
    libFiles.forEach(function (libFile) {
        var libDir = path.resolve(project_dir,
                                libFile.attrib['target-dir'])

        if (action == 'install') {
            shell.mkdir('-p', libDir);
            var src = path.resolve(plugin_dir, 'src/android',
                                        libFile.attrib['src']),
                dest = path.resolve(libDir,
                                path.basename(libFile.attrib['src']));
            
            shell.cp(src, dest);
        } else {
            var destFile = path.resolve(libDir,
                            path.basename(libFile.attrib['src']));

            fs.unlinkSync(destFile);
            // check if directory is empty
            var files = fs.readdirSync(libDir);
            if(files.length == 0) {
                shell.rm('-rf', libDir);
            }
        }
    })


    // edit configuration files
    Object.keys(configChanges).forEach(function (filename) {
        var filepath = path.resolve(config.projectPath, filename),
            xmlDoc = xml_helpers.parseElementtreeSync(filepath),
            output;

        configChanges[filename].forEach(function (configNode) {
            var selector = configNode.attrib["parent"],
                children = configNode.findall('*');

            if( action == 'install') {
                if (!xml_helpers.graftXML(xmlDoc, children, selector)) {
                    throw new Error('failed to add children to ' + filename);
                }
            } else {
                if (!xml_helpers.pruneXML(xmlDoc, children, selector)) {
                    throw new Error('failed to remove children from' + filename);
                }
            }
        });

        output = xmlDoc.write();
        output = output.replace(/\$PACKAGE_NAME/g, PACKAGE_NAME);
        fs.writeFileSync(filepath, output);
    });
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
    var mDoc = xml_helpers.parseElementtreeSync(
            path.resolve(config.projectPath, 'AndroidManifest.xml'));

    return mDoc._root.attrib['package'];
}

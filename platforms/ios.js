var path = require('path')
  , fs = require('../util/fs')  // use existsSync in 0.6.x
  , glob = require('glob')
  , et = require('elementtree')
  , xcode = require('xcode')
  , plist = require('plist')
  , bplist = require('bplist-parser')
  , shell = require('shelljs')
  , assetsDir = 'www';    // relative path to project's web assets

exports.handlePlugin = function (action, project_dir, plugin_dir, plugin_et) {
    var plugin_id = plugin_et._root.attrib['id']
      , version = plugin_et._root.attrib['version']
      , external_hosts = []
      , i = 0
      , matched;

    // grab and parse pbxproj
    var files = glob.sync(project_dir + '/**/project.pbxproj');
    
    if (!files.length) throw "does not appear to be an xcode project";
    var pbxPath = files[0];

    var xcodeproj = xcode.project(files[0]);
    xcodeproj.parseSync();

    // grab and parse plist file
    files = glob.sync(project_dir + '/**/{PhoneGap,Cordova}.plist');

    if (!files.length) throw "does not appear to be a PhoneGap project";

    files = files.filter(function (val) {
        return !(/^build\//.test(val));
    });

    var plistPath = files[0];
    var pluginsDir = path.resolve(files[0], '..', 'Plugins');

    // determine if this is a binary or ascii plist and choose the parser
    // this is temporary until binary support is added to node-plist
    if( isBinaryPlist(plistPath) ) {
        pl = bplist;
    } else {
        pl = plist; 
    }

    var plistObj = pl.parseFileSync(plistPath);

    var assets = plugin_et.findall('./asset'),
        hosts = plugin_et.findall('./access'),
        platformTag = plugin_et.find('./platform[@name="ios"]'),
        sourceFiles = platformTag.findall('./source-file'),
        headerFiles = platformTag.findall('./header-file'),
        resourceFiles = platformTag.findall('./resource-file'),
        frameworks = platformTag.findall('./framework'),
        plistEle = platformTag.find('./plugins-plist');

    // move asset files into www
    assets.forEach(function (asset) {
        var srcPath = path.resolve(
                        plugin_dir, asset.attrib['src']);

        var targetPath = path.resolve(
                            project_dir,
                            assetsDir, asset.attrib['target']);
        shell.mkdir('-p', targetPath);
        if (action == 'install') {
            shell.cp('-r', srcPath, targetPath);
        } else {
            shell.rm('-rf', targetPath);
        }
    });

    // move native files (source/header/resource)
    sourceFiles.forEach(function (sourceFile) {
        var src = sourceFile.attrib['src'],
            srcFile = path.resolve(plugin_dir, 'src/ios', src),
            targetDir = path.resolve(pluginsDir, getRelativeDir(sourceFile)),
            destFile = path.resolve(targetDir, path.basename(src));
         
        if (action == 'install') {
            xcodeproj.addSourceFile('Plugins/' + path.relative(pluginsDir, destFile));
            shell.mkdir('-p', targetDir);
            shell.cp(srcFile, destFile);
        } else {
            xcodeproj.removeSourceFile('Plugins/' + path.basename(src));   
            if(fs.existsSync(destFile))
                fs.unlinkSync(destFile);
            shell.rm('-rf', targetDir);    
        }
    });

    headerFiles.forEach(function (headerFile) {
        var src = headerFile.attrib['src'],
            srcFile = path.resolve(plugin_dir, 'src/ios', src),
            targetDir = path.resolve(pluginsDir, getRelativeDir(headerFile)),
            destFile = path.resolve(targetDir, path.basename(src));
         
        if (action == 'install') {     
            xcodeproj.addHeaderFile('Plugins/' + path.relative(pluginsDir, destFile));
            shell.mkdir('-p', targetDir);
            shell.cp(srcFile, destFile);
        } else {
            xcodeproj.removeHeaderFile('Plugins/' + path.basename(src));
            if(fs.existsSync(destFile))
                fs.unlinkSync(destFile);
            shell.rm('-rf', targetDir);
        }
    });

    resourceFiles.forEach(function (resource) {
        var src = resource.attrib['src'],
            srcFile = path.resolve(plugin_dir, 'src/ios', src),
            destFile = path.resolve(pluginsDir, path.basename(src));

        if (action == 'install') {
            xcodeproj.addResourceFile('Plugins/' + path.basename(src));
            var st = fs.statSync(srcFile);    
            if (st.isDirectory()) {
                shell.cp('-R', srcFile, pluginsDir);
            } else {
                shell.cp(srcFile, destFile);
            }
        } else {
            xcodeproj.removeResourceFile('Plugins/' + path.basename(src));
            shell.rm('-rf', destFile);
        }
    });

    frameworks.forEach(function (framework) {
        var src = framework.attrib['src'];

        if (action == 'install') {
            xcodeproj.addFramework(src);
        } else {
            xcodeproj.removeFramework(src);
        }
    });

    if (action == 'install') {
        // add hosts to whitelist (ExternalHosts) in plist
        hosts.forEach(function(host) {
            plistObj.ExternalHosts.push(host.attrib['origin']);
        });

        // add plugin to plist
        plistObj.Plugins[plistEle.attrib['key']] = plistEle.attrib['string'];
    } else {
        // remove hosts from whitelist (ExternalHosts) in plist
        // check each entry in external hosts, only add it to the plist if
        // it's not an entry added by this plugin 
        for(i=0; i < plistObj.ExternalHosts.length;i++) {
            matched = false;
            hosts.forEach(function(host) {
                if(host === plistObj.ExternalHosts[i])
                {
                    matched = true;
                }
            });
            if (!matched) {
                external_hosts.push(plistObj.ExternalHosts[i]);
            }
        }

        // filtered the external hosts entries out, copy result
        plistObj.ExternalHosts = external_hosts;

        delete plistObj.Plugins[plistEle.attrib['key']];
    }

    // write out plist
    fs.writeFileSync(plistPath, plist.build(plistObj));

    // write out xcodeproj file
    fs.writeFileSync(pbxPath, xcodeproj.writeSync());
}

function getRelativeDir(file) {
    var targetDir = file.attrib['target-dir'],
        preserveDirs = file.attrib['preserve-dirs'];

    if (preserveDirs && preserveDirs.toLowerCase() == 'true') {
        return path.dirname(file.attrib['src']);
    } else if (targetDir) {
        return targetDir;
    } else {
        return '';
    }
}

// determine if a plist file is binary
function isBinaryPlist(filename) {
    // I wish there was a synchronous way to read only the first 6 bytes of a
    // file. This is wasteful :/ 
    var buf = '' + fs.readFileSync(filename, 'utf8');
    // binary plists start with a magic header, "bplist"
    return buf.substring(0, 6) === 'bplist';
}

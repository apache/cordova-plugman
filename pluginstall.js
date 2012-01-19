// copyright (c) 2012 Andrew Lunny, Adobe Systems
var fs = require('fs'),
    platforms = require('./platforms')

// check arguments and resolve file paths
exports.init = function (platform, projectPath, pluginPath) {
    var projectPath = fs.realpathSync(projectPath),
        pluginPath = fs.realpathSync(pluginPath);

    if (platforms.indexOf(platform) < 0)
        throw { name: "Platform Error", message: platform + " not supported" }

    return {
        platform:    platform,
        projectPath: projectPath,
        pluginPath:  pluginPath
    }
}

// parse plugin.xml
exports.parseXml = function (configObj) { }

// move files

// edit files

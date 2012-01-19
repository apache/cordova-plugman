// copyright (c) 2012 Andrew Lunny, Adobe Systems
var fs = require('fs'),
    path = require('path'),
    et = require('elementtree'),
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

exports.parseXml = function (configObj) {
    var xmlPath     = path.join(configObj.pluginPath, 'plugin.xml'),
        xmlText     = fs.readFileSync(xmlPath, 'utf-8'),
        xmlDoc      = new et.ElementTree(et.XML(xmlText)),
        rootAttr    = xmlDoc._root.attrib,
        supportedPlatforms;

    supportedPlatforms = xmlDoc.findall('platform').map(function (platform) {
        return platform.attrib['name'];
    });

    return {
        xmlDoc: xmlDoc,
        _id: rootAttr['id'],
        version: rootAttr['version'],
        platforms: supportedPlatforms
    };
}

exports.moveFiles = function (configObj, dataObj) {}

exports.editFiles = function (configObj, dataObj) {}

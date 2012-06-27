var path = require('path'),
    nCallbacks = require('../util/ncallbacks'),
    asyncCopy = require('../util/asyncCopy');

exports.installPlugin = function (config, plugin, callback) {
    
    var assets = plugin.xmlDoc.findall('./asset'),
        callbackCount = assets.length,
        end = nCallbacks(callbackCount, callback);
        
        // move asset files into www
        var i = 0;
        assets.forEach(function (asset) {
            var srcPath = path.resolve(
                            config.pluginPath, asset.attrib['src']);

            var targetPath = path.resolve(
                                config.projectPath, asset.attrib['target']);

            asyncCopy(srcPath, targetPath, end);
        });
    
}
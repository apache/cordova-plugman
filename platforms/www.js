var path = require('path')
  , fs = require('fs')
  , shell = require('shelljs');

exports.handlePlugin = function (action, project_dir, plugin_dir, plugin_et) {    
    var assets = plugin_et.findall('./asset')
      , i = 0;
   
    // move asset files into www
    assets.forEach(function (asset) {
        var srcPath = path.resolve(
                        plugin_dir, asset.attrib['src']);

        var targetPath = path.resolve(
                            project_dir, asset.attrib['target']);

        var st = fs.statSync(srcPath);    
        if (st.isDirectory()) {
            shell.cp('-R', srcPath, project_dir);
        } else {
            shell.cp(srcPath, targetPath);
        }
    });
}

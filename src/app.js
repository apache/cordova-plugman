
var path = require('path'),
    glob = require('glob');

module.exports = {

    wwwPath: function(appDir) {
        return path.join(appDir, 'www');
    }, 

    configPath: function(appDir) {
        return path.join(appDir, 'www', 'config.xml');
    },     

    getPaths: function(appDir) {
        // Check for cordova.js in application, make path relative to this file
        var wwwDir = this.wwwPath(appDir);

        var jsDir = wwwDir;
        var relDir = "";
        var rel = glob.sync('**/cordova.js', {cwd: wwwDir});
        
        console.log(rel);
        if(rel.length) {
            relDir = path.join("", rel.pop().replace(/[/\\]?cordova.js/, ""));
            jsDir = path.join(wwwDir, relDir);
        }
        return {
            'www': wwwDir,
            'www.js' : relDir,
            'js': jsDir,
            'config' : this.configPath(appDir)
        };
    }
};
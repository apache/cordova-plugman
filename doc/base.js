var cordova = require('cordova'),
    exec = require('cordova/exec');

var %pluginName% = function() {
        this.options = {};
};

%pluginName%.prototype = {
    /*
        Add your plugin methods here
    */
    coolMethod: function( args, success, error ) {
        cordova.exec( success, error, "%pluginName%", "coolMethod", args );
    }
};

var %pluginName%Instance = new %pluginName%();

module.exports = %pluginName%Instance;

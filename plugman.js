// All plugman js API moved to cordova-lib . This is a temporary shim for
// dowstream packages that use plugman via js API.

var cordova_lib = require('cordova-lib');
module.exports = cordova_lib.plugman;
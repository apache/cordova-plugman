var path = require('path');

// wondering how to nicely store paths here...
// it'd be nice to just point to this file and get the correct path
// since these scripts should ideally be accessed from the cordova project folder

module.exports = {
    'cordova': 
        { 'platform':'*', 'scriptTarget': path.join('cordova','version') },   
    'cordova-plugman': 
        { 'platform':'*', 'scriptTarget': '' },
    'cordova-android': 
        { 'platform':'android', 'scriptTarget': '' },
    'cordova-ios': 
        { 'platform':'ios', 'scriptTarget': '' },
    'cordova-blackberry10': 
        { 'platform':'blackberry10', 'scriptTarget': '' },
    'cordova-wp7': 
        { 'platform':'wp7', 'scriptTarget': '' },
    'cordova-wp8': 
        { 'platform':'wp8', 'scriptTarget': '' },
    'cordova-windows8': 
        { 'platform':'windows8', 'scriptTarget': '' },
    'apple-xcode' : 
        { 'platform':'ios', 'scriptTarget': '' },
    'apple-ios' : 
        { 'platform':'ios', 'scriptTarget': '' },
    'blackberry-webworks' : 
        { 'platform':'blackberry10', 'scriptTarget': '' },
    'android-sdk' : 
        { 'platform':'android', 'scriptTarget': '' }
};

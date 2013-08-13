var path = require('path');

// wondering how to nicely store paths here...
// it'd be nice to just point to this file and get the correct path
// since these scripts should ideally be accessed from the cordova project folder

module.exports = {
    'cordova': 
        { 'platform':'*', 'scriptTarget': path.join('cordova','version') },   
    // no location needed for plugman as this should be the calling process
    'cordova-plugman': 
        { 'platform':'*', 'minVersion': process.version },
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
    
    // ideally these sdk versions will be known via a script
    // that calls the sdk's version command - the idea would be that
    // these version scripts output all in the same way and parse
    // the appropriate blob of info returned from the sdk version command
    'apple-xcode' : 
        { 'platform':'ios', 'scriptTarget': '' },
    'apple-ios' : 
        { 'platform':'ios', 'scriptTarget': '' },
    'blackberry-webworks' : 
        // use path to sdk/Framework/lib/webworks-info.js 
        // will export as version number
        // currently though, all versions of webworks sdk should be good to go 
        // so this is technically *not* needed right now
        { 'platform':'blackberry10', 'scriptTarget': '' },
    'android-sdk' : 
        // will have to parse string output from android list targets
        { 'platform':'android', 'scriptTarget': '' }
};

var path = require('path');

// wondering how to nicely store paths here...
// it'd be nice to just point to this file and get the correct path
// since these scripts should ideally be accessed from the cordova project folder

module.exports = {
    'cordova': 
        { 'platform':'*', 'scriptSrc': path.join('cordova','version') },   
    // no location needed for plugman as this should be the calling process
    'cordova-plugman': 
        { 'platform':'*', 'currentVersion': process.version },
    'cordova-android': 
        { 'platform':'android', 'scriptSrc': path.join('cordova','version') },
    'cordova-ios': 
        { 'platform':'ios', 'scriptSrc': path.join('cordova','version') },
    'cordova-blackberry10': 
        { 'platform':'blackberry10', 'scriptSrc': path.join('cordova','version') },
    'cordova-wp7': 
        { 'platform':'wp7', 'scriptSrc': path.join('cordova','version') },
    'cordova-wp8': 
        { 'platform':'wp8', 'scriptSrc': path.join('cordova','version') },
    'cordova-windows8': 
        { 'platform':'windows8', 'scriptSrc': path.join('cordova','version') },
    
    // ideally these sdk versions will be known via a script
    // that calls the sdk's version command - the idea would be that
    // these version scripts output all in the same way and parse
    // the appropriate blob of info returned from the sdk version command
    'apple-xcode' : 
        { 'platform':'ios', 'scriptSrc': '' },
    'apple-ios' : 
        { 'platform':'ios', 'scriptSrc': '' },
    'blackberry-webworks' : 
        // use path to sdk/Framework/lib/webworks-info.js 
        // will export as version number
        // currently though, all versions of webworks sdk should be good to go 
        // so this is technically *not* needed right now
        { 'platform':'blackberry10', 'scriptSrc': '' },
    'android-sdk' : 
        // will have to parse string output from android list targets
        { 'platform':'android', 'scriptSrc': '' }
};

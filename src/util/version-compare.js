function getVersionObject(versionString){
    var majorReg = /\d+/,
    minorReg = /\d+\.\d+/,
    patchReg = /\d+\.\d+\.\d+/;
    
    var major = null,
    minor = null,
    patch = null;
    
    if(majorReg.test(versionString)){
        major = parseInt(versionString.match(majorReg)[0]);
    }else{
        throw new Error('No version string detected. Unable to compare to versions. Please check the output from your version script and the engine tag in your plugin.xml.');
    }
    
    if(minorReg.test(versionString)){
        minor = parseInt(versionString.match(minorReg)[0].split('.')[1]);
    }
    
    if(patchReg.test(versionString)){
        patch = parseInt(versionString.match(patchReg)[0].split('.')[2]);
    }
    return {
        major: major,
        minor: minor,
        patch: patch
    }
}

function getComparator(versionString){
    var compareReg = /^(<|>)=?/;
    var comparator;
    
    if(compareReg.test(versionString)){
        comparator = versionString.match(compareReg)[0];
    }else{
        comparator = '=';
    }
    return comparator; 
}

function compare(numOne, numTwo, comparator){
    switch (comparator){
        case '<':
            return (numOne < numTwo);
        break;
        
        case '<=':
            return (numOne <= numTwo);
        break;
        
        case '>':
            return (numOne > numTwo);
        break;
        
        case '>=':
            return (numOne >= numTwo);
        break;
        
        default:
            return (numOne == numTwo);
    }
}

function checkVersionFormat(versionOut, versionRange){
    var majorOk = false, 
    minorOk = false, 
    patchOk = false;
    
    if(versionOut.major!=null && versionRange.major!=null){
        majorOk = true;
    }
    
    if(versionOut.minor!=null && versionRange.minor!=null){
        minorOk = true;
    }else if((versionOut.minor!=null && versionRange.minor==null) || (versionOut.minor==null && versionRange.minor!=null)){
        throw new Error('Different version string format detected. Unable to compare to versions. Please check the output from your version script and the engine tag in your plugin.xml.');
    }
    
    if(versionOut.patch!=null && versionRange.patch!=null){
        patchOk = true;
    }else if((versionOut.patch!=null && versionRange.patch==null) || (versionOut.patch==null && versionRange.patch!=null)){
        throw new Error('Different version string format detected. Unable to compare to versions. Please check the output from your version script and the engine tag in your plugin.xml.');
    }
    
    if(majorOk && minorOk && patchOk){
        return 'toPatch';
    }else if(majorOk && minorOk && !patchOk){
        return 'toMinor';
    }else if(majorOk && !minorOk && !patchOk){
        return 'toMajor';
    }
}

function satisfy(versionOut, versionRange, comparator){
    var format = checkVersionFormat(versionOut, versionRange);
    
    switch(format){
        case 'toMajor':
            return compare(versionOut.major, versionRange.major, comparator);
        break;
        
        case 'toMinor':
            if(compare(versionOut.major, versionRange.major, '=')){
                return compare(versionOut.minor, versionRange.minor, comparator);
            }else{
                return compare(versionOut.major, versionRange.major, comparator);
            }
            
        break;
        
        case 'toPatch':
            if(compare(versionOut.major, versionRange.major, '=')){
                if(compare(versionOut.minor, versionRange.minor, '=')){
                    return compare(versionOut.patch, versionRange.patch, comparator);
                }else{
                    return compare(versionOut.minor, versionRange.minor, comparator);
                }
            }else{
                return compare(versionOut.major, versionRange.major, comparator);
            }
        break;
    }
}

module.exports = {
    satisfies: function(versionOut, versionRange){
        var theVersionOut = getVersionObject(versionOut);
        var theVersionRange = getVersionObject(versionRange);
        var comparator = getComparator(versionRange);

        return satisfy(theVersionOut, theVersionRange, comparator);
    }
}



// FIXME this is extremely guettho
module.exports = function(target, method) {
  var lastDot = target.lastIndexOf('.');
  var namespace = target.substr(0, lastDot);
  var lastName = target.substr(lastDot + 1);
  var props = target.split(".");
  var code = "";
  for(var i = 1, len = props.length ; i <= len ; i++) {
    var sub = props.slice(0, i).join(".");
    code += util.format("window.%s = window.%s || {};\n", sub, sub);
  }
  
  props.unshift('window');  
  var object = props.slice(0, props.length - 1).join('.');
//  code = "\n";
  if(method === "c") {
    return util.format(
      "%s\n;require('cordova/builder').assignOrWrapInDeprecateGetter(%s, '%s', module.exports);", 
      code,
      object,
      lastName
    );
  } else if(method === "m") {
    return util.format(
      "%s\n;require('cordova/builder').recursiveMerge(%s, '%s', module.exports);", 
      code,
      object,
      lastName
    );
  }
}

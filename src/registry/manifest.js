var DOMParser = require('xmldom').DOMParser,
    path = require('path'),
    fs = require('fs');

// Java world big-up!
// TODO use CALLBACK
function generatePackageJsonFromPluginXml(plugin_path, cb) {
  var package_json = {};
  var plugin_xml = fs.readFileSync(path.resolve(plugin_path, 'plugin.xml'), "utf8");
  var doc = new DOMParser().parseFromString(plugin_xml);
  
  if(!doc || !doc.documentElement) {
    throw new Error('invalid plugin.xml document');
  }

  // name, version REQUIRED
  // setting version
  var version = doc.documentElement.getAttribute('version')
  if(!version) {
    var e = new Error('`version` required');
    if(cb) {
      cb(e);
      return null;
    }
    throw e;
  }
  package_json.version = version;

  // setting name
  if(doc.documentElement.getElementsByTagName('name').length != 1 ||
     !doc.documentElement.getElementsByTagName('name').item(0).firstChild) {
    var e = new Error('`name` is required');
    if(cb) {
      cb(e);
      return null;
    }
    throw e;
  }
  var name = doc.documentElement.getElementsByTagName('name').item(0).firstChild.nodeValue;
  if(!name.match(/^\w+|-*$/)) throw new Error('`name` can only contain alphanumberic characters and -')
  package_json.name = name.toLowerCase();

  // OPTIONAL fields: description, license, keywords. TODO: add more!
  if(doc.documentElement.getElementsByTagName('description').length == 1 &&
     doc.documentElement.getElementsByTagName('description').item(0).firstChild) {
    package_json.description = doc.documentElement
                                  .getElementsByTagName('description')
                                  .item(0).firstChild.nodeValue;
  }
  if(doc.documentElement.getElementsByTagName('license').length == 1 &&
     doc.documentElement.getElementsByTagName('license').item(0).firstChild) {
    package_json.license = doc.documentElement
                              .getElementsByTagName('license')
                              .item(0).firstChild.nodeValue;
  }
  if(doc.documentElement.getElementsByTagName('keywords').length == 1 &&
     doc.documentElement.getElementsByTagName('keywords').item(0).firstChild) {
    package_json.keywords = doc.documentElement
                               .getElementsByTagName('keywords')
                               .item(0).firstChild.nodeValue.split(',');
  }

  // write package.json
  var package_json_path = path.resolve(plugin_path, 'package.json');
  fs.writeFileSync(package_json_path, JSON.stringify(package_json, null, 4), 'utf8');
  return package_json;
}

module.exports.generatePackageJsonFromPluginXml = generatePackageJsonFromPluginXml;

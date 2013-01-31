var fs = require('fs')
  , path = require('path')
  , shell = require('shelljs')
  , et = require('elementtree')
  , osenv = require('osenv')
  , bb10 = require(path.join(__dirname, '..', 'platforms', 'bb10'))
  , test_dir = path.join(osenv.tmpdir(), 'test_plugman')
  , test_project_dir = path.join(test_dir, 'projects', 'BlackBerry10', 'www')
  , test_plugin_dir = path.join(test_dir, 'plugins', 'cordova.echo')
  , xml_path     = path.join(test_dir, 'plugins', 'cordova.echo', 'plugin.xml')
  , xml_text, plugin_et
  , srcDir = path.resolve(test_project_dir, 'ext-qnx/cordova.echo');
  
exports.setUp = function(callback) {
    shell.mkdir('-p', test_dir);
    
    // copy the bb10 test project to a temp directory
    shell.cp('-r', path.join(__dirname, 'projects'), test_dir);

    // copy the bb10 test plugin to a temp directory
    shell.cp('-r', path.join(__dirname, 'plugins'), test_dir);

    // parse the plugin.xml into an elementtree object
    xml_text   = fs.readFileSync(xml_path, 'utf-8')
    plugin_et  = new et.ElementTree(et.XML(xml_text));

    callback();
}

exports.tearDown = function(callback) {
    // remove the temp files (projects and plugins)
    shell.rm('-rf', test_dir);
    callback();
}

exports['should move the source files'] = function (test) {
    // run the platform-specific function
    bb10.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);

    test.ok(fs.existsSync(srcDir + '/client.js'));
    test.ok(fs.existsSync(srcDir + '/index.js'));
    test.ok(fs.existsSync(srcDir + '/manifest.json'));
    test.ok(fs.existsSync(srcDir + '/device/echoJnext.so'));
    test.ok(fs.existsSync(srcDir + '/simulator/echoJnext.so'));
    test.done();
}

exports['should edit config.xml'] = function (test) {
    bb10.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);
    
    var configXmlPath = path.join(test_project_dir, 'config.xml');
    var pluginsTxt = fs.readFileSync(configXmlPath, 'utf-8'),
        pluginsDoc = new et.ElementTree(et.XML(pluginsTxt)),
        expected = 'feature[@id="cordova.echo"]';
    test.ok(pluginsDoc.find(expected));

    test.done();
}

exports['should not install a plugin that is already installed'] = function (test) {
    bb10.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et);

    test.throws(function(){bb10.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et); }, 
                /already installed/
               );
    test.done();
}

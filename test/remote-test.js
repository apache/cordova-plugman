var path = require('path'),
    plugins = require(path.join(__dirname, '..', 'util', 'plugins'));

exports['should get plugin information from a remote source'] = function(test) {
    plugins.getPluginInfo('ChildBrowser', function(plugin) {
        test.equal('https://github.com/imhotep/ChildBrowser', plugin.url);
        test.equal('ChildBrowser', plugin.name);
        test.equal('ChildBrowser plugin', plugin.description);
        test.done();
    }, function() { test.ok(false); });
}

exports['should list all plugins from a remote source'] = function(test) {
    plugins.listAllPlugins(function(plugins) {
        test.ok(plugins != undefined);
        test.ok(plugins.length > 0);
        test.done();
    }, function() { test.ok(false); });
}

exports['should clone plugin git repository'] = function(test) {
    plugins.getPluginInfo('ChildBrowser', function(plugin) {
        test.ok(plugins.clonePluginGitRepo(plugin.url) != undefined);
        test.done();
    }, function() { test.ok(false); });
}

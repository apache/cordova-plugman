var dep_graph = require('dep-graph'),
    path = require('path'),
    fs = require('fs'),
    config_changes = require('./config-changes'),
    xml_helpers = require('./xml-helpers');

module.exports = {
    generate_dependency_info:function(plugins_dir, platform, context) {
        var json = config_changes.get_platform_json(plugins_dir, platform);
        var tlps = [];
        var graph = new dep_graph();
        Object.keys(json.installed_plugins).forEach(function(tlp) {
            tlps.push(tlp);
            var xml = xml_helpers.parseElementtreeSync(path.join(plugins_dir, tlp, 'plugin.xml'));
            var deps = xml.findall('dependency');
            deps && deps.forEach(function(dep) {
                var id = dep.attrib.id;
                graph.add(tlp, id);
            });
        });
        Object.keys(json.dependent_plugins).forEach(function(plug) {
            var xmlPath = path.join(plugins_dir, plug, 'plugin.xml');
            if (context == 'remove' && !fs.existsSync(xmlPath)) {
                return; // dependency may have been forcefully removed
            }

            var xml = xml_helpers.parseElementtreeSync(xmlPath);
            var deps = xml.findall('dependency');
            deps && deps.forEach(function(dep) {
                var id = dep.attrib.id;
                graph.add(plug, id);
            });
        });
        return {
            graph:graph,
            top_level_plugins:tlps
        };
    }
};

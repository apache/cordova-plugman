var path = require('path')
    , fs = require('fs')
    , common = require('./common');

module.exports = {
    www_dir: function(project_dir) {
        return path.join(project_dir, 'www');
    },
    package_name:function(project_dir) {
        // preferred location if cordova >= 3.4
        var preferred_path = path.join(project_dir, 'config.xml');
        if (!fs.existsSync(preferred_path)) {
            // older location
            old_config_path = path.join(module.exports.www_dir(project_dir), 'config.xml');
            if (!fs.existsSync(old_config_path)) {
                // output newer location and fail reading
                config_path = preferred_path;
                require('../../plugman').emit('verbose', 'unable to find '+config_path);
            } else {
                config_path = old_config_path;
            }
        } else {
            config_path = preferred_path;
        }
        var widget_doc = xml_helpers.parseElementtreeSync(config_path);
        return widget_doc._root.attrib['id'];
    },
    "source-file":{
        install:function(source_el, plugin_dir, project_dir, plugin_id) {
            var dest = path.join(source_el.attrib['target-dir'], path.basename(source_el.attrib['src']));
            common.copyFile(plugin_dir, source_el.attrib['src'], project_dir, dest);
        },
        uninstall:function(source_el, project_dir, plugin_id) {
            var dest = path.join(source_el.attrib['target-dir'], path.basename(source_el.attrib['src']));
            common.removeFile(project_dir, dest);
        }
    },
    "resource-file":{
        install:function(el, plugin_dir, project_dir, plugin_id) {
            require('../../plugman').emit('verbose', 'resource-file is not supported for Firefox OS');
        },
        uninstall:function(el, project_dir, plugin_id) {
        }
    }
};

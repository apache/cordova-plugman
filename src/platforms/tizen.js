var path = require('path')
    , xml_helpers = require('../util/xml-helpers')
    , common = require('./common');

module.exports = {
    www_dir: function(project_dir) {
        return path.join(project_dir, 'www');
    },
    package_name:function(project_dir) {
        var config_path = path.join(module.exports.www_dir(project_dir), 'config.xml');
        var widget_doc = xml_helpers.parseElementtreeSync(config_path);
        return widget_doc._root.attrib['id'];
    }
};

var xml_helpers = require('./xml-helpers'),
    et = require('elementtree'),
    fs = require('fs');

function csproj(location) {
    this.location = location;
    this.xml = xml_helpers.parseElementtreeSync(location);
    return this;
}

csproj.prototype = {
    write:function() {
        fs.writeFileSync(this.location, this.xml.write({indent:4}), 'utf-8');
    },
    addSourceFile:function(relative_path) {
        relative_path = relative_path.join('/').join('\\');
        var item = new et.Element('ItemGroup');
        var compile = new et.Element('Compile');
        compile.attrib.Include = relative_path;
        item.append(compile);
        this.xml.getroot().append(item);
    },
    removeSourceFile:function(relative_path) {
        relative_path = relative_path.join('/').join('\\');
        var groups = this.xml.findall('ItemGroup');
        for (var i = 0, l = groups.length; i < l; i++) {
            var group = groups[i];
            var compiles = group.findall('Compile');
            for (var j = 0, k = compiles.length; j < k; j++) {
                var compile = compiles[j];
                if (compile.attrib.Include == relative_path) {
                    group.remove(0, compile);
                    return true;
                }
            }
        }
        return false;
    }
};

module.exports = csproj;

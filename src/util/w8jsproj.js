/*
  Helper for dealing with Windows Store JS app .jsproj files
*/


var xml_helpers = require('./xml-helpers'),
    et = require('elementtree'),
    fs = require('fs'),
    path = require('path');

function jsproj(location) {
    require('../../plugman').emit('verbose','creating jsproj from project at : ' + location);
    this.location = location;
    this.xml = xml_helpers.parseElementtreeSync(location);
    return this;
}

jsproj.prototype = {
    location:null,
    xml:null,
    write:function() {
        fs.writeFileSync(this.location, this.xml.write({indent:4}), 'utf-8');
    },
    // add/remove the item group for SDKReference
    // example :
    // <ItemGroup><SDKReference Include="Microsoft.VCLibs, version=12.0" /></ItemGroup>
    addSDKRef:function(incText) {
        var item_group = new et.Element('ItemGroup');
        var elem = new et.Element('SDKReference');
        elem.attrib.Include = incText;

        item_group.append(elem);
        this.xml.getroot().append(item_group);
    },

    removeSDKRef:function(incText) {
        var item_groups = this.xml.findall('ItemGroup/SDKReference[@Include="' + incText + '"]/..');
        if(item_groups.length > 0 ) {
            this.xml.getroot().remove(0, item_groups[0]);
        }
    },

    addReference:function(relPath,src) {

        require('../../plugman').emit('verbose','addReference::' + relPath);

        var item = new et.Element('ItemGroup');
        var extName = path.extname(relPath);

        var elem = new et.Element('Reference');
        // add file name
        elem.attrib.Include = path.basename(relPath, extName);

        // add hint path with full path
        var hint_path = new et.Element('HintPath');
            hint_path.text = relPath;

        elem.append(hint_path);

        if(extName == ".winmd") {
            var mdFileTag = new et.Element("IsWinMDFile");
                mdFileTag.text = "true";
            elem.append(mdFileTag);
        }

        item.append(elem);
        this.xml.getroot().append(item);
    },
    
    removeReference:function(relPath) {
        require('../../plugman').emit('verbose','removeReference::' + relPath);

        var item = new et.Element('ItemGroup');
        var extName = path.extname(relPath);
        var includeText = path.basename(relPath,extName);
        // <ItemGroup>
        //   <Reference Include="WindowsRuntimeComponent1">
        var item_groups = this.xml.findall('ItemGroup/Reference[@Include="' + includeText + '"]/..');

        if(item_groups.length > 0 ) {
            this.xml.getroot().remove(0, item_groups[0]);
        }
    },

    addSourceFile:function(relative_path) {

        relative_path = relative_path.split('/').join('\\');
        // make ItemGroup to hold file.
        var item = new et.Element('ItemGroup');

        var content = new et.Element('Content');
            content.attrib.Include = relative_path;
        item.append(content);

        this.xml.getroot().append(item);
    },

    removeSourceFile:function(relative_path) {

        // path.normalize(relative_path);// ??
        relative_path = relative_path.split('/').join('\\');

        // var oneStep = this.xml.findall('ItemGroup/Content[@Include="' + relative_path + '""]/..');

        var item_groups = this.xml.findall('ItemGroup');
        for (var i = 0, l = item_groups.length; i < l; i++) {
            var group = item_groups[i];
            var files = group.findall('Content');
            for (var j = 0, k = files.length; j < k; j++) {
                var file = files[j];
                if (file.attrib.Include == relative_path) {
                    // remove file reference
                    group.remove(0, file);
                    // remove ItemGroup if empty
                    var new_group = group.findall('Content');
                    if(new_group.length < 1) {
                        this.xml.getroot().remove(0, group);
                    }
                    return true;
                }
            }
        }
        return false;
    }
};

module.exports = jsproj;

/*
  Helper for dealing with Windows Store JS app .jsproj files
*/


var xml_helpers = require('./xml-helpers'),
    et = require('elementtree'),
    fs = require('fs'),
    shell = require('shelljs'),
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
    plugins_dir:"Plugins",
    write:function() {
        fs.writeFileSync(this.location, this.xml.write({indent:4}), 'utf-8');
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
    addProjectReference:function(relative_path) {
        require('../../plugman').emit('verbose','adding project reference to ' + relative_path);
        // read the guid from the project

        // could be a .csproj, or ???
        var projectFullPath = shell.ls(path.join(relative_path,"*.*proj"));
        var pluginProjectXML = xml_helpers.parseElementtreeSync(".\\" + projectFullPath);
        var guidNode = pluginProjectXML.findall("PropertyGroup/ProjectGuid")[0];
        var projectGuid = guidNode.text;
        console.log("Project guid = " + projectGuid);


    },
    removeProjectReference:function(relative_path) {
        require('../../plugman').emit('verbose','removing project reference to ' + relative_path);
    },
    removeSourceFile:function(relative_path) {
        relative_path = relative_path.split('/').join('\\');
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

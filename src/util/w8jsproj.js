/*
  Helper for dealing with Windows Store JS app .jsproj files
*/


var xml_helpers = require('./xml-helpers'),
    et = require('elementtree'),
    fs = require('fs'),
    shell = require('shelljs'),
    path = require('path');

var WindowsStoreProjectTypeGUID = "{BC8A1FFA-BEE3-4634-8014-F334798102B3}";  // any of the below, subtype
var WinCSharpProjectTypeGUID = "{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}";    // .csproj
var WinVBnetProjectTypeGUID = "{F184B08F-C81C-45F6-A57F-5ABD9991F28F}";     // who the ef cares?
var WinCplusplusProjectTypeGUID = "{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}"; // .vcxproj


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
        var item_group = this.xml.find('ItemGroup/SDKReference[@Include="' + incText + '"]/..');
        if(item_group) { // TODO: error handling
            this.xml.getroot().remove(0, item_group);
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

        var extName = path.extname(relPath);
        var includeText = path.basename(relPath,extName);
        // <ItemGroup>
        //   <Reference Include="WindowsRuntimeComponent1">
        var item_group = this.xml.find('ItemGroup/Reference[@Include="' + includeText + '"]/..');

        if(item_group) { // TODO: erro handling
            this.xml.getroot().remove(0, item_group);
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
    },
    // relative path must include the project file, so we can determine .csproj, .jsproj, .vcxproj...
    addProjectReference:function(relative_path) {
        require('../../plugman').emit('verbose','adding project reference to ' + relative_path);

        relative_path = relative_path.split('/').join('\\');
        // read the solution path from the base directory
        var solutionPath = shell.ls(path.join(path.dirname(this.location),"*.sln"))[0];// TODO:error handling
        // note we may not have a solution, in which case just add a project reference, I guess ..
        // get the project extension to figure out project type
        var projectExt = path.extname(relative_path);

        var pluginProjectXML = xml_helpers.parseElementtreeSync(relative_path);
        // find the guid + name of the referenced project
        var projectGuid = pluginProjectXML.find("PropertyGroup/ProjectGuid").text;
        var projName = pluginProjectXML.find("PropertyGroup/ProjectName").text;

        var preInsertText = "ProjectSection(ProjectDependencies) = postProject\n\r" +
                             projectGuid + "=" + projectGuid + "\n\r" +
                            "EndProjectSection\n\r";

        // read in the solution file
        var solText = fs.readFileSync(solutionPath,{encoding:"utf8"});
        var splitText = solText.split("EndProject");
        if(splitText.length != 2) {
            throw new Error("too many projects in solution.");
        }

        var projectTypeGuid = null;
        if(projectExt == ".vcxproj") {
            projectTypeGuid = WinCplusplusProjectTypeGUID;
        }
        else if(projectExt == ".csproj") {
            projectTypeGuid = WinCSharpProjectTypeGUID;
        }
        
        if(!projectTypeGuid) {
            throw new Error("unrecognized project type");
        }

        var postInsertText = 'Project("' + projectTypeGuid + '") = "' + 
                         projName + '", "' + relative_path + '",' +
                        '"' + projectGuid + '"\n\r EndProject\n\r';

        solText = splitText[0] + preInsertText + "EndProject\n\r" + postInsertText + splitText[1];
        fs.writeFileSync(solutionPath,solText,{encoding:"utf8"});
        

        // Add the ItemGroup/ProjectReference to the cordova project :
        // <ItemGroup><ProjectReference Include="blahblah.csproj"/></ItemGroup>
        var item = new et.Element('ItemGroup');

        var projRef = new et.Element('ProjectReference');
            projRef.attrib.Include = relative_path;
            item.append(projRef);
        this.xml.getroot().append(item);

    },
    removeProjectReference:function(relative_path) {
        require('../../plugman').emit('verbose','removing project reference to ' + relative_path);

        // find the guid + name of the referenced project
        var pluginProjectXML = xml_helpers.parseElementtreeSync(relative_path);
        var projectGuid = pluginProjectXML.find("PropertyGroup/ProjectGuid").text;
        var projName = pluginProjectXML.find("PropertyGroup/ProjectName").text;

        // get the project extension to figure out project type
        var projectExt = path.extname(relative_path);
        // get the project type
        var projectTypeGuid = null;
        if(projectExt == ".vcxproj") {
            projectTypeGuid = WinCplusplusProjectTypeGUID;
        }
        else if(projectExt == ".csproj") {
            projectTypeGuid = WinCSharpProjectTypeGUID;
        }
        
        if(!projectTypeGuid) {
            throw new Error("unrecognized project type");
        }

        var preInsertText = "ProjectSection(ProjectDependencies) = postProject\n\r" +
                             projectGuid + "=" + projectGuid + "\n\r" +
                            "EndProjectSection\n\r";

        var postInsertText = 'Project("' + projectTypeGuid + '") = "' + 
                              projName + '", "' + relative_path + '",' +
                              '"' + projectGuid + '"\n\r EndProject\n\r';

        // find and read in the solution file
        var solutionPath = shell.ls(path.join(path.dirname(this.location),"*.sln"))[0];  // TODO:error handling
        var solText = fs.readFileSync(solutionPath,{encoding:"utf8"});
        var splitText = solText.split(preInsertText);
        
        solText = splitText.join("").split(postInsertText);
        solText = solText.join("");

        fs.writeFileSync(solutionPath,solText,{encoding:"utf8"});

        // select first ItemsGroups with a ChildNode ProjectReference
        // ideally select all, and look for @attib 'Include'= projectFullPath
        var projectRefNodesPar = this.xml.find("ItemGroup/ProjectReference[@Include='" + relative_path + "']/..");
        if(projectRefNodesPar) {
            this.xml.getroot().remove(0, projectRefNodesPar);
        }
    }
};

module.exports = jsproj;

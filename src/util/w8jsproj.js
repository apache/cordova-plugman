/*
  Helper for dealing with Windows Store JS app .jsproj files
*/


var xml_helpers = require('./xml-helpers'),
    et = require('elementtree'),
    fs = require('fs'),
    shell = require('shelljs'),
    path = require('path');

var WindowsStoreProjectTypeGUID = "{BC8A1FFA-BEE3-4634-8014-F334798102B3}";  
var WinCSharpProjectTypeGUID = "{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}";  
var WinVBnetProjectTypeGUID = "{F184B08F-C81C-45F6-A57F-5ABD9991F28F}";
var WinCplusplusProjectTypeGUID = "{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}";

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
    },
    addProjectReference:function(relative_path) {
        require('../../plugman').emit('verbose','adding project reference to ' + relative_path);
        relative_path = relative_path.split('/').join('\\');
        // read the guid from the project
        console.log("this.location = " + this.location);
        console.log("addProjectReference " + relative_path);
        // could be a .csproj, or ???
        var projectFullPath = shell.ls(path.join(relative_path,"*.*proj"))[0];
        projectFullPath = projectFullPath.split('/').join('\\');

        var solutionPath = shell.ls(path.join(path.dirname(this.location),"*.sln"))[0];
        console.log("solutionPath = " + solutionPath);
        
        // note we may not have a solution, in which case just add a project reference

        // if it is a vsxproj we will have use the guid to add to the solution
        /*
Project("{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}") = "WindowsCppRuntimeComponent1", "..\WindowsCppRuntimeComponent1\WindowsCppRuntimeComponent1.vcxproj", "{91604387-B9EC-4598-8261-5FDC23409E23}"
EndProject
        */

        var pluginProjectXML = xml_helpers.parseElementtreeSync(".\\" + projectFullPath);
        // find the guid of the project
        var guidNode = pluginProjectXML.findall("PropertyGroup/ProjectGuid")[0];
        var projectGuid = guidNode.text;

        var assemblyName = pluginProjectXML.findall("PropertyGroup/AssemblyName")[0].text;

        //find the project type
        var ptGuidsNode = pluginProjectXML.findall("PropertyGroup/ProjectTypeGuids")[0];
        if(ptGuidsNode != null) {
            var guids = ptGuidsNode.text.split(";");
            if(guids.indexOf(WinCSharpProjectTypeGUID) > -1) {
                console.log("found C# project type");

                var preInsertText = "ProjectSection(ProjectDependencies) = postProject\n\r" +
                                     projectGuid + "=" + projectGuid + "\n\r" +
                                     "EndProjectSection\n\r";

                // debug
                preInsertText = "";

                var postInsertText = 'Project("' + WinCSharpProjectTypeGUID + '") = "' + 
                                         assemblyName + '", "' + projectFullPath + '",' +
                                        '"' + projectGuid + '"\n\r EndProject\n\r';

                // read in the solution file
                var solText = fs.readFileSync(solutionPath,{encoding:"utf8"});
                var splitText = solText.split("EndProject");
                if(splitText.length != 2) {
                    console.log("oops, too many projects in this solution");
                }                 
                else {
                    solText = splitText[0] + preInsertText + "EndProject\n\r" + postInsertText + splitText[1];
                    // console.log("solText = " + solText);
                    fs.writeFileSync(solutionPath,solText,{encoding:"utf8"});
                }
            }
            else if(false || guids.indexOf(WinCSharpProjectTypeGUID) > -1) {

            }
            else {

            }
        }


        var assemblyNode = pluginProjectXML.findall("PropertyGroup/AssemblyName")[0];
        var assemblyName = assemblyNode.text;

        console.log("Project guid = " + projectGuid);
        console.log("assemblyName = " + assemblyName);

        return;
        

        // Add the item group ProjectReference to the cordova project :
    //         <ItemGroup>
    //     <ProjectReference Include="WindowsRuntimeComponent1\WindowsRuntimeComponent1.csproj" />
    // </ItemGroup>
        // make ItemGroup to hold file.
        var item = new et.Element('ItemGroup');

        var projRef = new et.Element('ProjectReference');
            projRef.attrib.Include = assemblyName;//projectFullPath;
            item.append(projRef);
        this.xml.getroot().append(item);

    },
    removeProjectReference:function(relative_path) {
        require('../../plugman').emit('verbose','removing project reference to ' + relative_path);

        // could be a .csproj, or ???
        var projectFullPath = shell.ls(path.join(relative_path,"*.*proj"));

        // select first ItemsGroups with a ChildNode ProjectReference
        // ideally select all, and look for @attib 'Include'= projectFullPath
        var projectRefNodesPar = this.xml.findall("ItemGroup[ProjectReference]")[0];

        console.log("projectRefNodes = " + projectRefNodesPar);
    
        return;

        if(projectRefNodesPar) {
            this.xml.getroot().remove(0, projectRefNodesPar);
        }
    }
};

module.exports = jsproj;

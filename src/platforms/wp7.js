/*
 *
 * Copyright 2013 Jesse MacFadyen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var common = require('./common'),
    path = require('path'),
    glob = require('glob'),
    csproj = require('../util/csproj');
    xml_helpers = require('../util/xml-helpers');

/*
var unix_projPath,  //  for use with glob
    projectFilename,//  first csproj returned by glob unix_projPath
    projPath,       //  full path to the project file, including file name
    configFilePath, //  path to config.xml
    assets,         //  assets node et in root ./asset
    platformTag,    //  wp7 platform node et
    sourceFiles,    //  ./source-file inside platform
    hosts,          //  ./access inside root
    projectChanges; //  <config-file target=".csproj" parent=".">, inside platform

function initPaths(project_dir, plugin_dir, plugin_et, variables) {

    unix_projPath = project_dir.split("\\").join("/");
    configFilePath = path.join(unix_projPath,'config.xml');
    projectFilename = glob.sync('*.csproj',{nocase:true,cwd:unix_projPath})[0];
    projPath = path.join(unix_projPath,projectFilename);
    assets = plugin_et.findall('./asset');
    platformTag = plugin_et.find('./platform[@name="wp7"]');
    sourceFiles = platformTag.findall('./source-file');
    projectChanges = platformTag.findall('./config-file[@target=".csproj"]');
    hosts = plugin_et.findall('./access');
}
  projectChanges && projectChanges.forEach(function (configNode) {

    var docStr = fs.readFileSync(projPath,"utf8");

    // child is the configNode child that we will insert into csproj
    var child = configNode.find('*'); 
    // we use empty text as a default, so we always modify the project file so Visual Studio will notice if open.
    var newNodeText = "";
    if(child) {

      newNodeText = new et.ElementTree(child).write({xml_declaration:false});
      newNodeText = newNodeText.split("&#xA;").join("\n").split("&#xD;").join("\r");
      newNodeText += "\n\r";
    }

    // insert text right before closing tag
    var newDocStr = docStr.replace("</Project>", newNodeText + "</Project>");

    // save it, and get out
    fs.writeFileSync(projPath, newDocStr);
  });

   projectChanges && projectChanges.forEach(function (configNode) {

    var docStr = fs.readFileSync(projPath,"utf8");

    // child is the configNode child that we will insert into csproj
    var child = configNode.find('*'); 
    if(child) {
      var newNodeText = new et.ElementTree(child).write({xml_declaration:false});
          
      newNodeText = newNodeText.split("&#xA;").join("\n").split("&#xD;").join("\r");
      
      // insert text right before closing tag
      var splitString = docStr.split(newNodeText);
      console.log("split length = " + splitString.length);
      var newDocStr = splitString.join("");

      // save it, and get out
      fs.writeFileSync(projPath, newDocStr);
    }
    else {
      // this just lets Visual Studio know to reload the project if it is open
      fs.writeFileSync(projPath, docStr);
    }
  });
*/
module.exports = {
    www_dir:function(project_dir) {
        return path.join(project_dir, 'www');
    },
    package_name:function(project_dir) {
        return xml_helpers.parseElementtreeSync(path.join(project_dir, 'Properties', 'WMAppManifest.xml')).find('App').attrib.ProductID;
    },
    parseWP7ProjectFile:function(project_dir) {
        var project_files = glob.sync('*.csproj', {
            cwd:project_dir
        });
        if (project_files.length === 0) {
            throw new Error('does not appear to be a Windows Phone project (no .csproj file)');
        }
        return new csproj(path.join(project_dir, project_files[0]));
    },
    "source-file":{
        install:function(source_el, plugin_dir, project_dir, plugin_id, project_file) {
            var dest = path.join('Plugins', plugin_id, source_el.attrib['target-dir'] ? source_el.attrib['target-dir'] : '', path.basename(source_el.attrib['src']));
            common.copyFile(plugin_dir, source_el.attrib['src'], project_dir, dest);
            // add reference to this file to csproj.
            project_file.addSourceFile(dest);
        },
        uninstall:function(source_el, project_dir, plugin_id, project_file) {
            var dest = path.join('Plugins', plugin_id, source_el.attrib['target-dir'] ? source_el.attrib['target-dir'] : '', path.basename(source_el.attrib['src']));
            common.removeFile(project_dir, dest);
            // remove reference to this file from csproj.
            project_file.removeSourceFile(dest);
        }
    }
};

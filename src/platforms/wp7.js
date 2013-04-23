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

/*
node plugman --platform wp7 --project '/c//users/jesse/documents/visual studio 2012/Projects/TestPlugin7/' --plugin '.\test\plugins\ChildBrowser\'

TODO:  ( Apr. 16, 2013 - jm )
- Update WMAppManifest.xml with any new required capabilities 
- add references for any new libraries required by plugin



*/

var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    shell = require('shelljs'),
    et = require('elementtree'),
    xml_helpers = require('../util/xml-helpers'),
    getConfigChanges = require('../util/config-changes'),
    assetsDir = 'www'; // relative path to project's web assets

var unix_projPath,  //  for use with glob
    projectFilename,//  first csproj returned by glob unix_projPath
    projPath,       //  full path to the project file, including file name
    configFilePath, //  path to config.xml
    assets,         //  assets node et in root ./asset
    platformTag,    //  wp7 platform node et
    sourceFiles,    //  ./source-file inside platform
    hosts,          //  ./access inside root
    projectChanges; //  <config-file target=".csproj" parent=".">, inside platform



function copyFileSync(srcPath, destPath) {

  var stats = fs.statSync(srcPath);
  if(stats.isDirectory()) {
     shell.mkdir('-p', destPath);
     // without the added slash at the end, we will get an extra folder inside destination
     shell.cp('-r', srcPath + "/" , destPath);
  }
  else if(fs.existsSync(srcPath)) {
    shell.cp(srcPath, destPath);
  }
  else {
    console.log("File does not exist :: " + srcPath);
    return;
  }

  var msg = shell.error();
  if(msg) {
    console.log("msg" + msg);
    throw { name: "ShellError", message: msg};
  }
}    

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

function install(project_dir, plugin_dir, plugin_et, variables) {

  // move asset files
  assets && assets.forEach(function (asset) {
      var srcPath = path.resolve(plugin_dir, asset.attrib['src']);
      var targetPath = path.resolve(project_dir, assetsDir,  asset.attrib['target']);
      copyFileSync(srcPath, targetPath);
  });

  // move source files
  sourceFiles && sourceFiles.forEach(function (sourceFile) {
      var srcFilePath = path.resolve(plugin_dir,  sourceFile.attrib['src']);
      var destDir = path.resolve(project_dir, sourceFile.attrib['target-dir']);
      var destFilePath = path.resolve(destDir, path.basename(sourceFile.attrib['src']));
      copyFileSync(srcFilePath, destFilePath);
  });

  updateConfigXml("install", configFilePath, plugin_et);

  et.register_namespace("csproj", "http://schemas.microsoft.com/developer/msbuild/2003");
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
}

function updateConfigXml(action, config_path, plugin_et) {

    var hosts = plugin_et.findall('./access');
    var platformTag = plugin_et.find('./platform[@name="wp7"]');
    var configChanges = getConfigChanges(platformTag);   
    var base_config_path = path.basename(config_path);
        // add whitelist hosts
    var root = et.Element("config-file");
        root.attrib['parent'] = '.';
      
    hosts && hosts.forEach( function (tag) {
      root.append(tag);
    });

    if (root.len()) {
      var changeList = configChanges[path.basename(config_path)];
      // if changeList then add to it, otherwise create it.
      if(changeList) {
        changeList.push(root);
      }
      else {
        configChanges[path.basename(config_path)] = [root]
      }
    }  

    if (configChanges[path.basename(config_path)]) {

          // edit configuration files
      var xmlDoc = xml_helpers.parseElementtreeSync(config_path)
      configChanges[base_config_path].forEach( function (configNode) {
            var selector = configNode.attrib["parent"],
                children = configNode.findall('*');
            if( action == 'install') {
                if (!xml_helpers.graftXML(xmlDoc, children, selector)) {
                    throw new Error('failed to add children to ' + selector + ' in ' + config_path);
                }
            } else {
                if (!xml_helpers.pruneXML(xmlDoc, children, selector)) {
                    throw new Error('failed to remove children from ' + selector + ' in ' + config_path);
                }
            }
      });
    }

    fs.writeFileSync(config_path, xmlDoc.write({indent: 4}));
}

function uninstall(project_dir, plugin_dir, plugin_et, variables) {

   assets && assets.forEach(function (asset) {
      var targetPath = path.resolve(project_dir, assetsDir,  asset.attrib['target']);
      shell.rm('-rf', targetPath);
   });

   sourceFiles && sourceFiles.forEach(function (sourceFile) {
      var destDir = path.resolve(project_dir, sourceFile.attrib['target-dir']);
      var destFilePath = path.resolve(destDir, path.basename(sourceFile.attrib['src']));
      shell.rm('-rf', destFilePath);
   });

   updateConfigXml("uninstall", configFilePath, plugin_et);

   et.register_namespace("csproj", "http://schemas.microsoft.com/developer/msbuild/2003");

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
}

exports.handlePlugin = function (action, project_dir, plugin_dir, plugin_et, variables) {
    console.log("action = " + action);
    switch(action) {
        case 'install' :
            initPaths(project_dir, plugin_dir, plugin_et, variables);
            install(project_dir, plugin_dir, plugin_et, variables);
            break;
        case 'uninstall' :
            initPaths(project_dir, plugin_dir, plugin_et, variables);
            uninstall(project_dir, plugin_dir, plugin_et, variables);
            break;
        default :
          throw 'error unknown action';
          break;
    }
}

<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->

# Cordova-plugman Release Notes

### 1.5.1 (Oct 04, 2017)
* [CB-13380](https://issues.apache.org/jira/browse/CB-13380) Updated `cordova-lib` dependecy to `7.1.0`
* [CB-12895](https://issues.apache.org/jira/browse/CB-12895) setup `eslint` and remove `jshint`

### 1.5.0 (May 02, 2017)
* [CB-12747](https://issues.apache.org/jira/browse/CB-12747) Updated `cordova-lib` dependency to `7.0.0`

### 1.4.1 (Jan 17, 2017)
* [CB-12358](https://issues.apache.org/jira/browse/CB-12358) Updated `cordova-lib` dependency.

### 1.4.0 (Oct 21, 2016)
* Add github pull request template
* [CB-12039](https://issues.apache.org/jira/browse/CB-12039) updated `cordova-lib` to `6.4.0`

### 1.3.0 (May 12, 2016)
* [CB-9858](https://issues.apache.org/jira/browse/CB-9858) added `--fetch` option to plugman

### 1.2.0 (Mar 17, 2016)
* [CB-10902](https://issues.apache.org/jira/browse/CB-10902) Updated cordova-lib dependency to 6.1.0
 
### 1.1.0 (Jan 25, 2016)
* [CB-10424](https://issues.apache.org/jira/browse/CB-10424) Updated cordova-lib dependency to 6.0.0

### 1.0.5 (Oct 30, 2015)
* [CB-9800](https://issues.apache.org/jira/browse/CB-9800) Fixing contribute link.
* [CB-9903](https://issues.apache.org/jira/browse/CB-9903) Updated cordova-lib dependency to 5.4.0

### 1.0.3 (Sep 17, 2015)
* updated cordova lib dependency to 5.3.2

### 1.0.2 (Aug 28, 2015)
* Updated cordova-lib dependency to 5.3.1
* [CB-7143](https://issues.apache.org/jira/browse/CB-7143) Added support for OSX

### 1.0.0 (Aug 06, 2015)
* updated help with changes for npm publishing
* [CB-9330](https://issues.apache.org/jira/browse/CB-9330) Adds notice about removed plugman commands. Removed
publish, unpublish, addUser commands.
* [CB-9332](https://issues.apache.org/jira/browse/CB-9332) Removes unnecessary dependencies
* Adding .ratignore file.

### 0.23.3 (June 4, 2015)
* Updated cordova-lib dependency to 5.1.1
 
### 0.23.1 (Apr 16, 2015)
* [CB-8637](https://issues.apache.org/jira/browse/CB-8637) add windows to plugman

### 0.23.0 (Feb 27, 2015)
* [CB-8416](https://issues.apache.org/jira/browse/CB-8416) added `plugman createpackagejson .` command to generate a package.json file from plugin.xml
* [CB-8370](https://issues.apache.org/jira/browse/CB-8370) Update documentation for `plugman publish` without args

### 0.22.17 (Jan 06, 2015)
* fixing broken link to chrome plugins

### 0.22.16 (Nov 13, 2014)
* [CB-7079](https://issues.apache.org/jira/browse/CB-7079) Allow special characters and digits in id when publishing to plugins registry
* Update dependencies in package.json

### 0.22.12 (Oct 10, 2014)
* Pinned dependencies
* [CB-7383](https://issues.apache.org/jira/browse/CB-7383) Updated version and RELEASENOTES.md for release 0.22.10
* update versions of self and dependencies after 3.6
* [CB-7383](https://issues.apache.org/jira/browse/CB-7383) Incremented package version to -dev

### 0.22.10
* remove shrinkwrap

### 0.22.9
[CB-7383](https://issues.apache.org/jira/browse/CB-7383) depend on a newer version of cordova-lib

### 0.22.8
* bump version to 0.22.8

### 0.22.7 (Sep 05, 2014)
* updated Release notes
* updated version to 0.22.7-dev

### 0.22.5 (Aug 29, 2014)
* [CB-7363](https://issues.apache.org/jira/browse/CB-7363) Do not insist on precise version of cordova-lib
* [CB-7362](https://issues.apache.org/jira/browse/CB-7362) Add Please run npm install from this directory code
* Remove package.json:scripts.test

### 0.22.4 (June 23, 2014)
* wp7 is dead, long live wp7

### 0.22.3 (June 12, 2014)
* Update cordova-lib dependency to 0.21.5
* [CB-6931](https://issues.apache.org/jira/browse/CB-6931): Fix licence headers in plugman
* [CB-6919](https://issues.apache.org/jira/browse/CB-6919) help should list windows8 as an available platform, and not wp7
* adding browserify option
* [CB-6814](https://issues.apache.org/jira/browse/CB-6814) Add license to CONTRIBUTING.md

### 0.22.0 (May 09, 2014)
* Update plugman cli to use cordova-lib
* Split out cordova-lib: move cordova-plugman files

### 0.21.0 (Apr 03, 2014)
* [CB-6344](https://issues.apache.org/jira/browse/CB-6344) Specify after which sibling to add config-changes in plugin.xml
* [CB-6272](https://issues.apache.org/jira/browse/CB-6272) Fix subdir bug + tests & meta fetch with a src directory
* Adding spec for Tizen platform
* src/platforms.js: Adding tizen.
* Throw an error when a <dependency> tag is missing `id` attribute.
* Added org.apache.cordova.statusbar into the registry whitelist.
* [CB-6160](https://issues.apache.org/jira/browse/CB-6160) adding plugin fails for Firefoxos.
* Fix to never remove top-level plugins that are dependencies + tests.
* Improve dependencies tests by grouping with beforeStart() Fix for dependency cycle / throw error.
* Refactoring of install & uninstall tests
* [CB-6147](https://issues.apache.org/jira/browse/CB-6147) Enable CLI and Plugman with npm shrinkwrap
* Allow --searchpath to have a delimiter
* working uninstall for projectReferences
* projectReference.uninstall has to generate the plugin_dir because it is not passed to uninstall methods
* [CB-5970](https://issues.apache.org/jira/browse/CB-5970) added type attribute 'projectReference' to <framework> element to signal addition of dependent project
* Separate out adding a dependent project from adding a .winmd reference in windows8
* wip implementing reading guid from 'framework' project
* [CB-6162](https://issues.apache.org/jira/browse/CB-6162) Show a better error message when publish fails the whitelist
* [CB-6119](https://issues.apache.org/jira/browse/CB-6119) Fix `plugman info` command printing "undefined" always
* [CB-6159](https://issues.apache.org/jira/browse/CB-6159) Fix incorrect "success" message when publishing fails.

### 0.20.2 (Mar 3, 2014)
* [CB-6151](https://issues.apache.org/jira/browse/CB-6151) Fix exception when adding a new platform to a CLI project

### 0.20.1 (Feb 28, 2014)
* [CB-6124](https://issues.apache.org/jira/browse/CB-6124) Make `cordova plugin remove` resilient to a missing plugin directory
* [CB-6028](https://issues.apache.org/jira/browse/CB-6028) Protect against cyclic dependencies in install
* [CB-6128](https://issues.apache.org/jira/browse/CB-6128) Treat windows c: absolute paths like file:
* [CB-6123](https://issues.apache.org/jira/browse/CB-6123) Fix crash in handleUninstall introduces by recent action-stack refactoring
* [CB-6122](https://issues.apache.org/jira/browse/CB-6122) Fix exception on uninstall due to incorrect require() path.

### 0.20.0 (Feb 26, 2014) <-- Never released on npm due to [CB-6123](https://issues.apache.org/jira/browse/CB-6123)
* [CB-4886](https://issues.apache.org/jira/browse/CB-4886) Added "plugman create" command
* [CB-5885](https://issues.apache.org/jira/browse/CB-5885) Speed-up adding multiple plugins with plugman
* [CB-5647](https://issues.apache.org/jira/browse/CB-5647) Move <assets> copying from install to prepare
* [CB-5804](https://issues.apache.org/jira/browse/CB-5804) Include platform tag information when publishing plugins
* [CB-6076](https://issues.apache.org/jira/browse/CB-6076) Logging tweaks to be less verbose.
* [CB-6088](https://issues.apache.org/jira/browse/CB-6088) FFOS: Look for config.xml in www_dir and in project_dir
* Win8/WP: Added SDKReference support via 'lib-file' tags
* Win8/WP: Remove ability to add .dll as content - it should be a framework/reference
* Win8/WP: Added ability to add+remove ref to .winmd files
* [CB-6025](https://issues.apache.org/jira/browse/CB-6025) iOS: Do not add static libraries (.a) to source files
* [CB-5017](https://issues.apache.org/jira/browse/CB-5017) Accept proxy config for plugman
* [CB-5720](https://issues.apache.org/jira/browse/CB-5720) Add resource-file support on Android
* config-changes.js: Major refactor & introduced reapply_global_munge().

## 0.19.0 (Jan 30, 2014)
* [CB-5804](https://issues.apache.org/jira/browse/CB-5804) Added repo & issue information into `plugman publish`
* [CB-5299](https://issues.apache.org/jira/browse/CB-5299) Cache pbxproj to avoid re-parsing it for each plugin.
* Update node-xcode dependency to 0.6.6

## 0.18.0 (Jan 15, 2014)
* [CB-5770](https://issues.apache.org/jira/browse/CB-5770) plugman prepare.js script content wrapping no longer allows ending parens/braces to be commented out from end of line comment
* [CB-4871](https://issues.apache.org/jira/browse/CB-4871) Reduced package size significantly.
* [CB-5720](https://issues.apache.org/jira/browse/CB-5720) Allow <resource-file> on Android
* [CB-5006](https://issues.apache.org/jira/browse/CB-5006) Add --searchpath option for local plugin search path
* [CB-5701](https://issues.apache.org/jira/browse/CB-5701) Reference custom frameworks using relative paths
* [CB-5495](https://issues.apache.org/jira/browse/CB-5495), CB=5568 Fix config.xml path for ios

## 0.17.0 (Dec 11, 2013)
* [CB-5579](https://issues.apache.org/jira/browse/CB-5579) Add support for --www param for install, uninstall, prepare commands.

## 0.16.0 (Dec 5, 2013)
* Added amazon-fireos platform.
* Added ubuntu platform
* [CB-5034](https://issues.apache.org/jira/browse/CB-5034) Document registry functions in plugman
* [CB-5584](https://issues.apache.org/jira/browse/CB-5584) Fix git clone of not working on windows.
* [CB-5238](https://issues.apache.org/jira/browse/CB-5238) Add support for <framework src="..." custom="true" />
* [CB-5367](https://issues.apache.org/jira/browse/CB-5367) Reject non-whitelisted org.apache.cordova plugins
* Write plugin metadata (ID and version) into cordova_plugins.js

## 0.15.0 (Nov 8, 2013)
* [CB-4994](https://issues.apache.org/jira/browse/CB-4994) Update xcode dependency to parse Xcode 5 capabilities.
* [CB-5091](https://issues.apache.org/jira/browse/CB-5091) Use cwd option rather than shell.cd when cloning plugin repos
* [CB-4872](https://issues.apache.org/jira/browse/CB-4872) Updated default engine names to include windows scripts

## 0.14.0 (Oct 28, 2013)

* [CB-5192](https://issues.apache.org/jira/browse/CB-5192) Plugman engine check fails on Windows
* [CB-5184](https://issues.apache.org/jira/browse/CB-5184) Fix uninstall logic being too aggressive
* [CB-4872](https://issues.apache.org/jira/browse/CB-4872) - updated default plugin to include new bb10 script
* [CB-4872](https://issues.apache.org/jira/browse/CB-4872) - took out custom version compare and went back to semver
* Overhaul dependency uninstallation
* [CB-4872](https://issues.apache.org/jira/browse/CB-4872) - adding in custom semver check for project
* [CB-4872](https://issues.apache.org/jira/browse/CB-4872) - updated paths to version files
* Update action-stack to avoid static platform detection + test if parseProjectFile is present instead
* Update spec to match new ios parse method name
* Update references to old ios parse method
* Rename parse method and add a write method to result + parseIOSProjectFiles --> parseProjectFile +
* updating README.rd doc
* [CB-5065](https://issues.apache.org/jira/browse/CB-5065) remove breaking parameter
* increased version to 0.14.0 to reflect that it is newer than published version on npm
* Correctly tell plugman which object in config to remove
* [CB-5012]: No whitespace in empty plist string nodes.
* [CB-4983](https://issues.apache.org/jira/browse/CB-4983) plugin name check
* [windows8][CB-4943] .appxmanifest should be treated like .xml, not like a plist-xml
* [CB-4809]: Check that dependencies' IDs match the <dependency> tags
* [CB-4877]: Add --silent flag and basic logging.
* Removed extra comma
* Refactor to use Q.js promises in place of callbacks everywhere.
* [CB-4837]: Version 0.12.0. Release notes updated.
* Rename CHANGELOG.md -> RELEASENOTES.md
* [CB-4492](https://issues.apache.org/jira/browse/CB-4492) tracking which of cli or plugman is used to fetch from registry
* removed unnecessary console.logs
* add full ff support to plugman
* add firefoxos
* removed unnecessary console.logs
* add full ff support to plugman
* add firefoxos
* Fix tests broken by lazy module requiring.
* [CB-4786](https://issues.apache.org/jira/browse/CB-4786) adding documentation
* [CB-4793](https://issues.apache.org/jira/browse/CB-4793) Lazily require modules in plugin.js
* [CB-4786](https://issues.apache.org/jira/browse/CB-4786) adding owner and checking in some spec requirements
* [CB-4770](https://issues.apache.org/jira/browse/CB-4770) dependent plugins can be fetched from registry
* Updated version to 0.11.1-dev

## 0.12.0

### Features

- Firefox OS support.
- Speed improvements (many commands ~350ms faster)
- Dependencies can now be fetched from the plugin repository.

## 0.11.0

### Features

- Windows phone support
- Track download counts from the plugin registry [CB-4492](https://issues.apache.org/jira/browse/CB-4492)
- Plugin URLs can now be specified with a hash giving a git ref and subdirectory, as in `https://github.com/foo/bar.git#gitref:sub/dir`. Both parts are optional: `.../bar.git#gitref` and `.../bar.git#:sub/dir` both work. [CB-4622](https://issues.apache.org/jira/browse/CB-4622)
- Engine data is now stored in the registry, and Plugman will not install plugins your Cordova version cannot support. [CB-4494](https://issues.apache.org/jira/browse/CB-4494)
- `<lib-file>` tags are now allowed on Android. [CB-4430](https://issues.apache.org/jira/browse/CB-4430)

### Bugfixes

- `plugin rm` now doesn't choke when a file is already deleted
- Fixed some trouble with filesystem paths vs. web paths; improves Windows host support.
- Projects beginning with `x`, `y`, and `z` now work. [CB-4502](https://issues.apache.org/jira/browse/CB-4502)

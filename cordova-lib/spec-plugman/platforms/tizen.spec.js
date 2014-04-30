/*
 *
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
var tizen = require('../../src/platforms/tizen'),
	common = require('../../src/platforms/common'),
	temp = require('temp'),
	os = require('osenv'),
	fs = require('fs'),
	et = require('elementtree'),
	path = require('path'),
	tizen_project = path.join(__dirname, '..', 'projects', 'tizen'),
	destination = temp.path(),
	shell = require('shelljs'),
	dummyPluginPath = path.join(__dirname, '..', 'plugins', 'DummyPlugin'),
	dummyPlugin = et.XML(fs.readFileSync(
		path.join(dummyPluginPath, 'plugin.xml'), {encoding: "utf-8"})),
	dummySources = dummyPlugin
		.find('./platform[@name="tizen"]')
		.findall('./source-file');

describe('Tizen project handler', function() {
	describe('www_dir method', function() {
		it('should append www to the directory passed in', function() {
			expect(tizen.www_dir(path.sep)).toEqual(path.join(path.sep, 'www'));
		});
	});
	describe('Manipulating project files', function() {
		beforeEach(function() {
			shell.cp('-rf', path.join(tizen_project, '*'), destination);
		});
		afterEach(function() {
			shell.rm('-rf', destination);
		});
		describe('package_name method', function() {
			it('should return the id of the config.xml root element', function() {
				expect(tizen.package_name(destination)).toEqual("TizenTestPackage");
			});
		});
	});
});

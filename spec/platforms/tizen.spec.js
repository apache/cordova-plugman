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
	os = require('osenv'),
	fs = require('fs'),
	et = require('elementtree'),
	path = require('path'),
	shell = require('shelljs'),
	temp = path.join( os.tmpdir(), 'plugman-' + ((function() {
		var index, subIndex,
			set = 'abcdefghijklmnopqrstuvwxyz0123456789',
			str = '';

		for ( index = 0 ; index < 12 ; index++ ) {
			subIndex = Math.round( Math.random() * ( set.length - 1 ) );
			str += set.substring( subIndex, subIndex + 1 );
		}

		return str;
	})() )),
	tizen_project = path.join(__dirname, '..', 'projects', 'tizen');

describe('Tizen project handler', function() {
	describe('www_dir method', function() {
		it('should append www to the directory passed in', function() {
			expect(tizen.www_dir(path.sep)).toEqual(path.join(path.sep, 'www'));
		});
	});
	describe('Manipulating project files', function() {
		describe('package_name method', function() {
			it('should return the id of the config.xml root element', function() {
				expect(tizen.package_name(tizen_project)).toEqual("TizenTestPackage");
			});
		});
	});
});

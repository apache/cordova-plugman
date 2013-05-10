#!/usr/bin/env node
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

var http   = require('http'),
    osenv  = require('osenv'),
    path   = require('path'),
    fs     = require('fs'),
    temp   = path.join(osenv.tmpdir(), 'plugman'),
    shell  = require('shelljs'),
    plugins = require('../../src/util/plugins'),
    xml_helpers = require('../../src/util/xml-helpers');

describe('plugins utility module', function(){
    describe('clonePluginGitRepo', function(){
        it('should shell out to git clone with correct arguments', function(){
            var mySpy = spyOn(shell, 'exec');
            var plugin_git_url = 'https://github.com/imhotep/ChildBrowser'
            
            plugins.clonePluginGitRepo(plugin_git_url, temp, '.');
            
            expect(mySpy).toHaveBeenCalled();
            var git_clone_regex = new RegExp('^git clone "' + plugin_git_url + '" ".*"$', 'gi');
            expect(mySpy.mostRecentCall.args[0]).toMatch(git_clone_regex);
        });
        it('should take into account subdirectory argument when copying over final repository into plugins+plugin_id directory', function() {
            var exec_spy = spyOn(shell, 'exec');
            var cp_spy = spyOn(shell, 'cp');
            var fake_id = 'VillageDrunkard';
            var xml_spy = spyOn(xml_helpers, 'parseElementtreeSync').andReturn({
                getroot:function() {
                    return {
                        attrib:{id:fake_id}
                    };
                }
            });
            var plugin_git_url = 'https://github.com/imhotep/ChildBrowser'
            
            var fake_subdir = 'TheBrainRecoilsInHorror';
            plugins.clonePluginGitRepo(plugin_git_url, temp, fake_subdir);
            exec_spy.mostRecentCall.args[2](0); // fake out shell.exec finishing appropriately (so we dont ACTUALLY shell out to git-clone, assume it worked fine)
            var expected_subdir_cp_path = new RegExp(fake_subdir + '[\\\\\\/]\\*$', 'gi');
            expect(cp_spy.mostRecentCall.args[1]).toMatch(expected_subdir_cp_path);
            expect(cp_spy.mostRecentCall.args[2]).toEqual(path.join(temp, fake_id));
        });
    });
});

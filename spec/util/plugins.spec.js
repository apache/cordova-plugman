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
    child_process = require('child_process'),
    plugins = require('../../src/util/plugins'),
    events = require('../../src/events'),
    xml_helpers = require('../../src/util/xml-helpers');

describe('plugins utility module', function(){
    describe('clonePluginGitRepo', function(){
        var fake_id = 'VillageDrunkard';
        var execSpy, cp_spy, xml_spy, done;
        beforeEach(function() {
            execSpy = spyOn(child_process, 'exec').andCallFake(function(cmd, opts, cb) {
                if (!cb) cb = opts;
                cb(null, 'git output');
            });
            spyOn(shell, 'which').andReturn(true);
            xml_spy = spyOn(xml_helpers, 'parseElementtreeSync').andReturn({
                getroot:function() {
                    return {
                        attrib:{id:fake_id}
                    };
                }
            });
            done = false;
        });
        it('should shell out to git clone with correct arguments', function(){
            var plugin_git_url = 'https://github.com/imhotep/ChildBrowser';
            var emit = spyOn(events, 'emit');

            runs(function() {
                plugins.clonePluginGitRepo(plugin_git_url, temp, '.', undefined)
                .then(function(val) { done = val; }, function(err) { done = err; });
            });
            waitsFor(function() { return done; }, 'promise never resolved', 500);
            runs(function() {
                expect(execSpy).toHaveBeenCalled();
                var git_clone_regex = new RegExp('^git clone "' + plugin_git_url + '" ".*"$', 'gi');
                expect(execSpy.mostRecentCall.args[0]).toMatch(git_clone_regex);

                /* 
                [ [ 'verbose',
                    'Fetching plugin via git-clone command: git clone "https://github.com/imhotep/ChildBrowser" "..."' ],
                  [ 'verbose',
                    'Plugin "https://github.com/imhotep/ChildBrowser" fetched.' ],
                  [ 'verbose',
                    'Plugin "VillageDrunkard" fetched into ...' ] ]
                */

                // Creates subdir within temp directory
                expect(done.substr(0, temp.length)).toEqual(temp);

                // Expect plugin fetched message
                expect(emit.mostRecentCall.args[1]).toMatch(new RegExp('Plugin "'+ fake_id + '" fetched'));
            });
        });
        it('should take into account subdirectory argument when copying over final repository into plugins+plugin_id directory', function() {
            var plugin_git_url = 'https://github.com/imhotep/ChildBrowser';
            var fake_subdir = 'TheBrainRecoilsInHorror';
            var emit = spyOn(events, 'emit');
            
            runs(function() {
                plugins.clonePluginGitRepo(plugin_git_url, temp, fake_subdir)
                .then(function(val) { done = val || true; }, function(err) { done = err; });
            });
            waitsFor(function() { return done; }, 'promise never resolved', 500);
            runs(function() {
                var paths = done.split(path.sep);

                expect(paths.slice(-1)).toEqual(["TheBrainRecoilsInHorror"]);
            });
        });
    });
});

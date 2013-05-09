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
    plugins = require('../../src/util/plugins');

describe('plugins', function(){
    describe('server', function(){
        it('should be able to receive the correct git clone arguments', function(){
            var mySpy = spyOn(plugins, 'clonePluginGitRepo');
            var plugin_git_url = 'https://github.com/imhotep/ChildBrowser'
            var myFunction = function(){};
            
            plugins.clonePluginGitRepo(plugin_git_url, temp, '.', myFunction);
            
             expect(mySpy).toHaveBeenCalled();
             expect(mySpy).toHaveBeenCalledWith(plugin_git_url, temp, '.', myFunction);
        });
    });
});




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
        it('should be able to retrieve information for an existing plugin', function(done){
            plugins.getPluginInfo('ChildBrowser', function(error, plugin) {  
                expect(error).toBe(null);
                expect(plugin).not.toBe(null);
                expect(plugin.url).toBe('https://github.com/imhotep/ChildBrowser');
                expect(plugin.name).toBe('ChildBrowser');
                expect(plugin.description).toBe('ChildBrowser plugin');
                done();
            });
        });
        
        it('should error if searching for a non-existant plugin', function(done){
            plugins.getPluginInfo('MEAT_POPSICLE', function(error, plugin) { 
                expect(error).not.toBe(null);
                expect(error).toBe('Could not find information on MEAT_POPSICLE plugin');
                done();
            });        
        });
        
        it('should list all plugins', function(done){
            plugins.listAllPlugins(function(plugin){
                expect(plugin).not.toBe(null);
                expect(plugin.length).toBeGreaterThan(0);
                done();
            });
        });
        
        it('should be able to clone to local from url', function(done){
            plugins.getPluginInfo('ChildBrowser', function(error, plugin) {  
                shell.mkdir('-p', temp);
                plugins.clonePluginGitRepo(plugin.url, temp, function(error){
                    expect(error).toBe(null);
                    done();
                });       
                shell.rm('-rf', temp);
            });
        });
        
        it('should error if cloning a non-existant plugin', function(done){
            shell.mkdir('-p', temp);
            plugins.clonePluginGitRepo('MEAT_POPSICLE', temp, function(error){
                expect(error).not.toBe(null);
                done();      
            });
            shell.rm('-rf', temp);
        });       
    });
});




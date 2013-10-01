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

var version_compare = require('../../src/util/version-compare');
describe('version-compare', function(){
    describe('=', function() {
        it('should satisfy', function(){
            expect(version_compare.satisfies('0','0')).toBe(true);
            expect(version_compare.satisfies('0.0','0.0')).toBe(true);
            expect(version_compare.satisfies('0.0.0','0.0.0')).toBe(true);
            expect(version_compare.satisfies('0','1')).toBe(false);
            expect(version_compare.satisfies('0.0','0.1')).toBe(false);
            expect(version_compare.satisfies('0.0.0','0.0.1')).toBe(false);
        });
        
    });
    describe('<', function() {
        it('should satisfy', function(){
            expect(version_compare.satisfies('0','<1')).toBe(true);
            expect(version_compare.satisfies('0','<0')).toBe(false);
            expect(version_compare.satisfies('1','<0')).toBe(false);
            
            expect(version_compare.satisfies('0.0','<1.0')).toBe(true);
            expect(version_compare.satisfies('0.1','<1.0')).toBe(true);
            expect(version_compare.satisfies('0.1','<0.1')).toBe(false);
            expect(version_compare.satisfies('0.0','<0.1')).toBe(true);
            expect(version_compare.satisfies('0.0','<0.0')).toBe(false);
            expect(version_compare.satisfies('1.0','<1.0')).toBe(false);
            expect(version_compare.satisfies('1.1','<1.0')).toBe(false);
            expect(version_compare.satisfies('1.1','<0.1')).toBe(false);
            expect(version_compare.satisfies('1.0','<0.1')).toBe(false);
            expect(version_compare.satisfies('1.0','<0.0')).toBe(false);
                       
            expect(version_compare.satisfies('0.0.0','<1.0.0')).toBe(true);  
            expect(version_compare.satisfies('0.1.0','<1.0.0')).toBe(true); 
            expect(version_compare.satisfies('0.0.1','<1.0.0')).toBe(true); 
            expect(version_compare.satisfies('0.1.1','<1.0.0')).toBe(true); 
            expect(version_compare.satisfies('0.0.0','<0.1.0')).toBe(true);
            expect(version_compare.satisfies('0.0.1','<0.1.0')).toBe(true);
            expect(version_compare.satisfies('0.1.0','<0.2.0')).toBe(true); 
            expect(version_compare.satisfies('0.0.0','<0.0.1')).toBe(true);            
            expect(version_compare.satisfies('0.0.0','<0.0.0')).toBe(false); 
            expect(version_compare.satisfies('1.0.0','<1.0.1')).toBe(true);  
            expect(version_compare.satisfies('1.1.0','<1.0.1')).toBe(false); 
            expect(version_compare.satisfies('1.0.1','<1.1.0')).toBe(true); 
            expect(version_compare.satisfies('1.1.1','<1.0.0')).toBe(false); 
            expect(version_compare.satisfies('1.0.0','<0.1.0')).toBe(false);
            expect(version_compare.satisfies('1.0.1','<0.1.0')).toBe(false);
            expect(version_compare.satisfies('1.1.0','<0.2.0')).toBe(false); 
            expect(version_compare.satisfies('1.0.0','<0.0.1')).toBe(false);            
            expect(version_compare.satisfies('1.0.0','<0.0.0')).toBe(false); 
        });
    });
    describe('<=', function() {
        it('should satisfy', function(){
            expect(version_compare.satisfies('0','<=1')).toBe(true);
            expect(version_compare.satisfies('0','<=0')).toBe(true);
            expect(version_compare.satisfies('1','<=0')).toBe(false);
            
            expect(version_compare.satisfies('0.0','<=1.0')).toBe(true);
            expect(version_compare.satisfies('0.1','<=1.0')).toBe(true);
            expect(version_compare.satisfies('0.1','<=0.1')).toBe(true);
            expect(version_compare.satisfies('0.0','<=0.1')).toBe(true);
            expect(version_compare.satisfies('0.0','<=0.0')).toBe(true);
            expect(version_compare.satisfies('1.0','<=1.0')).toBe(true);
            expect(version_compare.satisfies('1.1','<=1.0')).toBe(false);
            expect(version_compare.satisfies('1.1','<=0.1')).toBe(false);
            expect(version_compare.satisfies('1.0','<=0.1')).toBe(false);
            expect(version_compare.satisfies('1.0','<=0.0')).toBe(false);
                       
            expect(version_compare.satisfies('0.0.0','<=1.0.0')).toBe(true);  
            expect(version_compare.satisfies('0.1.0','<=1.0.0')).toBe(true); 
            expect(version_compare.satisfies('0.0.1','<=1.0.0')).toBe(true); 
            expect(version_compare.satisfies('0.1.1','<=1.0.0')).toBe(true); 
            expect(version_compare.satisfies('0.0.0','<=0.1.0')).toBe(true);
            expect(version_compare.satisfies('0.0.1','<=0.1.0')).toBe(true);
            expect(version_compare.satisfies('0.1.0','<=0.2.0')).toBe(true); 
            expect(version_compare.satisfies('0.0.0','<=0.0.1')).toBe(true);            
            expect(version_compare.satisfies('0.0.0','<=0.0.0')).toBe(true); 
            expect(version_compare.satisfies('1.0.0','<=1.0.1')).toBe(true);  
            expect(version_compare.satisfies('1.1.0','<=1.0.1')).toBe(false); 
            expect(version_compare.satisfies('1.0.1','<=1.1.0')).toBe(true); 
            expect(version_compare.satisfies('1.1.1','<=1.0.0')).toBe(false); 
            expect(version_compare.satisfies('1.0.0','<=0.1.0')).toBe(false);
            expect(version_compare.satisfies('1.0.1','<=0.1.0')).toBe(false);
            expect(version_compare.satisfies('1.1.0','<=0.2.0')).toBe(false); 
            expect(version_compare.satisfies('1.0.0','<=0.0.1')).toBe(false);            
            expect(version_compare.satisfies('1.0.0','<=0.0.0')).toBe(false);             
        });
    });

    describe('>', function() {
        it('should satisfy', function(){
            expect(version_compare.satisfies('0','>1')).toBe(false);
            expect(version_compare.satisfies('0','>0')).toBe(false);
            expect(version_compare.satisfies('1','>0')).toBe(true);
            
            expect(version_compare.satisfies('0.0','>1.0')).toBe(false);
            expect(version_compare.satisfies('0.1','>1.0')).toBe(false);
            expect(version_compare.satisfies('0.1','>0.1')).toBe(false);
            expect(version_compare.satisfies('0.0','>0.1')).toBe(false);
            expect(version_compare.satisfies('0.0','>0.0')).toBe(false);
            expect(version_compare.satisfies('1.0','>1.0')).toBe(false);
            expect(version_compare.satisfies('1.1','>1.0')).toBe(true);
            expect(version_compare.satisfies('1.1','>0.1')).toBe(true);
            expect(version_compare.satisfies('1.0','>0.1')).toBe(true);
            expect(version_compare.satisfies('1.0','>0.0')).toBe(true);
                       
            expect(version_compare.satisfies('0.0.0','>1.0.0')).toBe(false);  
            expect(version_compare.satisfies('0.1.0','>1.0.0')).toBe(false); 
            expect(version_compare.satisfies('0.0.1','>1.0.0')).toBe(false); 
            expect(version_compare.satisfies('0.1.1','>1.0.0')).toBe(false); 
            expect(version_compare.satisfies('0.0.0','>0.1.0')).toBe(false);
            expect(version_compare.satisfies('0.0.1','>0.1.0')).toBe(false);
            expect(version_compare.satisfies('0.1.0','>0.2.0')).toBe(false); 
            expect(version_compare.satisfies('0.0.0','>0.0.1')).toBe(false);            
            expect(version_compare.satisfies('0.0.0','>0.0.0')).toBe(false); 
            expect(version_compare.satisfies('1.0.0','>1.0.1')).toBe(false);  
            expect(version_compare.satisfies('1.1.0','>1.0.1')).toBe(true); 
            expect(version_compare.satisfies('1.0.1','>1.1.0')).toBe(false); 
            expect(version_compare.satisfies('1.1.1','>1.0.0')).toBe(true); 
            expect(version_compare.satisfies('1.0.0','>0.1.0')).toBe(true);
            expect(version_compare.satisfies('1.0.1','>0.1.0')).toBe(true);
            expect(version_compare.satisfies('1.1.0','>0.2.0')).toBe(true); 
            expect(version_compare.satisfies('1.0.0','>0.0.1')).toBe(true);            
            expect(version_compare.satisfies('1.0.0','>0.0.0')).toBe(true);             
        });
    });
    describe('>=', function() {
        it('should satisfy', function(){
            expect(version_compare.satisfies('0','>=1')).toBe(false);
            expect(version_compare.satisfies('0','>=0')).toBe(true);
            expect(version_compare.satisfies('1','>=0')).toBe(true);
            
            expect(version_compare.satisfies('0.0','>=1.0')).toBe(false);
            expect(version_compare.satisfies('0.1','>=1.0')).toBe(false);
            expect(version_compare.satisfies('0.1','>=0.1')).toBe(true);
            expect(version_compare.satisfies('0.0','>=0.1')).toBe(false);
            expect(version_compare.satisfies('0.0','>=0.0')).toBe(true);
            expect(version_compare.satisfies('1.0','>=1.0')).toBe(true);
            expect(version_compare.satisfies('1.1','>=1.0')).toBe(true);
            expect(version_compare.satisfies('1.1','>=0.1')).toBe(true);
            expect(version_compare.satisfies('1.0','>=0.1')).toBe(true);
            expect(version_compare.satisfies('1.0','>=0.0')).toBe(true);
                       
            expect(version_compare.satisfies('0.0.0','>=1.0.0')).toBe(false);  
            expect(version_compare.satisfies('0.1.0','>=1.0.0')).toBe(false); 
            expect(version_compare.satisfies('0.0.1','>=1.0.0')).toBe(false); 
            expect(version_compare.satisfies('0.1.1','>=1.0.0')).toBe(false); 
            expect(version_compare.satisfies('0.0.0','>=0.1.0')).toBe(false);
            expect(version_compare.satisfies('0.0.1','>=0.1.0')).toBe(false);
            expect(version_compare.satisfies('0.1.0','>=0.2.0')).toBe(false); 
            expect(version_compare.satisfies('0.0.0','>=0.0.1')).toBe(false);            
            expect(version_compare.satisfies('0.0.0','>=0.0.0')).toBe(true); 
            expect(version_compare.satisfies('1.0.0','>=1.0.1')).toBe(false);  
            expect(version_compare.satisfies('1.1.0','>=1.0.1')).toBe(true); 
            expect(version_compare.satisfies('1.0.1','>=1.1.0')).toBe(false); 
            expect(version_compare.satisfies('1.1.1','>=1.0.0')).toBe(true); 
            expect(version_compare.satisfies('1.0.0','>=0.1.0')).toBe(true);
            expect(version_compare.satisfies('1.0.1','>=0.1.0')).toBe(true);
            expect(version_compare.satisfies('1.1.0','>=0.2.0')).toBe(true); 
            expect(version_compare.satisfies('1.0.0','>=0.0.1')).toBe(true);            
            expect(version_compare.satisfies('1.0.0','>=0.0.0')).toBe(true);             
        });
    });
    
    describe('incorrect formats', function(){
        it('should throw an error with no version string', function(){
            expect(function(){version_compare.satisfies('','')}).toThrow(new Error('No version string detected. Unable to compare to versions. Please check the output from your version script and the engine tag in your plugin.xml.'));
            expect(function(){version_compare.satisfies('1','')}).toThrow(new Error('No version string detected. Unable to compare to versions. Please check the output from your version script and the engine tag in your plugin.xml.'));
            expect(function(){version_compare.satisfies('','1')}).toThrow(new Error('No version string detected. Unable to compare to versions. Please check the output from your version script and the engine tag in your plugin.xml.'));
        });
        it('should throw an error with differing version format', function(){
            expect(function(){version_compare.satisfies('1','1.0')}).toThrow(new Error('Different version string format detected. Unable to compare to versions. Please check the output from your version script and the engine tag in your plugin.xml.'));
            expect(function(){version_compare.satisfies('1','1.0.0')}).toThrow(new Error('Different version string format detected. Unable to compare to versions. Please check the output from your version script and the engine tag in your plugin.xml.'));
        });   
        
    });
});

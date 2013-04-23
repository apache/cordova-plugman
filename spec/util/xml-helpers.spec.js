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

var path = require('path')
  , xml_helpers = require('../../src/util/xml-helpers')
  , et = require('elementtree')

  , title = et.XML('<title>HELLO</title>')
  , usesNetworkOne = et.XML('<uses-permission ' +
			'android:name="PACKAGE_NAME.permission.C2D_MESSAGE"/>')
  , usesNetworkTwo = et.XML("<uses-permission android:name=\
            \"PACKAGE_NAME.permission.C2D_MESSAGE\" />")
  , usesReceive = et.XML("<uses-permission android:name=\
            \"com.google.android.c2dm.permission.RECEIVE\"/>")
  , helloTagOne = et.XML("<h1>HELLO</h1>")
  , goodbyeTag = et.XML("<h1>GOODBYE</h1>")
  , helloTagTwo = et.XML("<h1>  HELLO  </h1>");

describe('xml-helpers', function(){
    it('should return false for different tags', function(){
        expect(xml_helpers.equalNodes(usesNetworkOne, title)).toBe(false);
    });

    it('should return true for identical tags', function(){
        expect(xml_helpers.equalNodes(usesNetworkOne, usesNetworkTwo)).toBe(true);
    });   
    
    it('should return false for different attributes', function(){
        expect(xml_helpers.equalNodes(usesNetworkOne, usesReceive)).toBe(false);
    });  
    
    it('should distinguish between text', function(){
        expect(xml_helpers.equalNodes(helloTagOne, goodbyeTag)).toBe(false);
    });  
    
    it('should ignore whitespace in text', function(){
        expect(xml_helpers.equalNodes(helloTagOne, helloTagTwo)).toBe(true);
    });    
    
    describe('should compare children', function(){
        it('by child quantity', function(){
            var one = et.XML('<i><b>o</b></i>'),
                two = et.XML('<i><b>o</b><u></u></i>');
    
            expect(xml_helpers.equalNodes(one, two)).toBe(false);        
        });
        
        it('by child equality', function(){
            var one = et.XML('<i><b>o</b></i>'),
                two = et.XML('<i><u></u></i>'),
                uno = et.XML('<i>\n<b>o</b>\n</i>');
    
            expect(xml_helpers.equalNodes(one, uno)).toBe(true); 
            expect(xml_helpers.equalNodes(one, two)).toBe(false);       
        });
    }); 
});

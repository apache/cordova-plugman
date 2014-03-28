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
    describe('equalNodes', function() {
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
    describe('pruneXML', function() {
        var config_xml;

        beforeEach(function() {
            config_xml = xml_helpers.parseElementtreeSync(path.join(__dirname, '..', 'projects', 'android_two', 'res', 'xml', 'config.xml'));
        });

        it('should remove any children that match the specified selector', function() {
            var children = config_xml.findall('plugins/plugin');
            xml_helpers.pruneXML(config_xml, children, 'plugins');
            expect(config_xml.find('plugins').getchildren().length).toEqual(0);
        });
        it('should do nothing if the children cannot be found', function() {
            var children = [title];
            xml_helpers.pruneXML(config_xml, children, 'plugins');
            expect(config_xml.find('plugins').getchildren().length).toEqual(17);
        });
        it('should be able to handle absolute selectors', function() {
            var children = config_xml.findall('plugins/plugin');
            xml_helpers.pruneXML(config_xml, children, '/cordova/plugins');
            expect(config_xml.find('plugins').getchildren().length).toEqual(0);
        });
        it('should be able to handle absolute selectors with wildcards', function() {
            var children = config_xml.findall('plugins/plugin');
            xml_helpers.pruneXML(config_xml, children, '/*/plugins');
            expect(config_xml.find('plugins').getchildren().length).toEqual(0);
        });
    });

    describe('graftXML', function() {
        var config_xml, plugin_xml;

        beforeEach(function() {
            config_xml = xml_helpers.parseElementtreeSync(path.join(__dirname, '..', 'projects', 'android_two', 'res', 'xml', 'config.xml'));
            plugin_xml = xml_helpers.parseElementtreeSync(path.join(__dirname, '..', 'plugins', 'ChildBrowser', 'plugin.xml'));
        });

        it('should add children to the specified selector', function() {
            var children = plugin_xml.find('config-file').getchildren();
            xml_helpers.graftXML(config_xml, children, 'plugins');
            expect(config_xml.find('plugins').getchildren().length).toEqual(19);
        });
        it('should be able to handle absolute selectors', function() {
            var children = plugin_xml.find('config-file').getchildren();
            xml_helpers.graftXML(config_xml, children, '/cordova');
            expect(config_xml.findall('access').length).toEqual(3);
        });
        it('should be able to handle absolute selectors with wildcards', function() {
            var children = plugin_xml.find('config-file').getchildren();
            xml_helpers.graftXML(config_xml, children, '/*');
            expect(config_xml.findall('access').length).toEqual(3);
        });

        it('for simple XPath paths, the parent should be created if not present', function () {
            var doc = new et.ElementTree(et.XML('<widget>')),
                children = [et.XML('<rim:permits> super_awesome_permission </rim:permits>')],
                selector= "/widget/rim:permissions";
            expect(xml_helpers.graftXML(doc, children, selector)).toBe(true);
            expect(et.tostring(doc.getroot())).toContain("<rim:permissions><rim:permits> super_awesome_permission </rim:permits></rim:permissions>");
        });

        it('returns false for more complicated selectors', function () {
            var doc = new et.ElementTree(et.XML('<widget>')),
                children = [et.XML('<rim:permits> super_awesome_permission </rim:permits>')],
                selector= "/bookstore/book[price>35]/title";
            expect(xml_helpers.graftXML(doc, children, selector)).toBe(false);
        });

        it('appends children after the specified sibling', function () {
            var doc = new et.ElementTree(et.XML('<widget><A/><B/><C/></widget>')),
                children = [et.XML('<B id="new"/>'), et.XML('<B id="new2"/>')],
                selector= "/widget",
                after= "B;A";
            expect(xml_helpers.graftXML(doc, children, selector, after)).toBe(true);
            expect(et.tostring(doc.getroot())).toContain('<B /><B id="new" /><B id="new2" />');
        });

        it('appends children after the 2nd priority sibling if the 1st one is missing', function () {
            var doc = new et.ElementTree(et.XML('<widget><A/><C/></widget>')),
                children = [et.XML('<B id="new"/>'), et.XML('<B id="new2"/>')],
                selector= "/widget",
                after= "B;A";
            expect(xml_helpers.graftXML(doc, children, selector, after)).toBe(true);
            expect(et.tostring(doc.getroot())).toContain('<A /><B id="new" /><B id="new2" />');
        });

        it('inserts children at the beginning if specified sibling is missing', function () {
            var doc = new et.ElementTree(et.XML('<widget><B/><C/></widget>')),
                children = [et.XML('<A id="new"/>'), et.XML('<A id="new2"/>')],
                selector= "/widget",
                after= "A";
            expect(xml_helpers.graftXML(doc, children, selector, after)).toBe(true);
            expect(et.tostring(doc.getroot())).toContain('<widget><A id="new" /><A id="new2" />');
        });
    });
});

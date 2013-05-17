var csproj = require('../../src/util/csproj'),
    path = require('path');

var wp7_project = path.join(__dirname, '..', 'projects', 'wp7'),
    example_csproj = path.join(wp7_project, 'CordovaAppProj.csproj');

describe('csproj', function() {
    it('should throw if passed in an invalid xml file path ref', function() {
        expect(function() {
            new csproj('blahblah');
        }).toThrow();
    });
    it('should successfully parse a valid csproj file into an xml document', function() {
        var doc;
        expect(function() {
            doc = new csproj(example_csproj);
        }).not.toThrow();
        expect(doc.xml.getroot()).toBeDefined();
    });

    describe('write method', function() {
        
    });
});

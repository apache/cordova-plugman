var PEG = require('pegjs'),
    fs = require('fs'),
    pbx = fs.readFileSync('test/parser/projects/build-config.pbxproj', 'utf-8'),
    grammar = fs.readFileSync('lib/parser/pbxproj.pegjs', 'utf-8'),
    parser = PEG.buildParser(grammar),
    rawProj = parser.parse(pbx),
    project = rawProj.project;

exports['should parse the build config section'] = function (test) {
    // if it gets this far it's worked
    test.done();
}

exports['should read a decimal value correctly'] = function (test) {
    var xcbConfig = project.objects['XCBuildConfiguration'],
        debugSettings = xcbConfig['1D6058950D05DD3E006BFB54'].buildSettings;

    test.strictEqual(debugSettings['IPHONEOS_DEPLOYMENT_TARGET'], '3.0');
    test.done();
}

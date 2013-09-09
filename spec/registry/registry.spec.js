var registry = require('../../src/registry/registry'),
    manifest = require('../../src/registry/manifest'),
    fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    npm = require('npm');

describe('registry', function() {
    describe('manifest', function() {
        var pluginDir, packageJson;
        beforeEach(function() {
            pluginDir = __dirname + '/../plugins/EnginePlugin';
            packageJson = path.resolve(pluginDir, 'package.json');
        });
        afterEach(function() {
            fs.unlink(packageJson);
            
        });
        it('should generate a package.json from a plugin.xml', function() {
            manifest.generatePackageJsonFromPluginXml(pluginDir);
            expect(fs.existsSync(packageJson));
            expect(JSON.parse(fs.readFileSync(packageJson)).name).toEqual('com.cordova.engine');
            expect(JSON.parse(fs.readFileSync(packageJson)).version).toEqual('1.0.0');
            expect(JSON.parse(fs.readFileSync(packageJson)).engines).toEqual(
                [ { name : 'cordova', version : '>=2.3.0' }, { name : 'cordova-plugman', version : '>=0.10.0' }, { name : 'mega-fun-plugin', version : '>=1.0.0' }, { name : 'mega-boring-plugin', version : '>=3.0.0' } ]
            );
        });
    });
    describe('actions', function() {
        var done, fakeLoad, fakeNPMCommands;

        function registryPromise(f) {
            return f.then(function() { done = true; }, function(err) { done = err; });
        }

        beforeEach(function() {
            done = false;
            var fakeSettings = {
                cache: '/some/cache/dir',
                logstream: 'somelogstream@2313213',
                userconfig: '/some/config/dir'
            };

            var fakeNPM = function() {
                if (arguments.length > 0) {
                    var cb = arguments[arguments.length-1];
                    if (cb && typeof cb === 'function') cb(null, true);
                }
            };

            registry.settings = fakeSettings;
            fakeLoad = spyOn(npm, 'load').andCallFake(function(settings, cb) { cb(null, true); });

            fakeNPMCommands = {};
            ['config', 'adduser', 'cache', 'publish', 'unpublish', 'search'].forEach(function(cmd) {
                fakeNPMCommands[cmd] = jasmine.createSpy(cmd).andCallFake(fakeNPM);
            });

            npm.commands = fakeNPMCommands;
        });
        it('should run config', function() {
            var params = ['set', 'registry', 'http://registry.cordova.io'];
            runs(function() {
                registryPromise(registry.config(params));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 500);
            runs(function() {
                expect(done).toBe(true);
                expect(fakeLoad).toHaveBeenCalledWith(registry.settings, jasmine.any(Function));
                expect(fakeNPMCommands.config).toHaveBeenCalledWith(params, jasmine.any(Function));
            });
        });
        it('should run adduser', function() {
            runs(function() {
                registryPromise(registry.adduser(null));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 500);
            runs(function() {
                expect(done).toBe(true);
                expect(fakeLoad).toHaveBeenCalledWith(registry.settings, jasmine.any(Function));
                expect(fakeNPMCommands.adduser).toHaveBeenCalledWith(null, jasmine.any(Function));
            });
        });
        it('should run publish', function() {
            var params = [__dirname + '/../plugins/DummyPlugin'];
            var spyGenerate = spyOn(manifest, 'generatePackageJsonFromPluginXml').andReturn(Q());
            var spyUnlink = spyOn(fs, 'unlink');
            runs(function() {
                registryPromise(registry.publish(params));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 500);
            runs(function() {
                expect(done).toBe(true);
                expect(fakeLoad).toHaveBeenCalledWith(registry.settings, jasmine.any(Function));
                expect(spyGenerate).toHaveBeenCalledWith(params[0]);
                expect(fakeNPMCommands.publish).toHaveBeenCalledWith(params, jasmine.any(Function));
                expect(spyUnlink).toHaveBeenCalledWith(path.resolve(params[0], 'package.json'));
            });
        });
        it('should run unpublish', function() {
            var params = ['dummyplugin@0.6.0'];
            runs(function() {
                registryPromise(registry.unpublish(params));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 500);
            runs(function() {
                expect(done).toBe(true);
                expect(fakeLoad).toHaveBeenCalledWith(registry.settings, jasmine.any(Function));
                expect(fakeNPMCommands.unpublish).toHaveBeenCalledWith(params, jasmine.any(Function));
                expect(fakeNPMCommands.cache).toHaveBeenCalledWith(['clean'], jasmine.any(Function));
            });
        });
        it('should run search', function() {
            var params = ['dummyplugin', 'plugin'];
            runs(function() {
                registryPromise(registry.search(params));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 500);
            runs(function() {
                expect(done).toBe(true);
                expect(fakeLoad).toHaveBeenCalledWith(registry.settings, jasmine.any(Function));
                expect(fakeNPMCommands.search).toHaveBeenCalledWith(params, true, jasmine.any(Function));
            });
        });
    });
});

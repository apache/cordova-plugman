var uninstall = require('../src/uninstall'),
    install = require('../src/install'),
    actions = require('../src/util/action-stack'),
    config_changes = require('../src/util/config-changes'),
    events  = require('../src/events'),
    plugman = require('../plugman'),
    common  = require('./common'),
    fs      = require('fs'),
    path    = require('path'),
    shell   = require('shelljs'),
    Q       = require('q'),
    spec    = __dirname,
    done    = false,
    srcProject = path.join(spec, 'projects', 'android_uninstall'),
    project = path.join(spec, 'projects', 'android_uninstall.test'),
    project2 = path.join(spec, 'projects', 'android_uninstall.test2'),

    plugins_dir = path.join(spec, 'plugins'),
    plugins_install_dir = path.join(project, 'cordova', 'plugins'),
    plugins_install_dir2 = path.join(project2, 'cordova', 'plugins'),

    plugins = {
        'DummyPlugin' : path.join(plugins_dir, 'DummyPlugin'),
        'A' : path.join(plugins_dir, 'dependencies', 'A'),
        'C' : path.join(plugins_dir, 'dependencies', 'C')
    },
    promise,
    dummy_id = 'com.phonegap.plugins.dummyplugin';

function uninstallPromise(f) {
    return f.then(function() { done = true; }, function(err) { done = err; });
}

describe('start', function() {

    it('start', function() {
        shell.rm('-rf', project);
        shell.rm('-rf', project2);
        shell.cp('-R', path.join(srcProject, '*'), project);
        shell.cp('-R', path.join(srcProject, '*'), project2);

        done = false;
        promise = Q()
        .then(
            function(){ return install('android', project, plugins['DummyPlugin']) }
        ).then(
            function(){ return install('android', project, plugins['A']) }
        ).then(
            function(){ return install('android', project2, plugins['C']) }
        ).then(
            function(){ return install('android', project2, plugins['A']) }
        ).then(
            function(){ done = true; }
        );
        waitsFor(function() { return done; }, 'promise never resolved', 500);
    });
});

describe('uninstallPlatform', function() {
    var proc, prepare, actions_push, add_to_queue, c_a, rm;
    var fsWrite;

    var plat_common = require('../src/platforms/common');

    beforeEach(function() {
        proc = spyOn(actions.prototype, 'process').andReturn(Q());
        actions_push = spyOn(actions.prototype, 'push');
        c_a = spyOn(actions.prototype, 'createAction');
        prepare = spyOn(plugman, 'prepare');
        fsWrite = spyOn(fs, 'writeFileSync').andReturn(true);
        rm = spyOn(shell, 'rm').andReturn(true);
        spyOn(shell, 'cp').andReturn(true);
        add_to_queue = spyOn(config_changes, 'add_uninstalled_plugin_to_prepare_queue');
        done = false;
    });
    describe('success', function() {
        it('should call prepare after a successful uninstall', function() {
            runs(function() {
                uninstallPromise(uninstall.uninstallPlatform('android', project, dummy_id));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(prepare).toHaveBeenCalled();
            });
        });
        it('should call the config-changes module\'s add_uninstalled_plugin_to_prepare_queue method after processing an install', function() {
            runs(function() {
                uninstallPromise(uninstall.uninstallPlatform('android', project, dummy_id));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(add_to_queue).toHaveBeenCalledWith(plugins_install_dir, dummy_id, 'android', true);
            });
        });
        it('should queue up actions as appropriate for that plugin and call process on the action stack', function() {
            runs(function() {
                uninstallPromise(uninstall.uninstallPlatform('android', project, dummy_id));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(actions_push.calls.length).toEqual(5);
                expect(proc).toHaveBeenCalled();
            });
        });

        describe('with dependencies', function() {
            var emit;
            beforeEach(function() {
                emit = spyOn(events, 'emit');
            });
            it('should uninstall "dangling" dependencies', function() {
                runs(function() {
                    uninstallPromise(uninstall.uninstallPlatform('android', project, 'A'));
                });
                waitsFor(function() { return done; }, 'promise never resolved', 200);
                runs(function() {
                    expect(emit).toHaveBeenCalledWith('log', 'Uninstalling 2 dependent plugins.');
                });
            });
        });
    });

    describe('failure', function() {
        it('should throw if platform is unrecognized', function() {
            runs(function() {
                uninstallPromise( uninstall.uninstallPlatform('atari', project, 'SomePlugin') );
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(''+done).toContain('atari not supported.');
            });
        });
        it('should throw if plugin is missing', function() {
            runs(function() {
                uninstallPromise( uninstall.uninstallPlatform('android', project, 'SomePluginThatDoesntExist') );
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(''+done).toContain('Plugin "SomePluginThatDoesntExist" not found. Already uninstalled?');
            });
        });
    });
});

describe('uninstallPlugin', function() {
    var rm, fsWrite, rmstack = [], emit;

    beforeEach(function() {
        fsWrite = spyOn(fs, 'writeFileSync').andReturn(true);
        rm = spyOn(shell, 'rm').andCallFake(function(f,p) { rmstack.push(p); return true});
        rmstack = [];
        emit = spyOn(events, 'emit');
        done = false;
    });
    describe('with dependencies', function() {

        it('should delete all dependent plugins', function() {
            runs(function() {
                uninstallPromise( uninstall.uninstallPlugin('A', plugins_install_dir) );
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                var del = common.spy.getDeleted(emit);

                expect(del).toEqual([
                    'Deleted "C"',
                    'Deleted "D"',
                    'Deleted "A"'
                ]);
            });
        });

        it("should fail if plugin is a required dependency", function() {
            runs(function() {
                uninstallPromise( uninstall.uninstallPlugin('C', plugins_install_dir) );
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(done.message).toBe('"C" is required by (A) and cannot be removed (hint: use -f or --force)');
            });
        });

        it("allow forcefully removing a plugin", function() {
            runs(function() {
                uninstallPromise( uninstall.uninstallPlugin('C', plugins_install_dir, {force: true}) );
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(done).toBe(true);
                var del = common.spy.getDeleted(emit);
                expect(del).toEqual(['Deleted "C"']);
            });
        });

        it("never remove top level plugins if they are a dependency", function() {
            runs(function() {
                uninstallPromise( uninstall.uninstallPlugin('A', plugins_install_dir2) );
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                var del = common.spy.getDeleted(emit);

                expect(del).toEqual([
                    'Deleted "D"',
                    'Deleted "A"'
                ]);
            });
        });
    });
});

describe('uninstall', function() {
    var fsWrite, rm, add_to_queue;

    beforeEach(function() {
        fsWrite = spyOn(fs, 'writeFileSync').andReturn(true);
        rm = spyOn(shell, 'rm').andReturn(true);
        add_to_queue = spyOn(config_changes, 'add_uninstalled_plugin_to_prepare_queue');
        done = false;
    });
    describe('success', function() {
        it('should call the config-changes module\'s add_uninstalled_plugin_to_prepare_queue method after processing an install', function() {
            runs(function() {
                uninstallPromise( uninstall('android', project, plugins['DummyPlugin']) );
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(add_to_queue).toHaveBeenCalledWith(plugins_install_dir, dummy_id, 'android', true);
            });
        });
    });

    describe('failure', function() {
        it('should throw if platform is unrecognized', function() {
            runs(function() {
                uninstallPromise(uninstall('atari', project, 'SomePlugin'));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(''+done).toContain('atari not supported.');
            });
        });
        it('should throw if plugin is missing', function() {
            runs(function() {
                uninstallPromise(uninstall('android', project, 'SomePluginThatDoesntExist'));
            });
            waitsFor(function() { return done; }, 'promise never resolved', 200);
            runs(function() {
                expect(''+done).toContain('Plugin "SomePluginThatDoesntExist" not found. Already uninstalled?');
            });
        });
    });
});

describe('end', function() {

    it('end', function() {
        done = false;

        promise.then(
            function(){
                return uninstall('android', project, plugins['DummyPlugin'])
            }
        ).then(
            function(){
                // Fails... A depends on
                return uninstall('android', project, plugins['C'])
            }
        ).fail(
            function(err) {
                expect(err.message).toBe("The plugin 'C' is required by (A), skipping uninstallation.");
            }
        ).then(
            function(){
                // dependencies on C,D ... should this only work with --recursive? prompt user..?
                return uninstall('android', project, plugins['A'])
            }
        ).fin(function(err){
            if(err)
                plugman.emit('error', err);

            shell.rm('-rf', project);
            shell.rm('-rf', project2);
            done = true;
        });

        waitsFor(function() { return done; }, 'promise never resolved', 500);
    });
});

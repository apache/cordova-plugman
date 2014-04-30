var platform = require('../src/platform'),
    Q = require('q'),
    fs = require('fs'),
    shell = require('shelljs'),
    plugman = require('../plugman');

describe( 'platform add/remove', function() {
    it( 'should call platform add', function() {
        var sPlatformA = spyOn( platform, 'add' ).andReturn(Q()),
            sPlatformR = spyOn( platform, 'remove' ).andReturn(Q());
        platform.add();
        expect(sPlatformA).toHaveBeenCalled();
        platform.remove();
        expect(sPlatformR).toHaveBeenCalled();
    });
});


describe( 'platform add', function() {
    var done = false,
        existsSync,
        mkdir,
        writeFileSync;
    function platformPromise( f ) {
        f.then( function() { done = true; }, function(err) { done = err; } );
    }
    beforeEach( function() {
        existsSync = spyOn( fs, 'existsSync' ).andReturn( false );
        done = false;
    });
    it( 'should error on non existing plugin.xml', function() {
        runs(function() {
            platformPromise( platform.add() );
        });
        waitsFor(function() { return done; }, 'platform promise never resolved', 500);
        runs(function() {
            expect(''+ done ).toContain( "can't find a plugin.xml.  Are you in the plugin?"  );
        });
    });
});


describe( 'platform remove', function() {
    var done = false,
        existsSync,
        mkdir,
        writeFileSync;
    function platformPromise( f ) {
        f.then( function() { done = true; }, function(err) { done = err; } );
    }
    beforeEach( function() {
        existsSync = spyOn( fs, 'existsSync' ).andReturn( false );
        done = false;
    });
    it( 'should error on non existing plugin.xml', function() {
        runs(function() {
            platformPromise( platform.remove() );
        });
        waitsFor(function() { return done; }, 'platform promise never resolved', 500);
        runs(function() {
            expect(''+ done ).toContain( "can't find a plugin.xml.  Are you in the plugin?"  );
        });
    });
});

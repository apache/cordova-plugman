var create = require('../src/create'),
    Q = require('q'),
    fs = require('fs'),
    shell = require('shelljs'),
    plugman = require('../plugman');

describe( 'create', function() {
    it( 'should call create', function() {
        var sCreate = spyOn( plugman, 'create' ).andReturn(Q());
        plugman.create();
        expect(sCreate).toHaveBeenCalled();
    });
});

describe( 'create plugin', function() {
    var done = false,
        existsSync,
        mkdir,
        writeFileSync;
    function createPromise( f ) {
        f.then( function() { done = true; }, function(err) { done = err; } );
    }
    beforeEach( function() {
        existsSync = spyOn( fs, 'existsSync' ).andReturn( false );
        mkdir = spyOn( shell, 'mkdir' ).andReturn( true );
        writeFileSync = spyOn( fs, 'writeFileSync' );
        done = false;
    });

    it( 'should be successful', function() {
        runs(function() {
            createPromise( create( 'name', 'org.plugin.id', '0.0.0', '.', [] ) );
        });
        waitsFor(function() { return done; }, 'create promise never resolved', 500);
        runs(function() {
            expect( done ).toBe( true );
            expect( writeFileSync.calls.length ).toEqual( 2 );
        });
    });
});

describe( 'create plugin in existing plugin', function() {
    var done = false,
        existsSync;
    function createPromise( f ) {
        f.then( function() { done = true; }, function(err) { done = err; } );
    }
    beforeEach( function() {
        existsSync = spyOn( fs, 'existsSync' ).andReturn( true );
        done = false;
    });

    it( 'should fail due to an existing plugin.xml', function() {
        runs(function() {
            createPromise( create() );
        });
        waitsFor(function() { return done; }, 'create promise never resolved', 500);
        runs(function() {
            expect(''+ done ).toContain( 'Error: plugin.xml already exists. Are you already in a plugin?'  );
        });
    });
});

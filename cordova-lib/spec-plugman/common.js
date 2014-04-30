
var plugman = require('../plugman'),
    nopt = require('nopt');

var known_opts = {
    'verbose' : Boolean,
    'debug' : Number
}, shortHands = { 'd' : ['--debug'] };

var opt = nopt(known_opts, shortHands);
var mapNames = {
    'verbose' : 7,
    'info'    : 6,
    'notice'  : 5,
    'warn'    : 4,
    'error'   : 3
}

if(opt.verbose)
    opt.debug = 7;

if(opt.debug) {
    for(var i in mapNames) {
        if(mapNames[i] <= opt.debug)
            plugman.on(i, console.log);
    }

    if(opt.debug >= 6)
        plugman.on('log', console.log);
}

module.exports = common = {
    spy: {
        getInstall: function(emitSpy){
            return common.spy.startsWith(emitSpy, 'Install start');
        },

        getDeleted: function(emitSpy){
            return common.spy.startsWith(emitSpy, 'Deleted');
        },

        startsWith: function(emitSpy, string)
        {
            var match = [], i;
            for(i in emitSpy.argsForCall) {
                if(emitSpy.argsForCall[i][1].substr(0, string.length) === string)
                    match.push(emitSpy.argsForCall[i][1]);
            }
            return match;
        },

        contains: function(emitSpy, string)
        {
            var match = [], i;
            for(i in emitSpy.argsForCall) {
                if(emitSpy.argsForCall[i][1].indexOf(string) >= 0)
                    match.push(emitSpy.argsForCall[i][1]);
            }
            return match;
        }
    }
};

var registry = require('plugman-registry')
  , config = require('../config');

module.exports = function() {
  registry.use(config.registry, function(err) {
    registry.adduser(null, function(err) {
      if(err) return console.log(err);
      console.log('user added');
    });
  });
}

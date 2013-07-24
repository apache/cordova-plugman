var registry = require('plugman-registry')
  , config = require('../config');

module.exports = function(callback) {
  registry.use(config.registry, function(err) {
    registry.adduser(null, function(err) {
      if(callback && typeof callback === 'function') {
          err ? callback(err) : callback(null);
      } else {
          if(err) {
              throw err;
          } else {
              console.log('user added');
          }
      }
    });
  });
}

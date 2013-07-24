var registry = require('plugman-registry')
  , config = require('../config');

module.exports = function(plugin, callback) {
  registry.use(config.registry, function(err) {
    registry.unpublish(plugin, function(err, d) {
      if(callback && typeof callback === 'function') {
          err ? callback(err) : callback(null);
      } else {
          if(err) {
              throw err;
          } else {
              console.log('Plugin unpublished');
          }
      }
    });
  });
}

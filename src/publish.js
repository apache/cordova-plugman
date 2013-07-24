var registry = require('plugman-registry')
  , config = require('../config');

module.exports = function(plugin_path, callback) {
  registry.use(config.registry, function(err) {
      // plugin_path is an array of paths
    registry.publish(plugin_path, function(err, d) {
      if(callback && typeof callback === 'function') {
          err ? callback(err) : callback(null);
      } else {
          if(err) {
              throw err;
          } else {
              console.log('Plugin published');
          }
      }
    });
  });
}

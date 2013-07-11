var registry = require('plugman-registry')
  , config = require('../config');

module.exports = function(plugin) {
  registry.use(config.registry, function(err) {
    registry.publish(plugin, function(err, d) {
      if(err) return console.log('Error publishing plugin', err); 
      console.log('plugin published');
    });
  });
}

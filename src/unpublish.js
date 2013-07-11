var registry = require('plugman-registry')
  , config = require('../config');

module.exports = function(plugin) {
  registry.use(config.registry, function(err) {
    registry.unpublish(plugin, function(err, d) {
      if(err) return console.log('Error unpublishing plugin'); 
      console.log('plugin unpublished');
    });
  });
}

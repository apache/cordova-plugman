var registry = require('plugman-registry')
  , config = require('../config');

module.exports = function(search_opts) {
  registry.use(config.registry, function(err) {
    registry.search(search_opts, function(err, plugins) {
      if(err) return console.log(err); 
      for(var plugin in plugins) {
        console.log(plugins[plugin].name, '-', plugins[plugin].description || 'no description provided'); 
      }
    });
  });
}

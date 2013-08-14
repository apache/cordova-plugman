var path = require('path');

module.exports = {
    www_dir: function(project_dir) {
        return path.join(project_dir, 'www');
    }
};

module.exports = function(gulp, plugins, config) {
  return function(done) {
    del(config.path, done);
  };
};


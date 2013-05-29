var grunt = require("grunt");

exports.run = {
  port: 8080,
  harness: "test/phantom-harness.js",
  // Run `grunt test --debug` to enable in-browser testing.
  debug: !!grunt.option("debug")
};

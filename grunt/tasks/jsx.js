'use strict';

var grunt = require("grunt");
var expand = grunt.file.expand;
var spawn = grunt.util.spawn;

module.exports = function() {
  var done = this.async();
  var config = this.data;

  var args = [
    "--cache-dir", ".module-cache",
    "--relativize",
    "--follow-requires",
    config.sourceDir,
    config.outputDir
  ];

  var rootIDs = expand({
    nonull: true, // Keep IDs that don't expand to anything.
    cwd: "src"
  }, config.rootIDs).map(function(id) {
    return id.replace(/\.js$/i, "");
  });

  args.push.apply(args, rootIDs);
  args.push("--config" /* from stdin */);

  var child = spawn({
    cmd: "bin/jsx-internal",
    args: args
  }, function(error, result, code) {
    if (error) {
      grunt.log.error(error);
      done(false);
    } else {
      done();
    }
  });

  child.stdin.write(JSON.stringify(config.getConfig()));
  child.stdin.end();

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
};

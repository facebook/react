'use strict';

var exec = require("child_process").exec;
var expand = require("grunt").file.expand;

module.exports = function() {
  var done = this.async();
  var config = this.data;

  var args = [
    "bin/jsx",
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
  args.push("--config", config.configFile);

  exec(args.join(" "), done);
};

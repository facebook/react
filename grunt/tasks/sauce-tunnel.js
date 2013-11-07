var grunt = require('grunt');
var SauceTunnel = require('sauce-tunnel');

module.exports = function(){
  var task = this;
  var config = task.data;
  var shouldStayAliveForever = task.flags.keepalive;

  var SAUCE_ACCESS_KEY = process.env.SAUCE_ACCESS_KEY;
  if (!SAUCE_ACCESS_KEY) grunt.fatal('Requires the environment variable SAUCE_ACCESS_KEY to be set');

  var SAUCE_USERNAME = process.env.SAUCE_USERNAME;
  if (!SAUCE_USERNAME) grunt.fatal('Requires the environment variable SAUCE_USERNAME to be set');

  var taskCompletedSuccessfully = task.async();

  var stunnel = new SauceTunnel(SAUCE_USERNAME, SAUCE_ACCESS_KEY, /*identifier*/null, /*tunneled*/true, /*tunnelTimeout*/10e3);
  process.on('exit', stunnel.stop.bind(stunnel, function(){}));

  stunnel.on('log:error', grunt.log.error.bind(grunt.log));
  stunnel.on('log:writeln', grunt.log.writeln.bind(grunt.log));

  stunnel.on('verbose:ok', grunt.verbose.ok.bind(grunt.verbose));
  stunnel.on('verbose:error', grunt.verbose.error.bind(grunt.verbose));
  stunnel.on('verbose:debug', grunt.verbose.debug.bind(grunt.verbose));
  stunnel.on('verbose:writeln', grunt.verbose.writeln.bind(grunt.verbose));

  stunnel.openTunnel(function(isOpen){
    if (shouldStayAliveForever && isOpen){
      grunt.verbose.writeln('Keeping the sauce-tunnel open forever because you used the keepalive flag `' + task.nameArgs + '`');
      return;
    }
    grunt.verbose.writeln('To keep the sauce-tunnel open forever, use the grunt task `' + task.nameArgs + ':keepalive`');
    taskCompletedSuccessfully(isOpen);
  });
};

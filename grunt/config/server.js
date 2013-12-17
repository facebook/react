'use strict';

module.exports = function(grunt){
  var coverageWriteStream;

  grunt.task.registerTask('finalize-coverage-stream', function(){
    if (!coverageWriteStream) {
      return;
    }
    var done = this.async();
    coverageWriteStream.once('close', done);
    coverageWriteStream.end();
    coverageWriteStream = null;
  });

  function consoleLoggerMiddleware(req, res, next) {
    if (!(req.method == 'POST' && req._parsedUrl.pathname.replace(/\//g,'') == 'console' && Array.isArray(req.body))) {
      return next();
    }
    res.write('<!doctype html><meta charset=utf-8>');
    res.end('Got it, thanks!');

    req.body.forEach(function(log){
      if (log.message.indexOf('not ok ') === 0) {
        log.type = 'error';
      } else if (log.message.indexOf('ok ') === 0) {
        log.type = 'ok';
      } else if (log.message.indexOf('COVER') === 0) {
        log.type = 'coverage';
      } else if (log.message.indexOf('DONE\t') === 0) {
        log.type = 'coverage done';
      }

      if (log.type == 'error') {
        grunt.log.error(log.message);
      } else if (log.type == 'ok') {
        grunt.log.ok(log.message);
      } else if (log.type == 'log') {
        grunt.log.writeln(log.message);
      } else if (log.type == 'coverage') {
        if (!coverageWriteStream) {
          coverageWriteStream = require('fs').createWriteStream(__dirname + '/../../coverage.log');
        }
        coverageWriteStream.write(log.message + '\n');
      } else if (log.type == 'coverage done') {
        grunt.task.run('finalize-coverage-stream');
      } else if (log.type == 'perf') {
        grunt.event.emit('perf results', log.message);
      } else {
        grunt.verbose.writeln(log);
      }
    });
  }

  function testResultLoggerMiddleware(req, res, next) {
    if (!(req.method == 'POST' && req._parsedUrl.pathname.indexOf('/reportTestResults') === 0)) {
      return next();
    }
    res.write('<!doctype html><meta charset=utf-8>');
    res.end('Got it, thanks!');

    var logType = 'writeln';
    var message = req.body;

    if (req.body.type && req.body.message){
      if (req.body.type == 'error') {
        logType = 'error';
      } else if (req.body.message.indexOf('ok') === 0) {
        logType = 'ok';
      } else if (req.body.message.indexOf('not ok') === 0) {
        logType = 'error';
      }
      message = req.body.message;
    }
    if (typeof message != 'string') {
      message = JSON.stringify(message, null, 2);
    }
    grunt.log[logType]('[%s][%s]', req.headers['user-agent'], Date.now(), message);
  }

  return {
    server: {
      options: {
        base: '.',
        hostname: '*',
        port: 9999,
        middleware: function(connect, options) {

          connect.logger.token('user-agent', function(req, res) { return req.headers['user-agent']; });
          connect.logger.token('timestamp', function(req, res) { return Date.now(); });

          return [
            connect.json(),
            consoleLoggerMiddleware,
            testResultLoggerMiddleware,

            connect.logger({format:'[:user-agent][:timestamp] :method :url', stream:grunt.verbose}),
            connect.static(options.base),
            connect.directory(options.base)
          ];
        }
      }
    }
  };
};

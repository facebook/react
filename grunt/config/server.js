module.exports = function(grunt){

  function testResultLoggerMiddleware(req, res, next) {
    if (!(req.body && req.body.data)) return next();
    grunt.log.writeln('[%s][%s]', req.headers['user-agent'], Date.now(), req.body.data);
    res.write('<!doctype html><meta charset=utf-8>');
    res.end('Got it, thanks!');
  }

  return {
    server: {
      options: {
        base: '.',
        hostname: '*',
        port: 9999,
        middleware: function(connect, options) {
          
          connect.logger.token('user-agent', function(req, res){ return req.headers['user-agent']; });
          connect.logger.token('timestamp', function(req, res){ return Date.now(); });
          
          return [
            connect.logger({format:'[:user-agent][:timestamp] :method :url', stream:grunt.verbose}),
            connect.bodyParser(),
            testResultLoggerMiddleware,
            
            connect.static(options.base),
            connect.directory(options.base)
          ];
        },
      }
    }
  }
}

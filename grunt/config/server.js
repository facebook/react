module.exports = function(grunt){

  function testResultLoggerMiddleware(req, res, next) {
    if (!(req.method == 'POST' && req._parsedUrl.pathname.indexOf('/reportTestResults') === 0)) return next();
    var logType = 'writeln';
    var message = req.body;

    if (req.body.type && req.body.message){
      if (req.body.type == 'error') logType = 'error';
      else if (req.body.message.indexOf('ok') === 0) logType = 'ok';
      else if (req.body.message.indexOf('not ok') === 0) logType = 'error';
      message = req.body.message;
    }
    if (typeof message != 'string') message = JSON.stringify(message, null, 2);
    grunt.log[logType]('[%s][%s]', req.headers['user-agent'], Date.now(), message);
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
            connect.json(),
            testResultLoggerMiddleware,
            
            connect.logger({format:'[:user-agent][:timestamp] :method :url', stream:grunt.verbose}),
            connect.static(options.base),
            connect.directory(options.base)
          ];
        },
      }
    }
  }
}

var pxlgif = Buffer('R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

module.exports = function(grunt){
  
  function printMiddleware(req, res, next) {
    if (req._parsedUrl.pathname != '/print') return next();
    if (req.query.message.indexOf('ok') === 0){
      grunt.log.ok(req.query.message);
    } else if (req.query.message.indexOf('not ok') === 0){
      grunt.log.error(req.query.message);
    } else {
      grunt[req.query.type || 'log'].writeln('[%s][%s]', req.headers['user-agent'], Date.now(), req.query.message);
    }
    res.end(pxlgif);
  }
  function testResultLoggerMiddleware(req, res, next) {
    if (!(req.body && req.body.data)) return next();
    grunt.log.writeln('[%s][%s]', req.headers['user-agent'], Date.now(), req.body.data);
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
            connect.query(),
            printMiddleware,
            
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

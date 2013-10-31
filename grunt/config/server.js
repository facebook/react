var pxlgif = Buffer('R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

module.exports = function(grunt){
  
  function printMiddleware(req, res, next) {
    if (req._parsedUrl.pathname != '/print') return next();
    grunt[req.query.type || 'log'].writeln(req.query.message);
    res.end(pxlgif);
  }
  function testResultLoggerMiddleware(req, res, next) {
    if (!(req.body && req.body.data)) return next();
    grunt.log.writeln(req.body.data);
    res.end('Got it, thanks!');
  }
  
  return {
    server: {
      options: {
        base: '.',
        hostname: '*',
        port: 9999,
        middleware: function(connect, options) {
          return [
            connect.query(),
            printMiddleware,
            connect.bodyParser(),
            testResultLoggerMiddleware,
            
            connect.logger(':method :url - :referrer'),
            connect.static(options.base)
          ];
        },
      }
    }
  }
}

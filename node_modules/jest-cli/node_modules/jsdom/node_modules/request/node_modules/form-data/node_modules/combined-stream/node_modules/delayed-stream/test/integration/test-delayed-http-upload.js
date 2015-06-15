var common = require('../common');
var assert = common.assert;
var DelayedStream = common.DelayedStream;
var http = require('http');

var UPLOAD = new Buffer(10 * 1024 * 1024);

var server = http.createServer(function(req, res) {
  var delayed = DelayedStream.create(req, {maxDataSize: UPLOAD.length});

  setTimeout(function() {
    res.writeHead(200);
    delayed.pipe(res);
  }, 10);
});
server.listen(common.PORT, function() {
  var request = http.request({
    method: 'POST',
    port: common.PORT,
  });

  request.write(UPLOAD);
  request.end();

  request.on('response', function(res) {
    var received = 0;
    res
      .on('data', function(chunk) {
        received += chunk.length;
      })
      .on('end', function() {
        assert.equal(received, UPLOAD.length);
        server.close();
      });
  });
});



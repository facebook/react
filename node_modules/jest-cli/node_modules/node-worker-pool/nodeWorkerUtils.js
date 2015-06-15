var JSONStreamParser = require('./lib/JSONStreamParser');
var Q = require('q');
var util = require('util');

function respondWithError(err) {
  if (util.isError(err)) {
    err = err.stack;
  }
  console.log(JSON.stringify({error: err}, null, 2));
}

function respondWithResult(result) {
  console.log(JSON.stringify({response: result}, null, 2));
}

function startWorker(onInitialize, onMessageReceived, onShutdown) {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  var inputStreamParser = new JSONStreamParser();

  var initialized = false;
  var initData = null;

  process.stdin.on('data', function(data) {
    var rcvdMsg = inputStreamParser.parse(data);
    if (rcvdMsg.length === 1) {
      if (initialized === false) {
        try {
          onInitialize && onInitialize(rcvdMsg[0].initData);
          initialized = true;
          console.log(JSON.stringify({initSuccess: true}));
        } catch (e) {
          console.log(JSON.stringify({initError: e.stack || e.message}));
          throw e;
        }
      } else {
        try {
          var message = rcvdMsg[0].message;
          onMessageReceived(message).then(function(response) {
            if (!response || typeof response !== 'object') {
              throw new Error(
                'Invalid response returned by worker function: ' +
                JSON.stringify(response, null, 2)
              );
            }
            return response;
          }).done(respondWithResult, respondWithError);
        } catch (e) {
          respondWithError(e.stack || e.message);
        }
      }
    } else if (rcvdMsg.length > 1) {
      throw new Error(
        'Received multiple messages at once! Not sure what to do, so bailing ' +
        'out!'
      );
    }
  });

  onShutdown && process.stdin.on('end', onShutdown);
}

exports.respondWithError = respondWithError;
exports.respondWithResult = respondWithResult;
exports.startWorker = startWorker;

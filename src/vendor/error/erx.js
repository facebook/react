/**
 * @providesModule erx
 * @typechecks
 * @nostacktrace
 */

var ex = require('ex');

/**
 * This function reverse transform done by `ex()`.
 *
 * This function only transforms plain text message back to error message with
 * arguments. If the error message is minified by the server, it has to be
 * looked up on the server.
 *
 * This function is designed to be idempotent, so erx(erx(whatever)) will be
 * the same as erx(whatever).
 *
 * @param {string|array<string>} transformedMessage
 */

var erx = function(transformedMessage) {
  if (typeof transformedMessage !== 'string') {
    // possibly double `erx`ed and return original value
    return transformedMessage;
  }

  var prefixLeft = transformedMessage.indexOf(ex._prefix);
  var suffixLeft = transformedMessage.lastIndexOf(ex._suffix);
  if (prefixLeft < 0 || suffixLeft < 0) {
    // plain error message without any transformation
    return [transformedMessage];
  }

  var prefixRight = prefixLeft + ex._prefix.length;
  var suffixRight = suffixLeft + ex._suffix.length;
  if (prefixRight >= suffixLeft) {
    return ['erx slice failure: %s', transformedMessage];
  }

  var leftSlice = transformedMessage.substring(0, prefixLeft);
  var rightSlice = transformedMessage.substring(suffixRight);
  transformedMessage = transformedMessage.substring(prefixRight, suffixLeft);

  var messageWithParams;
  try {
    messageWithParams = JSON.parse(transformedMessage);
    messageWithParams[0] =
      leftSlice + messageWithParams[0] + rightSlice;
  } catch(err) {
    return ['erx parse failure: %s', transformedMessage];
  }

  return messageWithParams;
};

module.exports = erx;

/*
  A console.log that won't leave you hanging when node exits
  90% of this file was ripped from node.js

  License: see: https://github.com/joyent/node/blob/master/lib/console.js
 */

var util = require('util');
var fs = require("fs");

/* Monkey patching */
if (!util.format) {
  var formatRegExp = /%[sdj%]/g;
  util.format = function(f) {
    if (typeof f !== 'string') {
      var objects = [];
      for (var i = 0; i < arguments.length; i++) {
        objects.push(util.inspect(arguments[i]));
      }
      return objects.join(' ');
    }

    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function(x) {
      if (i >= len) return x;
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        case '%j': return JSON.stringify(args[i++]);
        case '%%': return '%';
        default:
          return x;
      }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
      if (x === null || typeof x !== 'object') {
        str += ' ' + x;
      } else {
        str += ' ' + util.inspect(x);
      }
    }
    return str;
  }
}

var consoleFlush = function(data) {
  if (!Buffer.isBuffer(data)) {
    data= new Buffer(''+ data);
  }
  if (data.length) {
    var written= 0;
    do {
      try {
        var len = data.length- written;
        written += fs.writeSync(process.stdout.fd, data, written, len, -1);
      }
      catch (e) {
      }
    } while(written < data.length);  
  }
};
     
var originalConsoleLog = console.log;
var patchedConsoleLog = function() {
    var str = util.format.apply(null, arguments) + "\n";
    consoleFlush(str);
};

exports.patch = function() {
  console.log = patchedConsoleLog;
}

exports.unpatch = function() {
  console.log = originalConsoleLog;
}
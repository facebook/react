var kLogsArgument = /^--logs\s*=\s*(.+?)$/;
var kTrimLeft = /^\s+/;
var kTrimRight = /\s+$/;
var kCamelCase = /[-_\s]+(.)?/g;
var logs = findArgvLogs();

function findArgvLogs() {
  for (var i = 0; i < process.argv.length; ++i) {
    var match = process.argv[i].match(kLogsArgument);
    if (match) {
      return logsToObject(match[1]);
    }
  }
  return null;
}

function logsToObject(logstr) {
  return logstr.
    split(',').
    reduce(function(obj, key) {
      key = camelize(key);
      if (key.length > 0) obj[key] = true;
      return obj;
    }, Object.create(null));
  return logs;
}

function camelize(str) {
  return str.
    replace(kTrimLeft, '').
    replace(kTrimRight, '').
    replace(kCamelCase, function(match, c) {
      return c ? c.toUpperCase() : "";
    });
}

function shouldLog(str) {
  if (!logs || logs.quiet) return false;
  if (logs.all) return true;
  return !!logs[camelize(str)];
}

module.exports = shouldLog;

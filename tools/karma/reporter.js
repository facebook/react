var SourceMapConsumer = require('source-map').SourceMapConsumer;
var DotsReporter = require('karma/lib/reporters/dots_color');

var createErrorFormatter = function (basePath, emitter, SourceMapConsumer) {
  var lastServedFiles = [];
  emitter.on('file_list_modified', function (files) {
    lastServedFiles = files.served
  });
  function findFile(path) {
    return lastServedFiles.filter(_ => _.path === path)[0];
  }

  var URL_REGEXP = new RegExp('(?:https?:\\/\\/[^\\/]*)?\\/?' +
    '(base|absolute)' + // prefix
    '((?:[A-z]\\:)?[^\\?\\s\\:]*)' + // path
    '(\\?\\w*)?' + // sha
    '(\\:(\\d+))?' + // line
    '(\\:(\\d+))?' + // column
    '', 'g')

  return function (msg, indentation) {
    msg = (msg || '').replace(URL_REGEXP, function (_, prefix, path, __, ___, line, ____, column) {
      if (prefix === 'base') {
        path = basePath + path;
      }
      line = parseInt(line || '0', 10);
      column = parseInt(column || '0', 10);

      var file = findFile(path)
      if (file && file.sourceMap) {
        try {
          var original = new SourceMapConsumer(file.sourceMap).originalPositionFor({
            line: line,
            column: column
          });
          return process.cwd() + "/modules/" + original.source + ":" + original.line + ":" + original.column;
        } catch (e) {
          console.warn('SourceMap position not found for trace: %s', msg);
        }
      }
      return path + ':' + line + ':' + column;
    });

    // indent every line
    if (indentation) {
      msg = indentation + msg.replace(/\n/g, '\n' + indentation)
    }
    return msg + '\n';
  }
}


var InternalAngularReporter = function (config, emitter) {
  var formatter = createErrorFormatter(config.basePath, emitter, SourceMapConsumer);
  DotsReporter.call(this, formatter, false, config.colors)
}
InternalAngularReporter.$inject = ['config', 'emitter']

module.exports = {'reporter:internal-angular': ['type', InternalAngularReporter]};

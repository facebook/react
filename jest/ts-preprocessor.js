'use strict';

var fs = require('fs');
var path = require('path');
var ts = require('typescript');

var tsOptions = {module: 'commonjs'};

function formatErrorMessage(error) {
  return (
    error.file.filename + '(' +
    error.file.getLineAndCharacterFromPosition(error.start).line +
    '): ' +
    error.messageText
  );
}

function compile(defaultLib, content, contentFilename) {
  var output = null;
  var compilerHost = {
    getSourceFile: function(filename, languageVersion) {
      if (filename === contentFilename) {
        return ts.createSourceFile(filename, content, 'ES5', '0');
      }
      return defaultLib;
    },
    writeFile: function(name, text, writeByteOrderMark) {
      if (output === null) {
        output = text;
      } else {
        throw new Error('Expected only one dependency.');
      }
    },
    getCanonicalFileName: function(filename) {
      return filename;
    },
    getCurrentDirectory: function() {
      return '';
    },
    getNewLine: function() {
      return '\n';
    }
  };
  var program = ts.createProgram([contentFilename], tsOptions, compilerHost);
  var errors = program.getDiagnostics();
  if (!errors.length) {
    var checker = program.getTypeChecker(true);
    errors = checker.getDiagnostics();
    checker.emitFiles();
  }
  if (errors.length) {
    throw new Error(errors.map(formatErrorMessage).join('\n'));
  }
  return output;
}

module.exports = function(defaultLibs) {
  var defaultLibSource = fs.readFileSync(
    path.join(path.dirname(require.resolve('typescript')), 'lib.d.ts')
  );

  for (var i = 0; i < defaultLibs.length; i++) {
    defaultLibSource += '\n' + fs.readFileSync(defaultLibs[i]);
  }

  var defaultLibSourceFile = ts.createSourceFile(
    'lib.d.ts', defaultLibSource, 'ES5'
  );

  return {
    compile: compile.bind(null, defaultLibSourceFile)
  };
};

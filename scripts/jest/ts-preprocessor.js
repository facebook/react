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

function compile(content, contentFilename) {
  var output = null;
  var compilerHost = {
    getSourceFile: function(filename, languageVersion) {
      var source;
      if (filename === 'lib.d.ts') {
        source = fs.readFileSync(
          require.resolve('typescript/bin/lib.d.ts')
        ).toString();
      } else if (filename === 'jest.d.ts') {
        source = fs.readFileSync(
          path.join(__dirname, 'jest.d.ts')
        ).toString();
      } else if (filename === contentFilename) {
        source = content;
      } else if (/\/(?:React|ReactDOM)(?:\.d)?\.ts$/.test(filename)) {
        // TypeScript will look for the .d.ts files in each ancestor directory,
        // so there may not be a file at the referenced path as it climbs the
        // hierarchy.
        try {
          source = fs.readFileSync(filename).toString();
        } catch (e) {
          if (e.code == 'ENOENT') {
            return undefined;
          }
          throw e;
        }
      } else {
        throw new Error('Unexpected filename ' + filename);
      }
      return ts.createSourceFile(filename, source, 'ES5', '0');
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
    },
  };
  var program = ts.createProgram([
    'lib.d.ts',
    'jest.d.ts',
    contentFilename,
  ], tsOptions, compilerHost);
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

module.exports = {
  compile: compile,
};

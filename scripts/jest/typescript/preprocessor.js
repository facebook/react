'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const tsOptions = {
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.React,
};

function formatErrorMessage(error) {
  return (
    error.file.filename +
    '(' +
    error.file.getLineAndCharacterOfPosition(error.start).line +
    '): ' +
    error.messageText
  );
}

function compile(content, contentFilename) {
  let output = null;
  const compilerHost = {
    getSourceFile(filename, languageVersion) {
      let source;
      const jestRegex = /jest\.d\.ts/;
      const reactRegex = /(?:React|ReactDOM|PropTypes)(?:\.d)?\.ts$/;

      // `path.normalize` is used to turn forward slashes in
      // the file path into backslashes on Windows.
      filename = path.normalize(filename);
      if (filename === 'lib.d.ts') {
        source = fs
          .readFileSync(require.resolve('typescript/lib/lib.d.ts'))
          .toString();
      } else if (filename.match(jestRegex)) {
        source = fs.readFileSync(path.join(__dirname, 'jest.d.ts')).toString();
      } else if (filename === contentFilename) {
        source = content;
      } else if (reactRegex.test(filename)) {
        // TypeScript will look for the .d.ts files in each ancestor directory,
        // so there may not be a file at the referenced path as it climbs the
        // hierarchy.
        try {
          source = fs.readFileSync(filename).toString();
        } catch (e) {
          if (e.code === 'ENOENT') {
            return undefined;
          }
          throw e;
        }
      } else {
        throw new Error('Unexpected filename ' + filename);
      }
      return ts.createSourceFile(filename, source, 'ES5', '0');
    },
    writeFile(name, text, writeByteOrderMark) {
      if (output === null) {
        output = text;
      } else {
        throw new Error('Expected only one dependency.');
      }
    },
    getCanonicalFileName(filename) {
      return filename;
    },
    getCurrentDirectory() {
      return '';
    },
    getNewLine() {
      return '\n';
    },
    fileExists(filename) {
      return ts.sys.fileExists(filename);
    },
    useCaseSensitiveFileNames() {
      return ts.sys.useCaseSensitiveFileNames;
    },
  };
  const program = ts.createProgram(
    ['lib.d.ts', 'jest.d.ts', contentFilename],
    tsOptions,
    compilerHost
  );
  const emitResult = program.emit();
  const errors = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);
  if (errors.length) {
    throw new Error(errors.map(formatErrorMessage).join('\n'));
  }
  return output;
}

module.exports = {
  compile: compile,
};

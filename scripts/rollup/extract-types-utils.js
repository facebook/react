// @noflow

const fs = require('fs');
const babylon = require('babylon');
const t = require('babel-types');
const nodePath = require('path');



// code  => ast
function parse(code) {
  return babylon.parse(code, {
    sourceType: 'module',
    plugins: ['flow', 'objectRestSpread'],
  });
}

// (sourceValue, currentFileDir) => sourceValueFileName
function resolveFileName(sourceValue, currentFileDir) {
  return require.resolve(
    /^\.\//.test(sourceValue)
      ? nodePath.resolve(currentFileDir, sourceValue)
      : sourceValue
  );
}

// resolvedSourceFileName => code
function readSource(resolvedSourceFileName) {
  return fs.readFileSync(resolvedSourceFileName).toString();
}
// declarations => void | Append declaration to the ast
function bundle(declarations) {
  const ast = parse('');
  return Object.assign({}, ast, {program: t.program(declarations)});
}

// fileName => Directory of the file
function getDir(file) {
  return nodePath.dirname(file);
}

function write(file, txt) {
  fs.writeFileSync(file, txt);
}
// $FlowFixMe
module.exports.resolveFileName = resolveFileName;

// $FlowFixMe
module.exports.parse = parse;

// $FlowFixMe
module.exports.readSource = readSource;

// $FlowFixMe
module.exports.bundle = bundle;

// $FlowFixMe
module.exports.getDir = getDir;

// $FlowFixMe
module.exports.write = write;

// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Common mutator utilities.
 */

const babelTemplate = require('@babel/template').default;
const babelTypes = require('@babel/types');
const babylon = require('@babel/parser');

const sourceHelpers = require('../source_helpers.js');
const random = require('../random.js');

const INTERESTING_NUMBER_VALUES = [
    -1, -0.0, 0, 1,

    // Float values.
    -0.000000000000001, 0.000000000000001,

    // Special values.
    NaN, +Infinity, -Infinity,

    // Boundaries of int, signed, unsigned, SMI (near +/- 2^(30, 31, 32).
     0x03fffffff,  0x040000000,  0x040000001,
    -0x03fffffff, -0x040000000, -0x040000001,
     0x07fffffff,  0x080000000,  0x080000001,
    -0x07fffffff, -0x080000000, -0x080000001,
     0x0ffffffff,  0x100000000,  0x100000001,
    -0x0ffffffff, -0x100000000, -0x100000001,

    // Boundaries of maximum safe integer (near +/- 2^53).
     9007199254740990,  9007199254740991,  9007199254740992,
    -9007199254740990, -9007199254740991, -9007199254740992,

    // Boundaries of double.
     5e-324, 1.7976931348623157e+308,
    -5e-324,-1.7976931348623157e+308,
]

const INTERESTING_NON_NUMBER_VALUES = [
    // Simple arrays.
    '[]',
    'Array(0x8000).fill("a")',

    // Simple object.
    '{}',
    '{a: "foo", b: 10, c: {}}',

    // Simple strings.
    '"foo"',
    '""',

    // Simple regex.
    '/0/',
    '"/0/"',

    // Simple symbol.
    'Symbol("foo")',

    // Long string.
    'Array(0x8000).join("a")',

    // Math.PI
    'Math.PI',

    // Others.
    'false',
    'true',
    'undefined',
    'null',
    'this',
    'this[0]',
    'this[1]',

    // Empty function.
    '(function() {return 0;})',

    // Objects with functions.
    '({toString:function(){return "0";}})',
    '({valueOf:function(){return 0;}})',
    '({valueOf:function(){return "0";}})',

    // Objects for primitive types created using new.
    '(new Boolean(false))',
    '(new Boolean(true))',
    '(new String(""))',
    '(new Number(0))',
    '(new Number(-0))',
]

const LARGE_NODE_SIZE = 100;
const MAX_ARGUMENT_COUNT = 10;

function _identifier(identifier) {
  return babelTypes.identifier(identifier);
}

function _numericLiteral(number) {
  return babelTypes.numericLiteral(number);
}

function _unwrapExpressionStatement(value) {
  if (babelTypes.isExpressionStatement(value)) {
    return value.expression;
  }

  return value;
}

function isVariableIdentifier(name) {
  return /__v_[0-9]+/.test(name);
}

function isFunctionIdentifier(name) {
  return /__f_[0-9]+/.test(name);
}

function isInForLoopCondition(path) {
  // Return whether if we're in the init/test/update parts of a for loop (but
  // not the body). Mutating variables in the init/test/update will likely
  // modify loop variables and cause infinite loops.
  const forStatementChild = path.find(
      p => p.parent && babelTypes.isForStatement(p.parent));

  return (forStatementChild && forStatementChild.parentKey !== 'body');
}

function isInWhileLoop(path) {
  // Return whether if we're in a while loop.
  const whileStatement = path.find(p => babelTypes.isWhileStatement(p));
  return Boolean(whileStatement);
}

function _availableIdentifiers(path, filter) {
  // TODO(ochang): Consider globals that aren't declared with let/var etc.
  const available = new Array();
  const allBindings = path.scope.getAllBindings();
  for (const key of Object.keys(allBindings)) {
    if (!filter(key)) {
      continue;
    }

    if (filter === isVariableIdentifier &&
        path.willIMaybeExecuteBefore(allBindings[key].path)) {
      continue;
    }

    available.push(_identifier(key));
  }

  return available;
}

function availableVariables(path) {
  return _availableIdentifiers(path, isVariableIdentifier);
}

function availableFunctions(path) {
  return _availableIdentifiers(path, isFunctionIdentifier);
}

function randomVariable(path) {
  return random.single(availableVariables(path));
}

function randomFunction(path) {
  return random.single(availableFunctions(path));
}

function randomSeed() {
  return random.randInt(0, 2**20);
}

function randomObject(seed) {
  if (seed === undefined) {
    seed = randomSeed();
  }

  const template = babelTemplate('__getRandomObject(SEED)');
  return template({
    SEED: _numericLiteral(seed),
  }).expression;
}

function randomProperty(identifier, seed) {
  if (seed === undefined) {
    seed = randomSeed();
  }

  const template = babelTemplate('__getRandomProperty(IDENTIFIER, SEED)');
  return template({
    IDENTIFIER: identifier,
    SEED: _numericLiteral(seed),
  }).expression;
}

function randomArguments(path) {
  const numArgs = random.randInt(0, MAX_ARGUMENT_COUNT);
  const args = [];

  for (let i = 0; i < numArgs; i++) {
    args.push(randomValue(path));
  }

  return args.map(_unwrapExpressionStatement);
}

function randomValue(path) {
  const probability = random.random();

  if (probability < 0.01) {
    const randomFunc = randomFunction(path);
    if (randomFunc) {
      return randomFunc;
    }
  }

  if (probability < 0.25) {
    const randomVar = randomVariable(path);
    if (randomVar) {
      return randomVar;
    }
  }

  if (probability < 0.5) {
    return randomInterestingNumber();
  }

  if (probability < 0.75) {
    return randomInterestingNonNumber();
  }

  return randomObject();
}

function callRandomFunction(path, identifier, seed) {
  if (seed === undefined) {
    seed = randomSeed();
  }

  let args = [
      identifier,
      _numericLiteral(seed)
  ];

  args = args.map(_unwrapExpressionStatement);
  args = args.concat(randomArguments(path));

  return babelTypes.callExpression(
      babelTypes.identifier('__callRandomFunction'),
      args);
}

function nearbyRandomNumber(value) {
  const probability = random.random();

  if (probability < 0.9) {
    return _numericLiteral(value + random.randInt(-0x10, 0x10));
  } else if (probability < 0.95) {
    return _numericLiteral(value + random.randInt(-0x100, 0x100));
  } else if (probability < 0.99) {
    return _numericLiteral(value + random.randInt(-0x1000, 0x1000));
  }

  return _numericLiteral(value + random.randInt(-0x10000, 0x10000));
}

function randomInterestingNumber() {
  const value = random.single(INTERESTING_NUMBER_VALUES);
  if (random.choose(0.05)) {
    return nearbyRandomNumber(value);
  }
  return _numericLiteral(value);
}

function randomInterestingNonNumber() {
  return babylon.parseExpression(random.single(INTERESTING_NON_NUMBER_VALUES));
}

function concatFlags(inputs) {
  const flags = new Set();
  for (const input of inputs) {
    for (const flag of input.flags || []) {
      flags.add(flag);
    }
  }
  return Array.from(flags.values());
}

function concatPrograms(inputs) {
  // Concatentate programs.
  const resultProgram = babelTypes.program([]);
  const result = babelTypes.file(resultProgram, [], null);

  for (const input of inputs) {
    const ast = input.ast.program;
    resultProgram.body = resultProgram.body.concat(ast.body);
    resultProgram.directives = resultProgram.directives.concat(ast.directives);
  }

  // TODO(machenbach): Concat dependencies here as soon as they are cached.
  const combined = new sourceHelpers.ParsedSource(
      result, '', '', concatFlags(inputs));
  // If any input file is sloppy, the combined result is sloppy.
  combined.sloppy = inputs.some(input => input.isSloppy());
  return combined;
}

function setSourceLoc(source, index, total) {
  const noop = babelTypes.noop();
  noop.__loc = index / total;
  noop.__self = noop;
  source.ast.program.body.unshift(noop);
}

function getSourceLoc(node) {
  // Source location is invalid in cloned nodes.
  if (node !== node.__self) {
    return undefined;
  }
  return node.__loc;
}

function setOriginalPath(source, originalPath) {
  const noop = babelTypes.noop();
  noop.__path = originalPath;
  noop.__self = noop;
  source.ast.program.body.unshift(noop);
}

function getOriginalPath(node) {
  // Original path is invalid in cloned nodes.
  if (node !== node.__self) {
    return undefined;
  }
  return node.__path;
}

// Estimate the size of a node in raw source characters.
function isLargeNode(node) {
  // Ignore array holes inserted by us (null) or previously cloned nodes
  // (they have no start/end).
  if (!node || node.start === undefined || node.end === undefined ) {
    return false;
  }
  return node.end - node.start > LARGE_NODE_SIZE;
}

module.exports = {
  callRandomFunction: callRandomFunction,
  concatFlags: concatFlags,
  concatPrograms: concatPrograms,
  availableVariables: availableVariables,
  availableFunctions: availableFunctions,
  randomFunction: randomFunction,
  randomVariable: randomVariable,
  isInForLoopCondition: isInForLoopCondition,
  isInWhileLoop: isInWhileLoop,
  isLargeNode: isLargeNode,
  isVariableIdentifier: isVariableIdentifier,
  isFunctionIdentifier: isFunctionIdentifier,
  nearbyRandomNumber: nearbyRandomNumber,
  randomArguments: randomArguments,
  randomInterestingNonNumber: randomInterestingNonNumber,
  randomInterestingNumber: randomInterestingNumber,
  randomObject: randomObject,
  randomProperty: randomProperty,
  randomSeed: randomSeed,
  randomValue: randomValue,
  getOriginalPath: getOriginalPath,
  setOriginalPath: setOriginalPath,
  getSourceLoc: getSourceLoc,
  setSourceLoc: setSourceLoc,
}

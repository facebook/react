// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Try catch wrapper.
 */

const babelTypes = require('@babel/types');

const common = require('./common.js');
const mutator = require('./mutator.js');
const random = require('../random.js');

// Default target probability for skipping try-catch completely.
const DEFAULT_SKIP_PROB = 0.2;

// Default target probability to wrap only on toplevel, i.e. to not nest
// try-catch.
const DEFAULT_TOPLEVEL_PROB = 0.3;

// Probability to deviate from defaults and use extreme cases.
const IGNORE_DEFAULT_PROB = 0.05;

// Member expressions to be wrapped. List of (object, property) identifier
// tuples.
const WRAPPED_MEMBER_EXPRESSIONS = [
  ['WebAssembly', 'Module'],
  ['WebAssembly', 'Instantiate'],
];

function wrapTryCatch(node) {
  return babelTypes.tryStatement(
      babelTypes.blockStatement([node]),
      babelTypes.catchClause(
          babelTypes.identifier('e'),
          babelTypes.blockStatement([])));
}

function wrapTryCatchInFunction(node) {
  const ret = wrapTryCatch(babelTypes.returnStatement(node));
  const anonymousFun = babelTypes.functionExpression(
      null, [], babelTypes.blockStatement([ret]));
  return babelTypes.callExpression(anonymousFun, []);
}

// Wrap particular member expressions after `new` that are known to appear
// in initializer lists of `let` and `const`.
function replaceNewExpression(path) {
  const callee = path.node.callee;
  if (!babelTypes.isMemberExpression(callee) ||
      !babelTypes.isIdentifier(callee.object) ||
      !babelTypes.isIdentifier(callee.property)) {
    return;
  }
  if (WRAPPED_MEMBER_EXPRESSIONS.some(
      ([object, property]) => callee.object.name === object &&
                              callee.property.name === property)) {
    path.replaceWith(wrapTryCatchInFunction(path.node));
    path.skip();
  }
}

function replaceAndSkip(path) {
  if (!babelTypes.isLabeledStatement(path.parent) ||
      !babelTypes.isLoop(path.node)) {
    // Don't wrap loops with labels as it makes continue
    // statements syntactically invalid. We wrap the label
    // instead below.
    path.replaceWith(wrapTryCatch(path.node));
  }
  // Prevent infinite looping.
  path.skip();
}

class AddTryCatchMutator extends mutator.Mutator {
  callWithProb(path, fun) {
    const probability = random.random();
    if (probability < this.skipProb * this.loc) {
      // Entirely skip try-catch wrapper.
      path.skip();
    } else if (probability < (this.skipProb + this.toplevelProb) * this.loc) {
      // Only wrap on top-level.
      fun(path);
    }
  }

  get visitor() {
    const thisMutator = this;
    const accessStatement = {
      enter(path) {
        thisMutator.callWithProb(path, replaceAndSkip);
      },
      exit(path) {
        // Apply nested wrapping (is only executed if not skipped above).
        replaceAndSkip(path);
      }
    };
    return {
      Program: {
        enter(path) {
          // Track original source location fraction in [0, 1).
          thisMutator.loc = 0;
          // Target probability for skipping try-catch.
          thisMutator.skipProb = DEFAULT_SKIP_PROB;
          // Target probability for not nesting try-catch.
          thisMutator.toplevelProb = DEFAULT_TOPLEVEL_PROB;
          // Maybe deviate from target probability for the entire test.
          if (random.choose(IGNORE_DEFAULT_PROB)) {
            thisMutator.skipProb = random.uniform(0, 1);
            thisMutator.toplevelProb = random.uniform(0, 1);
            thisMutator.annotate(
                path.node,
                'Target skip probability ' + thisMutator.skipProb +
                ' and toplevel probability ' + thisMutator.toplevelProb);
          }
        }
      },
      Noop: {
        enter(path) {
          if (common.getSourceLoc(path.node)) {
            thisMutator.loc = common.getSourceLoc(path.node);
          }
        },
      },
      ExpressionStatement: accessStatement,
      IfStatement: accessStatement,
      LabeledStatement: {
        enter(path) {
          // Apply an extra try-catch around the label of a loop, since we
          // ignore the loop itself if it has a label.
          if (babelTypes.isLoop(path.node.body)) {
            thisMutator.callWithProb(path, replaceAndSkip);
          }
        },
        exit(path) {
          // Apply nested wrapping (is only executed if not skipped above).
          if (babelTypes.isLoop(path.node.body)) {
            replaceAndSkip(path);
          }
        },
      },
      // This covers {While|DoWhile|ForIn|ForOf|For}Statement.
      Loop: accessStatement,
      NewExpression: {
        enter(path) {
          thisMutator.callWithProb(path, replaceNewExpression);
        },
        exit(path) {
          // Apply nested wrapping (is only executed if not skipped above).
          replaceNewExpression(path);
        }
      },
      SwitchStatement: accessStatement,
      VariableDeclaration: {
        enter(path) {
          if (path.node.kind !== 'var' || babelTypes.isLoop(path.parent))
            return;
          thisMutator.callWithProb(path, replaceAndSkip);
        },
        exit(path) {
          if (path.node.kind !== 'var' || babelTypes.isLoop(path.parent))
            return;
          // Apply nested wrapping (is only executed if not skipped above).
          replaceAndSkip(path);
        }
      },
      WithStatement: accessStatement,
    };
  }
}

module.exports = {
  AddTryCatchMutator: AddTryCatchMutator,
}

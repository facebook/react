// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Mutator for differential fuzzing.
 */

'use strict';

const babelTemplate = require('@babel/template').default;
const babelTypes = require('@babel/types');

const common = require('./common.js');
const mutator = require('./mutator.js');
const random = require('../random.js');

// Templates for various statements.
const incCaught = babelTemplate('__caught++;');
const printValue = babelTemplate('print(VALUE);');
const printCaught = babelTemplate('print("Caught: " + __caught);');
const printHash = babelTemplate('print("Hash: " + __hash);');
const prettyPrint = babelTemplate('__prettyPrint(ID);');
const prettyPrintExtra = babelTemplate('__prettyPrintExtra(ID);');

// This section prefix is expected by v8_foozzie.py. Existing prefixes
// (e.g. from CrashTests) are cleaned up with CLEANED_PREFIX.
const SECTION_PREFIX = 'v8-foozzie source: ';
const CLEANED_PREFIX = 'v***************e: ';

/**
 * Babel statement for calling deep printing from the fuzz library.
 */
function prettyPrintStatement(variable) {
  return prettyPrint({ ID: babelTypes.cloneDeep(variable) });
}

/**
 * As above, but using the "extra" variant, which will reduce printing
 * after too many calls to prevent I/O flooding.
 */
function prettyPrintExtraStatement(variable) {
  return prettyPrintExtra({ ID: babelTypes.cloneDeep(variable) });
}

/**
 * Mutator for suppressing known and/or unfixable issues.
 */
class DifferentialFuzzSuppressions extends mutator.Mutator {
  get visitor() {
    let thisMutator = this;

    return {
      // Clean up strings containing the magic section prefix. Those can come
      // e.g. from CrashTests and would confuse the deduplication in
      // v8_foozzie.py.
      StringLiteral(path) {
        if (path.node.value.startsWith(SECTION_PREFIX)) {
          const postfix = path.node.value.substring(SECTION_PREFIX.length);
          path.node.value = CLEANED_PREFIX + postfix;
          thisMutator.annotate(path.node, 'Replaced magic string');
        }
      },
      // Known precision differences: https://crbug.com/1063568
      BinaryExpression(path) {
        if (path.node.operator == '**') {
          path.node.operator = '+';
          thisMutator.annotate(path.node, 'Replaced **');
        }
      },
      // Unsupported language feature: https://crbug.com/1020573
      MemberExpression(path) {
        if (path.node.property.name == "arguments") {
          let replacement = common.randomVariable(path);
          if (!replacement) {
            replacement = babelTypes.thisExpression();
          }
          thisMutator.annotate(replacement, 'Replaced .arguments');
          thisMutator.replaceWithSkip(path, replacement);
        }
      },
    };
  }
}

/**
 * Mutator for tracking original input files and for extra printing.
 */
class DifferentialFuzzMutator extends mutator.Mutator {
  constructor(settings) {
    super();
    this.settings = settings;
  }

  /**
   * Looks for the dummy node that marks the beginning of an input file
   * from the corpus.
   */
  isSectionStart(path) {
    return !!common.getOriginalPath(path.node);
  }

  /**
   * Create print statements for printing the magic section prefix that's
   * expected by v8_foozzie.py to differentiate different source files.
   */
  getSectionHeader(path) {
    const orig = common.getOriginalPath(path.node);
    return printValue({
      VALUE: babelTypes.stringLiteral(SECTION_PREFIX + orig),
    });
  }

  /**
   * Create statements for extra printing at the end of a section. We print
   * the number of caught exceptions, a generic hash of all observed values
   * and the contents of all variables in scope.
   */
  getSectionFooter(path) {
    const variables = common.availableVariables(path);
    const statements = variables.map(prettyPrintStatement);
    statements.unshift(printCaught());
    statements.unshift(printHash());
    const statement = babelTypes.tryStatement(
        babelTypes.blockStatement(statements),
        babelTypes.catchClause(
            babelTypes.identifier('e'),
            babelTypes.blockStatement([])));
    this.annotate(statement, 'Print variables and exceptions from section');
    return statement;
  }

  /**
   * Helper for printing the contents of several variables.
   */
  printVariables(path, nodes) {
    const statements = [];
    for (const node of nodes) {
      if (!babelTypes.isIdentifier(node) ||
          !common.isVariableIdentifier(node.name))
        continue;
      statements.push(prettyPrintExtraStatement(node));
    }
    if (statements.length) {
      this.annotate(statements[0], 'Extra variable printing');
      this.insertAfterSkip(path, statements);
    }
  }

  get visitor() {
    const thisMutator = this;
    const settings = this.settings;

    return {
      // Replace existing normal print statements with deep printing.
      CallExpression(path) {
        if (babelTypes.isIdentifier(path.node.callee) &&
            path.node.callee.name == 'print') {
          path.node.callee = babelTypes.identifier('__prettyPrintExtra');
          thisMutator.annotate(path.node, 'Pretty printing');
        }
      },
      // Either print or track caught exceptions, guarded by a probability.
      CatchClause(path) {
        const probability = random.random();
        if (probability < settings.DIFF_FUZZ_EXTRA_PRINT &&
            path.node.param &&
            babelTypes.isIdentifier(path.node.param)) {
          const statement = prettyPrintExtraStatement(path.node.param);
          path.node.body.body.unshift(statement);
        } else if (probability < settings.DIFF_FUZZ_TRACK_CAUGHT) {
          path.node.body.body.unshift(incCaught());
        }
      },
      // Insert section headers and footers between the contents of two
      // original source files. We detect the dummy no-op nodes that were
      // previously tagged with the original path of the file.
      Noop(path) {
        if (!thisMutator.isSectionStart(path)) {
          return;
        }
        const header = thisMutator.getSectionHeader(path);
        const footer = thisMutator.getSectionFooter(path);
        thisMutator.insertBeforeSkip(path, footer);
        thisMutator.insertBeforeSkip(path, header);
      },
      // Additionally we print one footer in the end.
      Program: {
        exit(path) {
          const footer = thisMutator.getSectionFooter(path);
          path.node.body.push(footer);
        },
      },
      // Print contents of variables after assignments, guarded by a
      // probability.
      ExpressionStatement(path) {
        if (!babelTypes.isAssignmentExpression(path.node.expression) ||
            !random.choose(settings.DIFF_FUZZ_EXTRA_PRINT)) {
          return;
        }
        const left = path.node.expression.left;
        if (babelTypes.isMemberExpression(left)) {
          thisMutator.printVariables(path, [left.object]);
        } else {
          thisMutator.printVariables(path, [left]);
        }
      },
      // Print contents of variables after declaration, guarded by a
      // probability.
      VariableDeclaration(path) {
        if (babelTypes.isLoop(path.parent) ||
            !random.choose(settings.DIFF_FUZZ_EXTRA_PRINT)) {
          return;
        }
        const identifiers = path.node.declarations.map(decl => decl.id);
        thisMutator.printVariables(path, identifiers);
      },
    };
  }
}

module.exports = {
  DifferentialFuzzMutator: DifferentialFuzzMutator,
  DifferentialFuzzSuppressions: DifferentialFuzzSuppressions,
};

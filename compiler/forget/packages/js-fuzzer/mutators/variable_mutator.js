// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Variables mutator.
 */

'use strict';

const babelTypes = require('@babel/types');

const common = require('./common.js');
const random = require('../random.js');
const mutator = require('./mutator.js');

function _isInFunctionParam(path) {
  const child = path.find(p => p.parent && babelTypes.isFunction(p.parent));
  return child && child.parentKey === 'params';
}

class VariableMutator extends mutator.Mutator {
  constructor(settings) {
    super();
    this.settings = settings;
  }

  get visitor() {
    const thisMutator = this;

    return {
      Identifier(path) {
        if (!random.choose(thisMutator.settings.MUTATE_VARIABLES)) {
          return;
        }

        if (!common.isVariableIdentifier(path.node.name)) {
          return;
        }

        // Don't mutate variables that are being declared.
        if (babelTypes.isVariableDeclarator(path.parent)) {
          return;
        }

        // Don't mutate function params.
        if (_isInFunctionParam(path)) {
          return;
        }

        if (common.isInForLoopCondition(path) ||
            common.isInWhileLoop(path)) {
          return;
        }

        const randVar = common.randomVariable(path);
        if (!randVar) {
          return;
        }

        const newName = randVar.name;
        thisMutator.annotate(
            path.node,
            `Replaced ${path.node.name} with ${newName}`);
        path.node.name = newName;
      }
    };
  }
}

module.exports = {
  VariableMutator: VariableMutator,
};

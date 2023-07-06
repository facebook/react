// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Variables mutator.
 */

'use strict';

const babelTemplate = require('@babel/template').default;
const babelTypes = require('@babel/types');

const common = require('./common.js');
const random = require('../random.js');
const mutator = require('./mutator.js');

const MAX_MUTATION_RECURSION_DEPTH = 5;

class VariableOrObjectMutator extends mutator.Mutator {
  constructor(settings) {
    super();
    this.settings = settings;
  }

  _randomVariableOrObject(path) {
    const randomVar = common.randomVariable(path);
    if (random.choose(0.05) || !randomVar) {
      return common.randomObject();
    }

    return randomVar;
  }

  _randomVariableOrObjectMutations(path, recurseDepth=0) {
    if (recurseDepth >= MAX_MUTATION_RECURSION_DEPTH) {
      return new Array();
    }

    const probability = random.random();

    if (probability < 0.3) {
      const first = this._randomVariableOrObjectMutations(path, recurseDepth + 1);
      const second = this._randomVariableOrObjectMutations(
          path, recurseDepth + 1);
      return first.concat(second);
    }

    const randVarOrObject = this._randomVariableOrObject(path);
    const randProperty = common.randomProperty(randVarOrObject);
    let newRandVarOrObject = randVarOrObject;
    if (random.choose(0.2)) {
      newRandVarOrObject = this._randomVariableOrObject(path);
    }

    const mutations = new Array();

    if (probability < 0.4) {
      const template = babelTemplate(
          'delete IDENTIFIER[PROPERTY], __callGC()')
      mutations.push(template({
        IDENTIFIER: randVarOrObject,
        PROPERTY: randProperty
      }));
    } else if (probability < 0.5) {
      const template = babelTemplate(
          'IDENTIFIER[PROPERTY], __callGC()')
      mutations.push(template({
        IDENTIFIER: randVarOrObject,
        PROPERTY: randProperty
      }));
    } else if (probability < 0.6) {
      const template = babelTemplate(
          'IDENTIFIER[PROPERTY] = RANDOM, __callGC()')
      mutations.push(template({
        IDENTIFIER: randVarOrObject,
        PROPERTY: randProperty,
        RANDOM: common.randomValue(path),
      }));
    } else if (probability < 0.7) {
      mutations.push(
          babelTypes.expressionStatement(
              common.callRandomFunction(path, randVarOrObject)));
    } else if (probability < 0.8) {
      const template = babelTemplate(
          'VAR = IDENTIFIER, __callGC()')
      var randomVar = common.randomVariable(path);
      if (!randomVar) {
        return mutations;
      }

      mutations.push(template({
        VAR: randomVar,
        IDENTIFIER: randVarOrObject,
      }));
    } else if (probability < 0.9) {
      const template = babelTemplate(
          'if (IDENTIFIER != null && typeof(IDENTIFIER) == "object") ' +
          'Object.defineProperty(IDENTIFIER, PROPERTY, {value: VALUE})')
      mutations.push(template({
          IDENTIFIER: newRandVarOrObject,
          PROPERTY: randProperty,
          VALUE: common.randomValue(path),
      }));
    } else {
      const template = babelTemplate(
          'if (IDENTIFIER != null && typeof(IDENTIFIER) == "object") ' +
          'Object.defineProperty(IDENTIFIER, PROPERTY, {' +
          'get: function() { GETTER_MUTATION ; return VALUE; },' +
          'set: function(value) { SETTER_MUTATION; }' +
          '})');
      mutations.push(template({
          IDENTIFIER: newRandVarOrObject,
          PROPERTY: randProperty,
          GETTER_MUTATION: this._randomVariableOrObjectMutations(
              path, recurseDepth + 1),
          SETTER_MUTATION: this._randomVariableOrObjectMutations(
              path, recurseDepth + 1),
          VALUE: common.randomValue(path),
      }));
    }

    return mutations;
  }


  get visitor() {
    const settings = this.settings;
    const thisMutator = this;

    return {
      ExpressionStatement(path) {
        if (!random.choose(settings.ADD_VAR_OR_OBJ_MUTATIONS)) {
          return;
        }

        const mutations = thisMutator._randomVariableOrObjectMutations(path);
        thisMutator.annotate(mutations[0], 'Random mutation');

        if (random.choose(0.5)) {
          thisMutator.insertBeforeSkip(path, mutations);
        } else {
          thisMutator.insertAfterSkip(path, mutations);
        }

        path.skip();
      }
    };
  }
}

module.exports = {
  VariableOrObjectMutator: VariableOrObjectMutator,
};

// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Mutator for array expressions.
 */

'use strict';

const babelTypes = require('@babel/types');

const common = require('./common.js');
const mutator = require('./mutator.js');
const random = require('../random.js');

// Blueprint for choosing the maximum number of mutations. Bias towards
// performing only one mutation.
const MUTATION_CHOICES = [1, 1, 1, 1, 1, 2, 2, 2, 3];

const MAX_ARRAY_LENGTH = 50;

class ArrayMutator extends mutator.Mutator {
  constructor(settings) {
    super();
    this.settings = settings;
  }

  get visitor() {
    const thisMutator = this;

    return {
      ArrayExpression(path) {
        const elements = path.node.elements;
        if (!random.choose(thisMutator.settings.MUTATE_ARRAYS) ||
            elements.length > MAX_ARRAY_LENGTH) {
          return;
        }

        // Annotate array expression with the action taken, indicating
        // if we also replaced elements.
        function annotate(message, replace) {
          if (replace) message += ' (replaced)';
          thisMutator.annotate(path.node, message);
        }

        // Add or replace elements at a random index.
        function randomSplice(replace, ...args) {
          // Choose an index that's small enough to replace all desired items.
          const index = random.randInt(0, elements.length - replace);
          elements.splice(index, replace, ...args);
        }

        function duplicateElement(replace) {
          const element = random.single(elements);
          if (!element || common.isLargeNode(element)) {
            return;
          }
          annotate('Duplicate an element', replace);
          randomSplice(replace, babelTypes.cloneDeep(element));
        }

        function insertRandomValue(replace) {
          annotate('Insert a random value', replace);
          randomSplice(replace, common.randomValue(path));
        }

        function insertHole(replace) {
          annotate('Insert a hole', replace);
          randomSplice(replace, null);
        }

        function removeElements(count) {
          annotate('Remove elements');
          randomSplice(random.randInt(1, count));
        }

        function shuffle() {
          annotate('Shuffle array');
          random.shuffle(elements);
        }

        // Mutation options. Repeated mutations have a higher probability.
        const mutations = [
          () => duplicateElement(1),
          () => duplicateElement(1),
          () => duplicateElement(1),
          () => duplicateElement(0),
          () => duplicateElement(0),
          () => insertRandomValue(1),
          () => insertRandomValue(1),
          () => insertRandomValue(0),
          () => insertHole(1),
          () => insertHole(0),
          () => removeElements(1),
          () => removeElements(elements.length),
          shuffle,
        ];

        // Perform several mutations.
        const count = random.single(MUTATION_CHOICES);
        for (let i = 0; i < count; i++) {
          random.single(mutations)();
        }

        // Don't recurse on nested arrays.
        path.skip();
      },
    }
  }
}

module.exports = {
  ArrayMutator: ArrayMutator,
};

// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Expression mutator.
 */

'use strict';

const babelTypes = require('@babel/types');

const random = require('../random.js');
const mutator = require('./mutator.js');

class ExpressionMutator extends mutator.Mutator {
  constructor(settings) {
    super();
    this.settings = settings;
  }

  get visitor() {
    const thisMutator = this;

    return {
      ExpressionStatement(path) {
        if (!random.choose(thisMutator.settings.MUTATE_EXPRESSIONS)) {
          return;
        }

        const probability = random.random();

        if (probability < 0.7) {
          const repeated = babelTypes.cloneDeep(path.node);
          thisMutator.annotate(repeated, 'Repeated');
          thisMutator.insertBeforeSkip(path, repeated);
        } else if (path.key > 0) {
          // Get a random previous sibling.
          const prev = path.getSibling(random.randInt(0, path.key - 1));
          if (!prev || !prev.node) {
            return;
          }
          // Either select a previous or the current node to clone.
          const [selected, destination] = random.shuffle([prev, path]);
          if (selected.isDeclaration()) {
            return;
          }
          const cloned = babelTypes.cloneDeep(selected.node);
          thisMutator.annotate(cloned, 'Cloned sibling');
          if (random.choose(0.5)) {
            thisMutator.insertBeforeSkip(destination, cloned);
          } else {
            thisMutator.insertAfterSkip(destination, cloned);
          }
        }
      },
    };
  }
}

module.exports = {
  ExpressionMutator: ExpressionMutator,
};

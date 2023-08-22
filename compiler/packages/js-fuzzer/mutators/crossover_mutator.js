// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Expression mutator.
 */

'use strict';

const babelTemplate = require('@babel/template').default;

const common = require('./common.js');
const random = require('../random.js');
const mutator = require('./mutator.js');
const sourceHelpers = require('../source_helpers.js');

class CrossOverMutator extends mutator.Mutator {
  constructor(settings, db) {
    super();
    this.settings = settings;
    this.db = db;
  }

  get visitor() {
    const thisMutator = this;

    return [{
      ExpressionStatement(path) {
        if (!random.choose(thisMutator.settings.MUTATE_CROSSOVER_INSERT)) {
          return;
        }

        const canHaveSuper = Boolean(path.findParent(x => x.isClassMethod()));
        const randomExpression = thisMutator.db.getRandomStatement(
            {canHaveSuper: canHaveSuper});

        // Insert the statement.
        let toInsert = babelTemplate(
            randomExpression.source,
            sourceHelpers.BABYLON_REPLACE_VAR_OPTIONS);
        const dependencies = {};

        if (randomExpression.dependencies) {
          const variables = common.availableVariables(path);
          if (!variables.length) {
            return;
          }
          for (const dependency of randomExpression.dependencies) {
            dependencies[dependency] = random.single(variables);
          }
        }

        try {
          toInsert = toInsert(dependencies);
        } catch (e) {
          if (thisMutator.settings.testing) {
            // Fail early in tests.
            throw e;
          }
          console.log('ERROR: Failed to parse:', randomExpression.source);
          console.log(e);
          return;
        }

        thisMutator.annotate(
            toInsert,
            'Crossover from ' + randomExpression.originalPath);

        if (random.choose(0.5)) {
          thisMutator.insertBeforeSkip(path, toInsert);
        } else {
          thisMutator.insertAfterSkip(path, toInsert);
        }

        path.skip();
      },
    }, {
    }];
  }
}

module.exports = {
  CrossOverMutator: CrossOverMutator,
};

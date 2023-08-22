// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Mutator for object expressions.
 */

'use strict';

const babelTypes = require('@babel/types');

const common = require('./common.js');
const mutator = require('./mutator.js');
const random = require('../random.js');

const MAX_PROPERTIES = 50;

/**
 * Turn the key of an object property into a string literal.
 */
function keyToString(key) {
  if (babelTypes.isNumericLiteral(key)) {
    return babelTypes.stringLiteral(key.value.toString());
  }
  if (babelTypes.isIdentifier(key)) {
    return babelTypes.stringLiteral(key.name);
  }
  // Already a string literal.
  return key;
}

class ObjectMutator extends mutator.Mutator {
  constructor(settings) {
    super();
    this.settings = settings;
  }

  get visitor() {
    const thisMutator = this;

    return {
      ObjectExpression(path) {
        const properties = path.node.properties;
        if (!random.choose(thisMutator.settings.MUTATE_OBJECTS) ||
            properties.length > MAX_PROPERTIES) {
          return;
        }

        // Use the indices of object properties for mutations. We ignore
        // getters and setters.
        const propertyIndicies = [];
        for (const [index, property] of properties.entries()) {
          if (babelTypes.isObjectProperty(property)) {
            propertyIndicies.push(index);
          }
        }

        // The mutations below require at least one property.
        if (!propertyIndicies.length) {
          return;
        }

        // Annotate object expression with the action taken.
        function annotate(message) {
          thisMutator.annotate(path.node, message);
        }

        function getOneRandomProperty() {
          return properties[random.single(propertyIndicies)];
        }

        function getTwoRandomProperties() {
          const [a, b] = random.sample(propertyIndicies, 2);
          return [properties[a], properties[b]];
        }

        function swapPropertyValues() {
          if (propertyIndicies.length > 1) {
            annotate('Swap properties');
            const [a, b] = getTwoRandomProperties();
            [a.value, b.value] = [b.value, a.value];
          }
        }

        function duplicatePropertyValue() {
          if (propertyIndicies.length > 1) {
            const [a, b] = random.shuffle(getTwoRandomProperties());
            if (common.isLargeNode(b.value)) {
              return;
            }
            annotate('Duplicate a property value');
            a.value = babelTypes.cloneDeep(b.value);
          }
        }

        function insertRandomValue() {
          annotate('Insert a random value');
          const property = getOneRandomProperty();
          property.value = common.randomValue(path);
        }

        function stringifyKey() {
          annotate('Stringify a property key');
          const property = getOneRandomProperty();
          property.key = keyToString(property.key);
        }

        function removeProperty() {
          annotate('Remove a property');
          properties.splice(random.single(propertyIndicies), 1);
        }

        // Mutation options. Repeated mutations have a higher probability.
        const mutations = [
          swapPropertyValues,
          swapPropertyValues,
          duplicatePropertyValue,
          duplicatePropertyValue,
          insertRandomValue,
          insertRandomValue,
          removeProperty,
          stringifyKey,
        ];

        // Perform mutation.
        random.single(mutations)();
      },
    }
  }
}

module.exports = {
  ObjectMutator: ObjectMutator,
};

/**
 * @providesModule onlyChild
 */
"use strict";

var ReactComponent = require('ReactComponent');

var invariant = require('invariant');

/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection. The current implementation of this
 * function assumes that children have been flattened, but the purpose of this
 * helper function is to abstract away the particular structure of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactComponent} The first and only `ReactComponent` contained in the
 * structure.
 */
function onlyChild(children) {
  invariant(Array.isArray(children), 'onlyChild must be passed a valid Array.');
  invariant(
    children.length === 1,
    'onlyChild must be passed an Array with exactly one child.'
  );
  invariant(
    ReactComponent.isValidComponent(children[0]),
    'onlyChild must be passed an Array with exactly one child.'
  );
  return children[0];
}

module.exports = onlyChild;

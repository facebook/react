/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
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

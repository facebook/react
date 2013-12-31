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
 * @providesModule validateNodeNesting
 */

"use strict";

var emptyFunction = require('emptyFunction');

var validateNodeNesting = emptyFunction;

if (__DEV__) {
  // TODO: Validate all possible tag combinations, along the lines of
  // https://github.com/facebook/xhp/blob/master/php-lib/html.php

  var nodeCanContainNode = function(parentNodeName, childNodeName) {
    parentNodeName = parentNodeName.toLowerCase();
    childNodeName = childNodeName.toLowerCase();

    if (childNodeName === 'p') {
      return parentNodeName !== 'p';
    } else if (childNodeName === 'tr') {
      return ['tbody', 'tfoot', 'thead'].indexOf(parentNodeName) !== -1;
    } else if (['tbody', 'tfoot', 'thead'].indexOf(childNodeName) !== -1) {
      return parentNodeName === 'table';
    }

    return true;
  };

  validateNodeNesting = function(parentNodeName, childNodeName) {
    if (__DEV__) {
      if (!nodeCanContainNode(parentNodeName, childNodeName)) {
        console.warn(
          'validateNodeNesting(...): Node of type ' +
          parentNodeName.toLowerCase() + ' cannot contain node of type ' +
          childNodeName.toLowerCase() + '.'
        );
      }
    }
  };
}

module.exports = validateNodeNesting;

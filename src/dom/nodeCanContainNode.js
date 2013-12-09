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
 * @providesModule nodeCanContainNode
 */

"use strict";

// TODO: Validate all possible tag combinations, along the lines of
// https://github.com/facebook/xhp/blob/master/php-lib/html.php

var nodeCanContainNode = function(parentNodeName, childNodeName) {
  if (childNodeName === 'P') {
    return parentNodeName !== 'P';
  } else if (childNodeName === 'TR') {
    return (
      parentNodeName === 'TBODY' ||
      parentNodeName === 'TFOOT' ||
      parentNodeName === 'THEAD'
    );
  } else if (childNodeName === 'TBODY' || childNodeName === 'TFOOT' ||
      childNodeName === 'THEAD') {
    return parentNodeName === 'TABLE';
  }
  return true;
};

module.exports = nodeCanContainNode;

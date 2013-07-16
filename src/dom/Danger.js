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
 * @providesModule Danger
 */

/*jslint evil: true */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');

var throwIf = require('throwIf');

var DOM_UNSUPPORTED;
var NO_MARKUP_PARENT;
var NO_MULTI_MARKUP;
if (__DEV__) {
  DOM_UNSUPPORTED =
    'You may not insert markup into the document while you are in a worker ' +
    'thread. It\'s not you, it\'s me. This is likely the fault of the ' +
    'framework. Please report this immediately.';
  NO_MARKUP_PARENT =
    'You have attempted to inject markup without a suitable parent. This is ' +
    'likely the fault of the framework - please report immediately.';
  NO_MULTI_MARKUP =
    'The framework has attempted to either insert zero or multiple markup ' +
    'roots into a single location when it should not. This is a serious ' +
    'error - a fault of the framework - please report immediately.';
}

var validateMarkupParams;
if (__DEV__) {
  validateMarkupParams = function(parentNode, markup) {
    throwIf(!ExecutionEnvironment.canUseDOM, DOM_UNSUPPORTED);
    throwIf(!parentNode || !parentNode.tagName, NO_MARKUP_PARENT);
    throwIf(!markup, NO_MULTI_MARKUP);
  };
}

/**
 * Super-dangerously inserts markup into existing DOM structure. Seriously, you
 * don't want to use this module unless you are building a framework. This
 * requires that the markup that you are inserting represents the root of a
 * tree. We do not support the case where there `markup` represents several
 * roots.
 *
 * @param {Element} parentNode Parent DOM element.
 * @param {string} markup Markup to dangerously insert.
 * @param {number} index Position to insert markup at.
 */
function dangerouslyInsertMarkupAt(parentNode, markup, index) {
  if (__DEV__) {
    validateMarkupParams(parentNode, markup);
  }
  if (index) {
    var afterNode = parentNode.childNodes[index - 1];
    afterNode.insertAdjacentHTML('afterend', markup);
  } else if (parentNode.firstChild) {
    parentNode.firstChild.insertAdjacentHTML('beforebegin', markup);
  } else { // No children
    parentNode.innerHTML = markup;
  }
}

/**
 * Replaces a node with a string of markup at its current position within its
 * parent. `childNode` must be in the document (or at least within a parent
 * node). The string of markup must represent a tree of markup with a single
 * root.
 *
 * @param {Element} childNode Child node to replace.
 * @param {string} markup Markup to dangerously replace child with.
 */
function dangerouslyReplaceNodeWithMarkup(childNode, markup) {
  var parentNode = childNode.parentNode;
  if (__DEV__) {
    validateMarkupParams(parentNode, markup);
  }
  childNode.insertAdjacentHTML('afterend', markup);
  parentNode.removeChild(childNode);
}

var Danger = {
  dangerouslyInsertMarkupAt: dangerouslyInsertMarkupAt,
  dangerouslyReplaceNodeWithMarkup: dangerouslyReplaceNodeWithMarkup
};

module.exports = Danger;

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

/*jslint evil: true, sub: true */

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
 * Dummy container used to render all markup.
 */
var dummyNode = ExecutionEnvironment.canUseDOM ?
  document.createElement('div') :
  null;

/**
 * Some browsers cannot use `innerHTML` to render certain elements standalone,
 * so we wrap them, render the wrapped nodes, then extract the desired node.
 */
var markupWrap = {
  'option': [1, '<select multiple="true">', '</select>'],
  'legend': [1, '<fieldset>', '</fieldset>'],
  'area': [1, '<map>', '</map>'],
  'param': [1, '<object>', '</object>'],
  'thead': [1, '<table>', '</table>'],
  'tr': [2, '<table><tbody>', '</tbody></table>'],
  'col': [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  'td': [3, '<table><tbody><tr>', '</tr></tbody></table>']
};
markupWrap['optgroup'] = markupWrap['option'];
markupWrap['tbody'] = markupWrap['thead'];
markupWrap['tfoot'] = markupWrap['thead'];
markupWrap['colgroup'] = markupWrap['thead'];
markupWrap['caption'] = markupWrap['thead'];
markupWrap['th'] = markupWrap['td'];

/**
 * In IE8, certain elements cannot render alone, so wrap all elements.
 */
var defaultWrap = [1, '?<div>', '</div>'];

/**
 * Feature detection, remove wraps that are unnecessary for the current browser.
 */
if (dummyNode) {
  for (var nodeName in markupWrap) {
    if (!markupWrap.hasOwnProperty(nodeName)) {
      continue;
    }
    dummyNode.innerHTML = '<' + nodeName + '></' + nodeName + '>';
    if (dummyNode.firstChild) {
      markupWrap[nodeName] = null;
    }
  }
  dummyNode.innerHTML = '<link />';
  if (dummyNode.firstChild) {
    defaultWrap = null;
  }
}

/**
 * Renders markup into nodes. The returned HTMLCollection is live and should be
 * used immediately (or at least before the next invocation to `renderMarkup`).
 *
 * NOTE: Extracting the `nodeName` does not require a regular expression match
 * because we make assumptions about React-generated markup (i.e. there are no
 * spaces surrounding the opening tag and there is at least one attribute).
 * @see http://jsperf.com/extract-nodename
 *
 * @param {string} markup
 * @return {*} An HTMLCollection.
 */
function renderMarkup(markup) {
  var node = dummyNode;
  var nodeName = markup.substring(1, markup.indexOf(' '));

  var wrap = markupWrap[nodeName.toLowerCase()] || defaultWrap;
  if (wrap) {
    node.innerHTML = wrap[1] + markup + wrap[2];

    var wrapDepth = wrap[0];
    while (wrapDepth--) {
      node = node.lastChild;
    }
  } else {
    node.innerHTML = markup;
  }
  return node.childNodes;
}

/**
 * Inserts node after 'after'. If 'after' is null, inserts it after nothing,
 * which is inserting it at the beginning.
 *
 * @param {Element} elem Parent element.
 * @param {Element} insert Element to insert.
 * @param {Element} after Element to insert after.
 * @return {Element} Element that was inserted.
 */
function insertNodeAfterNode(elem, insert, after) {
  if (__DEV__) {
    throwIf(!ExecutionEnvironment.canUseDOM, DOM_UNSUPPORTED);
  }
  if (after) {
    if (after.nextSibling) {
      return elem.insertBefore(insert, after.nextSibling);
    } else {
      return elem.appendChild(insert);
    }
  } else {
    return elem.insertBefore(insert, elem.firstChild);
  }
}

/**
 * Slow: Should only be used when it is known there are a few (or one) element
 * in the node list.
 * @param {Element} parentRootDomNode Parent element.
 * @param {HTMLCollection} htmlCollection HTMLCollection to insert.
 * @param {Element} after Element to insert the node list after.
 */
function inefficientlyInsertHTMLCollectionAfter(
    parentRootDomNode,
    htmlCollection,
    after) {

  if (__DEV__) {
    throwIf(!ExecutionEnvironment.canUseDOM, DOM_UNSUPPORTED);
  }
  var ret;
  var originalLength = htmlCollection.length;
  // Access htmlCollection[0] because htmlCollection shrinks as we remove items.
  // `insertNodeAfterNode` will remove items from the htmlCollection.
  for (var i = 0; i < originalLength; i++) {
    ret =
      insertNodeAfterNode(parentRootDomNode, htmlCollection[0], ret || after);
  }
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
  var htmlCollection = renderMarkup(markup);
  var afterNode = index ? parentNode.childNodes[index - 1] : null;
  inefficientlyInsertHTMLCollectionAfter(parentNode, htmlCollection, afterNode);
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
  var htmlCollection = renderMarkup(markup);
  if (__DEV__) {
    throwIf(htmlCollection.length !== 1, NO_MULTI_MARKUP);
  }
  parentNode.replaceChild(htmlCollection[0], childNode);
}

var Danger = {
  dangerouslyInsertMarkupAt: dangerouslyInsertMarkupAt,
  dangerouslyReplaceNodeWithMarkup: dangerouslyReplaceNodeWithMarkup
};

module.exports = Danger;

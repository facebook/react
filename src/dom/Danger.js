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
 * @typechecks static-only
 */

/*jslint evil: true, sub: true */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');

var invariant = require('invariant');

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
 * Extracts the `nodeName` from a string of markup. This does not require a
 * regular expression match because we make assumptions about React-generated
 * markup (i.e. there are no spaces surrounding the opening tag and there is at
 * least an ID attribute).
 *
 * NOTE: Extracting the `nodeName` does not require a regular expression match
 * because we make assumptions about React-generated markup (i.e. there are no
 * spaces surrounding the opening tag and there is at least one attribute).
 *
 * @param {string} markup String of markup.
 * @return {string} Node name of the supplied markup.
 * @see http://jsperf.com/extract-nodename
 */
function getNodeName(markup) {
  return markup.substring(1, markup.indexOf(' '));
}

/**
 * Renders markup into nodes. The returned HTMLCollection is live and should be
 * used immediately (or at least before the next invocation to `renderMarkup`).
 *
 * @param {string} markup Markup for one or more nodes with the same `nodeName`.
 * @param {?string} nodeName Optional, the lowercase node name of the markup.
 * @return {*} An HTMLCollection.
 */
function renderMarkup(markup, nodeName) {
  nodeName = nodeName || getNodeName(markup);
  var node = dummyNode;
  var wrap = markupWrap[nodeName] || defaultWrap;
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

var Danger = {

  /**
   * Renders markup into an array of nodes. The markup is expected to render
   * into a list of root nodes. Also, the length of `parentNodes` and `markup`
   * should be the same.
   *
   * @param {array<string>} markupList List of markup strings to render.
   * @return {array<DOMElement>} List of rendered nodes.
   * @internal
   */
  dangerouslyRenderMarkup: function(markupList) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyRenderMarkup(...): Cannot render markup in a Worker ' +
      'thread. This is likely a bug in the framework. Please report ' +
      'immediately.'
    );
    var nodeName;
    var markupByNodeName = {};
    // Group markup by `nodeName` if a wrap is necessary, else by '*'.
    for (var i = 0; i < markupList.length; i++) {
      invariant(
        markupList[i],
        'dangerouslyRenderMarkup(...): Missing markup.'
      );
      nodeName = getNodeName(markupList[i]);
      nodeName = markupWrap[nodeName] ? nodeName : '*';
      markupByNodeName[nodeName] = markupByNodeName[nodeName] || [];
      markupByNodeName[nodeName][i] = markupList[i];
    }
    var renderedMarkup = [];
    for (nodeName in markupByNodeName) {
      if (!markupByNodeName.hasOwnProperty(nodeName)) {
        continue;
      }
      var markupListByNodeName = markupByNodeName[nodeName];
      var markup = markupListByNodeName.join('');
      // Render each group of markup.
      var childNode = renderMarkup(markup, nodeName)[0];
      // Restore the initial ordering.
      for (var j = 0; j < markupListByNodeName.length; j++) {
        // `markupListByNodeName` may be a sparse array.
        if (markupListByNodeName[j]) {
          invariant(childNode, 'dangerouslyRenderMarkup(...): Missing node.');
          renderedMarkup[j] = childNode;
          childNode = childNode.nextSibling;
        }
      }
      invariant(!childNode, 'dangerouslyRenderMarkupO(...): Unexpected nodes.');
    }
    return renderedMarkup;
  },

  /**
   * Replaces a node with a string of markup at its current position within its
   * parent. The markup must render into a single root node.
   *
   * @param {DOMElement} oldChild Child node to replace.
   * @param {string} markup Markup to render in place of the child node.
   * @internal
   */
  dangerouslyReplaceNodeWithMarkup: function(oldChild, markup) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a ' +
      'worker thread. This is likely a bug in the framework. Please report ' +
      'immediately.'
    );
    invariant(markup, 'dangerouslyReplaceNodeWithMarkup(...): Missing markup.');
    var newChild = renderMarkup(markup)[0];
    oldChild.parentNode.replaceChild(newChild, oldChild);
  }

};

module.exports = Danger;

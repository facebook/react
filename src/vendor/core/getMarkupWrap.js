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
 * @providesModule getMarkupWrap
 */

var ExecutionEnvironment = require('ExecutionEnvironment');

var invariant = require('invariant');

/**
 * Dummy container used to detect which wraps are necessary.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Some browsers cannot use `innerHTML` to render certain elements standalone,
 * so we wrap them, render the wrapped nodes, then extract the desired node.
 *
 * In IE8, certain elements cannot render alone, so wrap all elements ('*').
 */
var shouldWrap = {};
var markupWrap = {
  'area': [1, '<map>', '</map>'],
  'caption': [1, '<table>', '</table>'],
  'col': [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  'colgroup': [1, '<table>', '</table>'],
  'legend': [1, '<fieldset>', '</fieldset>'],
  'optgroup': [1, '<select multiple="true">', '</select>'],
  'option': [1, '<select multiple="true">', '</select>'],
  'param': [1, '<object>', '</object>'],
  'tbody': [1, '<table>', '</table>'],
  'td': [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  'tfoot': [1, '<table>', '</table>'],
  'th': [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  'thead': [1, '<table>', '</table>'],
  'tr': [2, '<table><tbody>', '</tbody></table>'],
  '*': [1, '?<div>', '</div>']
};

/**
 * Gets the markup wrap configuration for the supplied `nodeName`.
 *
 * NOTE: This lazily detects which wraps are necessary for the current browser.
 *
 * @param {string} nodeName Lowercase `nodeName`.
 * @return {?array} Markup wrap configuration, if applicable.
 */
function getMarkupWrap(nodeName) {
  invariant(!!dummyNode, 'Markup wrapping node not initialized');
  if (!markupWrap.hasOwnProperty(nodeName)) {
    nodeName = '*';
  }
  if (!shouldWrap.hasOwnProperty(nodeName)) {
    if (nodeName === '*') {
      dummyNode.innerHTML = '<link />';
    } else {
      dummyNode.innerHTML = '<' + nodeName + '></' + nodeName + '>';
    }
    shouldWrap[nodeName] = !dummyNode.firstChild;
  }
  return shouldWrap[nodeName] ? markupWrap[nodeName] : null;
}


module.exports = getMarkupWrap;

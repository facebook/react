/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {checkHtmlStringCoercion} from 'shared/CheckStringCoercion';

const scriptRegex = /(<\/|<)(s)(cript)/gi;
const scriptReplacer = (match, prefix, s, suffix) =>
  `${prefix}${substitutions[s]}${suffix}`;
const substitutions = {
  s: '\\u0073',
  S: '\\u0053',
};

/**
 * Escapes javascript for embedding into HTML.
 *
 * @param {*} scriptText Text value to escape.
 * @return {string} An escaped string.
 */
function escapeScriptForBrowser(scriptText) {
  if (typeof scriptText === 'boolean' || typeof scriptText === 'number') {
    // this shortcircuit helps perf for types that we know will never have
    // special characters, especially given that this function is used often
    // for numeric dom ids.
    return '' + scriptText;
  }
  if (__DEV__) {
    checkHtmlStringCoercion(scriptText);
  }
  return ('' + scriptText).replace(scriptRegex, scriptReplacer);
}

export default escapeScriptForBrowser;

/**
 * Babel works across all browsers, however it requires many polyfills.
 */

import 'core-js/es6/weak-map';
import 'core-js/es6/weak-set';
import 'core-js/es6/number';
import 'core-js/es6/string';
import 'core-js/es6/array';
import 'core-js/modules/es6.object.set-prototype-of';

import {transform} from '@babel/standalone';

const options = {
  presets: ['es2015', 'stage-3', 'react'],
  // This is important for IE9 and Safari 7.1. Setting this to false
  // prevents highlighting in error messages. We also don't use this
  // when reporting errors
  highlightCode: false
}

export function compile(raw) {
  return transform(raw, options).code
}

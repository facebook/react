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

const presets = ['es2015', 'stage-3', 'react'];

export function compile(raw) {
  return transform(raw, {presets}).code;
}

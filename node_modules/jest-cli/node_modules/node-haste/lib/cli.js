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
 */
var E = String.fromCharCode(27);

function wrap(options, text) {
  return E + '[' + options + 'm' + text + E + '[m';
}

function bold(text) {
  return wrap('1', text);
}

function underline(text) {
  return wrap('4', text);
}

function awesome(text) {
  return wrap('1;4;7;5;42;35', text);
}

var colors = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7
};
function color(name, text) {
  return E + '[' + (colors[name] + 30) + 'm' + text + E + '[39m';
}

exports.bold = bold;
exports.underline = underline;
exports.awesome = awesome;
exports.color = color;

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

var blockCommentRe = /\/\*(.|\n)*?\*\//g;
var lineCommentRe = /\/\/.+(\n|$)/g;

function extractStrings(code, regex, index) {
  // clean up most comments
  code = code
    .replace(blockCommentRe, '')
    .replace(lineCommentRe, '');

  var match;
  var visited = {};
  while (match = regex.exec(code)) {
    // manually check for preceding dot since we don't have backreferences
    if (match.index === 0 || code.charAt(match.index - 1) !== '.' &&
      match[index]) {
      visited[match[index]] = 1;
    }
  }
  return Object.keys(visited);
}

function extractStringArrays(code, regex, index, index2) {
  // clean up most comments
  code = code
    .replace(blockCommentRe, '')
    .replace(lineCommentRe, '');

  var match;
  var visited = {};
  var m;
  while (match = regex.exec(code)) {
    if (match.index === 0 || code.charAt(match.index - 1) !== '.') {
      m = match[index] || (index2 && match[index2]);
      if (m) {
        try {
          JSON.parse('[' + m.replace(/'/g, '"') + ']')
            .forEach(function(key) {
              visited[key] = 1;
            });
        } catch(e) {}
      }
    }
  }
  return Object.keys(visited);
}

var requireRe = /\brequire\s*\(\s*[\'"]([^"\']+)["\']\s*\)/g;
function requireCalls(code) {
  if (code.indexOf('require(') === -1) {
    return [];
  }
  return extractStrings(code, requireRe, 1);
}

var requireLazyRe = /\brequireLazy\s*\(\s*\[([^\]]+)\]/g;
function requireLazyCalls(code) {
  if (code.indexOf('requireLazy(') === -1) {
    return [];
  }
  return extractStringArrays(code, requireLazyRe, 1);
}

var loadModulesRe = /\bBootloader\.loadModules\s*\(\s*(?:\[([^\]]+)\])?/g;
function loadModules(code) {
  if (code.indexOf('Bootloader.loadModules(') === -1) {
    return [];
  }
  return extractStringArrays(code, loadModulesRe, 1);
}

var loadComponentsRe =
  /\bBootloader\.loadComponents\s*\(\s*(?:\[([^\]]+)\]|([\'"][^\'"]+[\'"]))/g;
function loadComponents(code) {
  if (code.indexOf('Bootloader.loadComponents(') === -1) {
    return [];
  }
  return extractStringArrays(code, loadComponentsRe, 1, 2);
}


var cxModulesRe = /\bcx\s*\(\s*([^)]+)\s*\)/g;
function cxModules(code) {
  if (code.indexOf('cx(') === -1) {
    return [];
  }
  var map = {};
  extractStringArrays(code, cxModulesRe, 1).forEach(function(m) {
    var parts = m.split('/');
    if (parts[0] === 'public') {
      parts = parts.slice(1);
    }
    if (parts.length > 1 && parts[0]) {
      map[parts[0]] = 1;
    }
  });
  return Object.keys(map);
}


exports.strings = extractStrings;
exports.requireCalls = requireCalls;
exports.requireLazyCalls = requireLazyCalls;
exports.loadModules = loadModules;
exports.loadComponents = loadComponents;
exports.cxModules = cxModules;

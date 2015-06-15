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

var fbSpriteRe = /-fb-sprite\s*:\s*url\s*\(\s*[\'"]?([^\'")]+)[\'"]?\s*\)/g;
var splashRe = /^\//;
function extractFBSprites(contents) {
  var result = {};
  var match;
  while (match = fbSpriteRe.exec(contents)) {
    result[match[1].replace(splashRe, '')] = 1;
  }
  return Object.keys(result);
}

var bgRe = /background[^:]*:.*?url\([\']*([^\)]*\/images\/[^\)]+)[\']*\)/g;
var quoteRe = /'"/g;
function extractBackgroundImages(contents) {
  var result = {};
  var match;
  while (match = bgRe.exec(contents)) {
    result[match[1].replace(splashRe, '').replace(quoteRe, '')] = 1;
  }
  return Object.keys(result);
}

exports.extractFBSprites = extractFBSprites;

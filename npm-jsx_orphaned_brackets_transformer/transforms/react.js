/**
 * Copyright 2013-2014 Facebook, Inc.
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
/*global exports:true*/
"use strict";
var Syntax = require('esprima-fb').Syntax;
var utils = require('jstransform/src/utils');

function visitReactTag(traverse, object, path, state) {
  object.attributes.forEach(function(attr, index) {
    if (attr.value) {
      traverse(attr.value, path, state);
    }
  });

  object.children.forEach(function(child, index) {
    if (child.type === Syntax.Literal) {
      codemodXJSLiteral(child, state);
    } else {
      traverse(child, path, state);
    }
  });

  return false;
}

visitReactTag.test = function(object, path, state) {
  return object.type === Syntax.XJSElement;
};

function codemodXJSLiteral(object, state) {
  var value = object.raw;

  utils.catchup(object.range[0], state);

  var rightCurlyBracket = '&#125;'; // or {'}'}
  var rightAngledBracket = '&gt;'; // or {'>'}

  value = value.replace(/\}/g, rightCurlyBracket);
  value = value.replace(/\>/g, rightAngledBracket);

  utils.append(value, state);
  utils.move(object.range[1], state);
}

exports.visitReactTag = visitReactTag;

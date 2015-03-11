/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/*global exports:true*/
'use strict';
var jstransform = require('jstransform');
var Syntax = jstransform.Syntax;
var utils = require('jstransform/src/utils');

function visitReactTag(traverse, object, path, state) {
  object.openingElement.attributes.forEach(function(attr, index) {
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

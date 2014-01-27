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
/*global exports:true*/
"use strict";
var Syntax = require('esprima-fb').Syntax;
var utils = require('jstransform/src/utils');

var renderXJSExpressionContainer =
  require('./xjs').renderXJSExpressionContainer;
var renderXJSLiteral = require('./xjs').renderXJSLiteral;

function visitReactTag(traverse, object, path, state) {
  if (object.name.namespace) {
    throw new Error(
       'Namespace tags are not supported. ReactJSX is not XML.');
  }
  
  object.children.forEach(function(child, ii) {
    if (child.type === Syntax.Literal) {
      renderXJSLiteral(child, state);
    } else if (child.type === Syntax.XJSExpressionContainer) {
    
      var isNotAfterLiteral =
        ii == 0 ||
        object.children[ii - 1].type !== Syntax.Literal;
        
      var isNotBeforeLiteral =
        ii == object.children.length - 1 ||
        object.children[ii + 1].type !== Syntax.Literal;
      
      renderXJSExpressionContainer(
        traverse, child,
        isNotAfterLiteral,
        isNotBeforeLiteral,
        path, state);
        
    } else {
      traverse(child, path, state);
    }
  });

  return false;
}

visitReactTag.test = function(object, path, state) {
  // only run react when react @jsx namespace is specified in docblock
  var jsx = utils.getDocblock(state).jsx;
  return object.type === Syntax.XJSElement && jsx && jsx.length;
};

exports.visitReactTag = visitReactTag;

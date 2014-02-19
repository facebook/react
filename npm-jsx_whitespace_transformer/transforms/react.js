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
    traverse(attr.value, path, state);
  });

  object.children.forEach(function(child, index) {
    if (child.type === Syntax.Literal) {
      codemodXJSLiteral(child, state);
    } else if (child.type === Syntax.XJSExpressionContainer) {
      var isNotAfterLiteral =
        index == 0 ||
        object.children[index - 1].type !== Syntax.Literal;

      var isNotBeforeLiteral =
        index == object.children.length - 1 ||
        object.children[index + 1].type !== Syntax.Literal;

      codemodXJSExpressionContainer(
        traverse,
        child,
        isNotAfterLiteral,
        isNotBeforeLiteral,
        path,
        state
      );
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

function codemodXJSLiteral(object, state) {
  var value = object.raw;

  utils.catchup(object.range[0], state);

  /*
    This can be used to "annotate spaces" inserted by this transformation,
    so that they can be more easily recognized as such in the final code

    {' '}
    {'\\x20'}
    {(' ')}
    {' '||0}
    {' '||AnyTextYouLike}
    {' '||'AnyTextYouLike'}
    {GlobalVariableWithASpace}
  */

  var space = "{' '}";

  /*
    · space
    ¬ newline
    {expr} = <tag>

    Old whitespace rules:
    {1}··Aaa··Bbb··{2}··{3}  →  {1}·Aaa··Bbb·{2}{3}
    {1}¬¬Aaa¬¬Bbb¬¬{2}¬¬{3}  →  {1}·Aaa·Bbb·{2}{3}

    New whitespace rules:
    {1}··Aaa··Bbb··{2}··{3}  →  {1}··Aaa··Bbb··{2}··{3}
    {1}¬¬Aaa¬¬Bbb¬¬{2}¬¬{3}  →  {1}Aaa·Bbb{2}{3}

    Required transformation:
    {1}··{2}       =  {1}··{2}       →  {1}{2}
    {1}··Aaa··{2}  =  {1}··Aaa··{2}  →  {1}·Aaa·{2}
    {1}¬¬Aaa¬¬{2}  =  {1}Aaa{2}      →  {1}·Aaa·{2}
  */

  // {1}··{2}  =  {1}··{2}  →  {1}{2}
  value = value.replace(/^[ \t]+$/, '');

  // {1}··Aaa··{2}  =  {1}··Aaa··{2}  →  {1}·Aaa·{2}
  value = value.replace(/^[ \t]+([^ \t\r\n])/, " $1");
  value = value.replace(/([^ \t\r\n])[ \t]+$/, "$1 ");

  // {1}¬¬Aaa¬¬{2}  =  {1}Aaa{2}  →  {1}·Aaa·{2}
  value = value.replace(/^([ \t]*[\r\n][ \t\r\n]*)([^ \t\r\n].*)/, "$1" + space + "$2");
  value = value.replace(/([^ \t\r\n])([ \t]*[\r\n][ \t\r\n]*)$/, "$1" + space + "$2");

  // Rendered whitespace tabs are replaced with spaces
  value = value.replace(/[^ \t\r\n][ ]*[\t][ \t]*[^ \t\r\n]/, function(match) {
    return match.replace(/\t/g, ' ');
  });

  utils.append(value, state);
  utils.move(object.range[1], state);
}

function codemodXJSExpressionContainer(
    traverse,
    object,
    isNotAfterLiteral,
    isNotBeforeLiteral,
    path,
    state) {
  utils.catchup(object.range[0], state);
  traverse(object.expression, path, state);

  // Unbox the previously required {' '}-workaround
  var raw = object.expression.raw;
  var isSpace = raw === "' '" || raw === '" "';

  if (isNotAfterLiteral && isNotBeforeLiteral && isSpace) {
    utils.append(' ', state);
    utils.move(object.range[1], state);
  } else {
    utils.catchup(object.range[1], state);
  }
}

exports.visitReactTag = visitReactTag;

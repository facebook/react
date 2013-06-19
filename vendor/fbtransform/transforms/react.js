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

var Syntax = require('esprima').Syntax;

var catchup = require('../lib/utils').catchup;
var append = require('../lib/utils').append;
var move = require('../lib/utils').move;
var getDocblock = require('../lib/utils').getDocblock;

var FALLBACK_TAGS = require('./xjs').knownTags;
var renderXJSExpression = require('./xjs').renderXJSExpression;
var renderXJSLiteral = require('./xjs').renderXJSLiteral;
var quoteAttrName = require('./xjs').quoteAttrName;

/**
 * Customized desugar processor.
 *
 * Currently: (Somewhat tailored to React)
 * <X> </X> => X(null, null)
 * <X prop="1" /> => X({prop: '1'}, null)
 * <X prop="2"><Y /></X> => X({prop:'2'}, Y(null, null))
 * <X prop="2"><Y /><Z /></X> => X({prop:'2'}, [Y(null, null), Z(null, null)])
 *
 * Exceptions to the simple rules above:
 * if a property is named "class" it will be changed to "className" in the
 * javascript since "class" is not a valid object key in javascript.
 */

var JSX_ATTRIBUTE_RENAMES = {
  'class': 'className',
  cxName: 'className'
};

var JSX_ATTRIBUTE_TRANSFORMS = {
  cxName: function(attr) {
    if (attr.value.type !== Syntax.Literal) {
      throw new Error("cx only accepts a string literal");
    } else {
      var classNames = attr.value.value.split(/\s+/g);
      return 'cx(' + classNames.map(JSON.stringify).join(',') + ')';
    }
  }
};

function visitReactTag(traverse, object, path, state) {
  var jsxObjIdent = getDocblock(state).jsx;

  catchup(object.openingElement.range[0], state);

  if (object.name.namespace) {
    throw new Error(
       'Namespace tags are not supported. ReactJSX is not XML.');
  }

  var isFallbackTag = FALLBACK_TAGS[object.name.name];
  append(
    (isFallbackTag ? jsxObjIdent + '.' : '') + (object.name.name) + '(',
    state
  );

  move(object.name.range[1], state);

  var childrenToRender = object.children.filter(function(child) {
    return !(child.type === Syntax.Literal && !child.value.match(/\S/));
  });

  // if we don't have any attributes, pass in null
  if (object.attributes.length === 0) {
    append('null', state);
  }

  // write attributes
  object.attributes.forEach(function(attr, index) {
    catchup(attr.range[0], state);
    if (attr.name.namespace) {
      throw new Error(
         'Namespace attributes are not supported. ReactJSX is not XML.');
    }
    var name = JSX_ATTRIBUTE_RENAMES[attr.name.name] || attr.name.name;
    var isFirst = index === 0;
    var isLast = index === object.attributes.length - 1;

    if (isFirst) {
      append('{', state);
    }

    append(quoteAttrName(name), state);
    append(':', state);

    if (!attr.value) {
      state.g.buffer += 'true';
      state.g.position = attr.name.range[1];
      if (!isLast) {
        append(',', state);
      }
    } else if (JSX_ATTRIBUTE_TRANSFORMS[attr.name.name]) {
      move(attr.value.range[0], state);
      append(JSX_ATTRIBUTE_TRANSFORMS[attr.name.name](attr), state);
      move(attr.value.range[1], state);
      if (!isLast) {
        append(',', state);
      }
    } else if (attr.value.type === Syntax.Literal) {
      move(attr.value.range[0], state);
      renderXJSLiteral(attr.value, isLast, state);
    } else {
      move(attr.value.range[0], state);
      renderXJSExpression(traverse, attr.value, isLast, path, state);
    }

    if (isLast) {
      append('}', state);
    }

    catchup(attr.range[1], state);
  });

  if (!object.selfClosing) {
    catchup(object.openingElement.range[1] - 1, state);
    move(object.openingElement.range[1], state);
  }

  // filter out whitespace
  if (childrenToRender.length > 0) {
    append(', ', state);

    object.children.forEach(function(child) {
      if (child.type === Syntax.Literal && !child.value.match(/\S/)) {
        return;
      }
      catchup(child.range[0], state);

      var isLast = child === childrenToRender[childrenToRender.length - 1];

      if (child.type === Syntax.Literal) {
        renderXJSLiteral(child, isLast, state);
      } else if (child.type === Syntax.XJSExpression) {
        renderXJSExpression(traverse, child, isLast, path, state);
      } else {
        traverse(child, path, state);
        if (!isLast) {
          append(',', state);
          state.g.buffer = state.g.buffer.replace(/(\s*),$/, ',$1');
        }
      }

      catchup(child.range[1], state);
    });
  }

  if (object.selfClosing) {
    // everything up to />
    catchup(object.openingElement.range[1] - 2, state);
    move(object.openingElement.range[1], state);
  } else {
    // everything up to </ sdflksjfd>
    catchup(object.closingElement.range[0], state);
    move(object.closingElement.range[1], state);
  }

  append(')', state);
  return false;
}

visitReactTag.test = function(object, path, state) {
  // only run react when react @jsx namespace is specified in docblock
  var jsx = getDocblock(state).jsx;
  return object.type === Syntax.XJSElement && jsx && jsx.length;
};

exports.visitReactTag = visitReactTag;

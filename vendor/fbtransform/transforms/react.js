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

var FALLBACK_TAGS = require('./xjs').knownTags;
var renderXJSExpressionContainer =
  require('./xjs').renderXJSExpressionContainer;
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
  var jsxObjIdent = utils.getDocblock(state).jsx;

  utils.catchup(object.openingElement.range[0], state);

  if (object.name.namespace) {
    throw new Error(
       'Namespace tags are not supported. ReactJSX is not XML.');
  }

  var isFallbackTag = FALLBACK_TAGS[object.name.name];
  utils.append(
    (isFallbackTag ? jsxObjIdent + '.' : '') + (object.name.name) + '(',
    state
  );

  utils.move(object.name.range[1], state);

  var childrenToRender = object.children.filter(function(child) {
    return !(child.type === Syntax.Literal && !child.value.match(/\S/));
  });

  // if we don't have any attributes, pass in null
  if (object.attributes.length === 0) {
    utils.append('null', state);
  }

  // write attributes
  object.attributes.forEach(function(attr, index) {
    utils.catchup(attr.range[0], state);
    if (attr.name.namespace) {
      throw new Error(
         'Namespace attributes are not supported. ReactJSX is not XML.');
    }
    var name = attr.name.name;
    var isFirst = index === 0;
    var isLast = index === object.attributes.length - 1;

    if (isFirst) {
      utils.append('{', state);
    }

    utils.append(quoteAttrName(name), state);
    utils.append(':', state);

    if (!attr.value) {
      state.g.buffer += 'true';
      state.g.position = attr.name.range[1];
      if (!isLast) {
        utils.append(',', state);
      }
    } else {
      utils.move(attr.name.range[1], state);
      // Use catchupWhiteSpace to skip over the '=' in the attribute
      utils.catchupWhiteSpace(attr.value.range[0], state);
      if (JSX_ATTRIBUTE_TRANSFORMS[attr.name.name]) {
        utils.append(JSX_ATTRIBUTE_TRANSFORMS[attr.name.name](attr), state);
        utils.move(attr.value.range[1], state);
        if (!isLast) {
          utils.append(',', state);
        }
      } else if (attr.value.type === Syntax.Literal) {
        renderXJSLiteral(attr.value, isLast, state);
      } else {
        renderXJSExpressionContainer(traverse, attr.value, isLast, path, state);
      }
    }

    if (isLast) {
      utils.append('}', state);
    }

    utils.catchup(attr.range[1], state);
  });

  if (!object.selfClosing) {
    utils.catchup(object.openingElement.range[1] - 1, state);
    utils.move(object.openingElement.range[1], state);
  }

  // filter out whitespace
  if (childrenToRender.length > 0) {
    utils.append(', ', state);

    object.children.forEach(function(child) {
      if (child.type === Syntax.Literal && !child.value.match(/\S/)) {
        return;
      }
      utils.catchup(child.range[0], state);

      var isLast = child === childrenToRender[childrenToRender.length - 1];

      if (child.type === Syntax.Literal) {
        renderXJSLiteral(child, isLast, state);
      } else if (child.type === Syntax.XJSExpressionContainer) {
        renderXJSExpressionContainer(traverse, child, isLast, path, state);
      } else {
        traverse(child, path, state);
        if (!isLast) {
          utils.append(',', state);
          state.g.buffer = state.g.buffer.replace(/(\s*),$/, ',$1');
        }
      }

      utils.catchup(child.range[1], state);
    });
  }

  if (object.selfClosing) {
    // everything up to />
    utils.catchup(object.openingElement.range[1] - 2, state);
    utils.move(object.openingElement.range[1], state);
  } else {
    // everything up to </ sdflksjfd>
    utils.catchup(object.closingElement.range[0], state);
    utils.move(object.closingElement.range[1], state);
  }

  utils.append(')', state);
  return false;
}

visitReactTag.test = function(object, path, state) {
  // only run react when react @jsx namespace is specified in docblock
  var jsx = utils.getDocblock(state).jsx;
  return object.type === Syntax.XJSElement && jsx && jsx.length;
};

exports.visitReactTag = visitReactTag;

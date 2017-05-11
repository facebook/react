/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createOpenTagMarkup
 */

'use strict';

var CSSPropertyOperations = require('CSSPropertyOperations');
var DOMPropertyOperations = require('DOMPropertyOperations');

var {registrationNameModules} = require('EventPluginRegistry');

var STYLE = 'style';
var RESERVED_PROPS = {
  children: null,
  dangerouslySetInnerHTML: null,
  suppressContentEditableWarning: null,
};

function isCustomComponent(tagName, props) {
  return tagName.indexOf('-') >= 0 || props.is != null;
}

/**
 * Creates markup for the open tag and attributes. Does not include closing ">".
 */
function createOpenTagMarkup(
  tagVerbatim,
  tagLowercase,
  props,
  makeStaticMarkup,
  isRootElement,
  domID,
  instForDebug,
) {
  var ret = '<' + tagVerbatim;

  for (var propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    var propValue = props[propKey];
    if (propValue == null) {
      continue;
    }
    if (!registrationNameModules.hasOwnProperty(propKey)) {
      if (propKey === STYLE) {
        propValue = CSSPropertyOperations.createMarkupForStyles(
          propValue,
          instForDebug,
        );
      }
      var markup = null;
      if (isCustomComponent(tagLowercase, props)) {
        if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
          markup = DOMPropertyOperations.createMarkupForCustomAttribute(
            propKey,
            propValue,
          );
        }
      } else {
        markup = DOMPropertyOperations.createMarkupForProperty(
          propKey,
          propValue,
        );
      }
      if (markup) {
        ret += ' ' + markup;
      }
    }
  }

  // For static pages, no need to put React ID and checksum. Saves lots of
  // bytes.
  if (makeStaticMarkup) {
    return ret;
  }

  if (isRootElement) {
    ret += ' ' + DOMPropertyOperations.createMarkupForRoot();
  }
  ret += ' ' + DOMPropertyOperations.createMarkupForID(domID);
  return ret;
}

module.exports = createOpenTagMarkup;

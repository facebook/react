/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule validateDOMNesting
 */

'use strict';

var emptyFunction = require('emptyFunction');
var warning = require('warning');

var validateDOMNesting = emptyFunction;

if (__DEV__) {
  // The below rules were created from the HTML5 spec and using
  // https://github.com/facebook/xhp-lib/blob/1.6.0/src/html.php

  // Flow elements are block or inline elements that can appear in a <div>
  var flow = [
    'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi',
    'bdo', 'blockquote', 'br', 'button', 'canvas', 'cite', 'code', 'data',
    'datalist', 'del', 'details', 'dfn', 'div', 'dl', 'em', 'embed',
    'fieldset', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'header', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen',
    'label', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'meter', 'nav',
    'noscript', 'object', 'ol', 'output', 'p', 'pre', 'progress', 'q', 'ruby',
    's', 'samp', 'script', 'section', 'select', 'small', 'span', 'strong',
    'style', 'sub', 'sup', 'svg', 'table', 'textarea', 'time', 'u', 'ul',
    'var', 'video', 'wbr', '#text'
  ];

  // Phrasing elements are inline elements that can appear in a <span>
  var phrase = [
    'a', 'abbr', 'area', 'audio', 'b', 'bdi', 'bdo', 'br', 'button', 'canvas',
    'cite', 'code', 'data', 'datalist', 'del', 'dfn', 'em', 'embed', 'i',
    'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'link', 'map',
    'mark', 'meta', 'meter', 'noscript', 'object', 'output', 'progress', 'q',
    'ruby', 's', 'samp', 'script', 'select', 'small', 'span', 'strong', 'sub',
    'sup', 'svg', 'textarea', 'time', 'u', 'var', 'video', 'wbr', '#text'
  ];

  // Metadata elements can appear in <head>
  var metadata = [
    'base', 'link', 'meta', 'noscript', 'script', 'style', 'title'
  ];

  // By default, we assume that flow elements can contain other flow elements
  // and phrasing elements can contain other phrasing elements. Here are the
  // exceptions:
  var allowedChildren = {
    '#document': ['html'],

    'a': flow,
    'audio': ['source', 'track'].concat(flow),
    'body': flow,
    'button': phrase,
    'caption': flow,
    'canvas': flow,
    'colgroup': ['col'],
    'dd': flow,
    'del': flow,
    'details': ['summary'].concat(flow),
    'dl': ['dt', 'dd'],
    'dt': flow,
    'fieldset': flow,
    'figcaption': flow,
    'figure': ['figcaption'].concat(flow),
    'h1': phrase,
    'h2': phrase,
    'h3': phrase,
    'h4': phrase,
    'h5': phrase,
    'h6': phrase,
    'head': metadata,
    'hgroup': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    'html': ['body', 'head'],
    'iframe': [],
    'ins': flow,
    'label': phrase,
    'legend': phrase,
    'li': flow,
    'map': flow,
    'menu': ['li', 'menuitem'].concat(flow),
    'noscript': '*',
    'object': ['param'].concat(flow),
    'ol': ['li'],
    'optgroup': ['option'],
    'p': phrase,
    'pre': phrase,
    'rp': phrase,
    'rt': phrase,
    'ruby': ['rp', 'rt', '#text'],
    'script': ['#text'],
    'select': ['option', 'optgroup'],
    'style': ['#text'],
    'summary': phrase,
    'table': ['caption', 'colgroup', 'tbody', 'tfoot', 'thead'],
    'tbody': ['tr'],
    'td': flow,
    'textarea': ['#text'],
    'tfoot': ['tr'],
    'th': flow,
    'thead': ['tr'],
    'title': ['#text'],
    'tr': ['td', 'th'],
    'ul': ['li'],
    'video': ['source', 'track'].concat(flow),

    // SVG
    // TODO: Validate nesting of all svg elements
    'svg': [
      'circle', 'defs', 'g', 'line', 'linearGradient', 'path', 'polygon',
      'polyline', 'radialGradient', 'rect', 'stop', 'text'
    ],

    // Self-closing tags
    'area': [],
    'base': [],
    'br': [],
    'col': [],
    'embed': [],
    'hr': [],
    'img': [],
    'input': [],
    'keygen': [],
    'link': [],
    'menuitem': [],
    'meta': [],
    'param': [],
    'source': [],
    'track': [],
    'wbr': []
  };

  var i, l;
  var allowedChildrenMap = {};
  for (i = 0, l = flow.length; i < l; i++) {
    allowedChildrenMap[flow[i]] = flow;
  }
  for (i = 0, l = phrase.length; i < l; i++) {
    allowedChildrenMap[phrase[i]] = flow;
  }
  for (var el in allowedChildren) {
    if (allowedChildren.hasOwnProperty(el)) {
      allowedChildrenMap[el] = allowedChildren[el];
    }
  }

  var nodeCanContainNode = function(parentTag, childTag) {
    var allowed = allowedChildrenMap[parentTag];
    if (!allowed || !allowedChildrenMap[childTag]) {
      // We don't recognize one of the tags; err on the side of not warning
      return true;
    }

    var result = allowed === '*' || allowed.indexOf(childTag) !== -1;
    return !!result;
  };

  validateDOMNesting = function(parentTag, childTag, element) {
    if (!nodeCanContainNode(parentTag, childTag)) {
      var info = '';
      if (parentTag === 'table' && childTag === 'tr') {
        info +=
          ' Add a <tbody> to your code to match the DOM tree generated by ' +
          'the browser.';
      }
      if (element && element._owner) {
        var name = element._owner.getName();
        if (name) {
          info += ` Check the render method of \`${name}\`.`;
        }
      }

      warning(
        false,
        'validateDOMNesting(...): <%s> cannot contain a <%s> node.%s',
        parentTag,
        childTag,
        info
      );
    }
  };

  validateDOMNesting.parentTagContextKey =
    '__validateDOMNesting_parentTag$' + Math.random().toString(36).slice(2);
}

module.exports = validateDOMNesting;

/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var validateDOMNesting;

// https://html.spec.whatwg.org/multipage/syntax.html#special
var specialTags = [
  'address', 'applet', 'area', 'article', 'aside', 'base', 'basefont',
  'bgsound', 'blockquote', 'body', 'br', 'button', 'caption', 'center', 'col',
  'colgroup', 'dd', 'details', 'dir', 'div', 'dl', 'dt', 'embed', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'iframe',
  'img', 'input', 'isindex', 'li', 'link', 'listing', 'main', 'marquee', 'menu',
  'menuitem', 'meta', 'nav', 'noembed', 'noframes', 'noscript', 'object', 'ol',
  'p', 'param', 'plaintext', 'pre', 'script', 'section', 'select', 'source',
  'style', 'summary', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot',
  'th', 'thead', 'title', 'tr', 'track', 'ul', 'wbr', 'xmp',
];

// https://html.spec.whatwg.org/multipage/syntax.html#formatting
var formattingTags = [
  'a', 'b', 'big', 'code', 'em', 'font', 'i', 'nobr', 's', 'small', 'strike',
  'strong', 'tt', 'u',
];

function isTagStackValid(stack) {
  var ancestorInfo = null;
  for (var i = 0; i < stack.length; i++) {
    if (!validateDOMNesting.isTagValidInContext(stack[i], ancestorInfo)) {
      return false;
    }
    ancestorInfo =
      validateDOMNesting.updatedAncestorInfo(ancestorInfo, stack[i], null);
  }
  return true;
}

describe('ReactContextValidator', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();

    validateDOMNesting = require('validateDOMNesting');
  });

  it('allows any tag with no context', function() {
    // With renderToString (for example), we don't know where we're mounting the
    // tag so we must err on the side of leniency.
    specialTags.concat(formattingTags, ['mysterytag']).forEach(function(tag) {
      expect(validateDOMNesting.isTagValidInContext(tag, null)).toBe(true);
    });
  });

  it('allows valid nestings', function() {
    expect(isTagStackValid(['table', 'tbody', 'tr', 'td', 'b'])).toBe(true);
    expect(isTagStackValid(['body', 'datalist', 'option'])).toBe(true);
    expect(isTagStackValid(['div', 'a', 'object', 'a'])).toBe(true);
    expect(isTagStackValid(['div', 'p', 'button', 'p'])).toBe(true);
    expect(isTagStackValid(['p', 'svg', 'foreignObject', 'p'])).toBe(true);

    // Invalid, but not changed by browser parsing so we allow them
    expect(isTagStackValid(['div', 'ul', 'ul', 'li'])).toBe(true);
    expect(isTagStackValid(['div', 'label', 'div'])).toBe(true);
    expect(isTagStackValid(['div', 'ul', 'li', 'section', 'li'])).toBe(true);
    expect(isTagStackValid(['div', 'ul', 'li', 'dd', 'li'])).toBe(true);
  });

  it('prevents problematic nestings', function() {
    expect(isTagStackValid(['a', 'a'])).toBe(false);
    expect(isTagStackValid(['form', 'form'])).toBe(false);
    expect(isTagStackValid(['p', 'p'])).toBe(false);
    expect(isTagStackValid(['table', 'tr'])).toBe(false);
    expect(isTagStackValid(['div', 'ul', 'li', 'div', 'li'])).toBe(false);
  });
});

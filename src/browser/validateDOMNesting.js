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
  // This validation code was written based on the HTML5 parsing spec:
  // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-scope
  //
  // Note: this does not catch all invalid nesting, nor does it try to (as it's
  // not clear what practical benefit doing so provides); instead, we warn only
  // for cases where the parser will give a parse tree differing from what React
  // intended. For example, <b><div></div></b> is invalid but we don't warn
  // because it still parses correctly; we do warn for other cases like nested
  // <p> tags where the beginning of the second element implicitly closes the
  // first, causing a confusing mess.

  // https://html.spec.whatwg.org/multipage/syntax.html#special
  var specialTags = [
    'address', 'applet', 'area', 'article', 'aside', 'base', 'basefont',
    'bgsound', 'blockquote', 'body', 'br', 'button', 'caption', 'center', 'col',
    'colgroup', 'dd', 'details', 'dir', 'div', 'dl', 'dt', 'embed', 'fieldset',
    'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2',
    'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'iframe',
    'img', 'input', 'isindex', 'li', 'link', 'listing', 'main', 'marquee',
    'menu', 'menuitem', 'meta', 'nav', 'noembed', 'noframes', 'noscript',
    'object', 'ol', 'p', 'param', 'plaintext', 'pre', 'script', 'section',
    'select', 'source', 'style', 'summary', 'table', 'tbody', 'td', 'template',
    'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul', 'wbr',
    'xmp'
  ];

  /**
   * Return whether `stack` contains `tag` and the last occurrence of `tag` is
   * deeper than any element in the `scope` array.
   *
   * https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-the-specific-scope
   *
   * Examples:
   *   stackHasTagInSpecificScope(['p', 'quote'], 'p', ['button']) is true
   *   stackHasTagInSpecificScope(['p', 'button'], 'p', ['button']) is false
   *
   * @param {Array<string>} stack
   * @param {string} tag
   * @param {Array<string>} scope
   */
  var stackHasTagInSpecificScope = function(stack, tag, scope) {
    for (var i = stack.length - 1; i >= 0; i--) {
      if (stack[i] === tag) {
        return true;
      }
      if (scope.indexOf(stack[i]) !== -1) {
        return false;
      }
    }
    return false;
  };

  // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-scope
  var inScopeTags = [
    'applet', 'caption', 'html', 'table', 'td', 'th', 'marquee', 'object',
    'template',

    // https://html.spec.whatwg.org/multipage/syntax.html#html-integration-point
    // TODO: Distinguish by namespace here
    'foreignObject', 'desc', 'title'
  ];
  var stackHasTagInScope = function(stack, tag) {
    return stackHasTagInSpecificScope(stack, tag, inScopeTags);
  };

  // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-button-scope
  var buttonScopeTags = inScopeTags.concat(['button']);
  var stackHasTagInButtonScope = function(stack, tag) {
    return stackHasTagInSpecificScope(stack, tag, buttonScopeTags);
  };

  // See rules for 'li', 'dd', 'dt' start tags in
  // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
  var listItemTagAllowed = function(tags, stack) {
    // tags is ['li'] or ['dd, 'dt']
    for (var i = stack.length - 1; i >= 0; i--) {
      if (tags.indexOf(stack[i]) !== -1) {
        return false;
      } else if (
        specialTags.indexOf(stack[i]) !== -1 &&
        stack[i] !== 'address' && stack[i] !== 'div' && stack[i] !== 'p'
      ) {
        return true;
      }
    }
    return true;
  };

  // https://html.spec.whatwg.org/multipage/syntax.html#generate-implied-end-tags
  var impliedEndTags =
    ['dd', 'dt', 'li', 'option', 'optgroup', 'p', 'rp', 'rt'];

  /**
   * Returns whether we allow putting `tag` in the document if the current stack
   * of open tags is `openTagStack`.
   *
   * Examples:
   *   isTagValidInContext('tr', [..., 'table', 'tbody']) is true
   *   isTagValidInContext('tr', [..., 'table']) is false
   *
   * @param {string} tag Lowercase HTML tag name or node name like '#text'
   * @param {Array<string>} openTagStack
   */
  var isTagValidInContext = function(tag, openTagStack) {
    var currentTag = openTagStack[openTagStack.length - 1];

    // First, let's check if we're in an unusual parsing mode...
    switch (currentTag) {
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inselect
      case 'select':
        return tag === 'option' || tag === 'optgroup' || tag === '#text';
      case 'optgroup':
        return tag === 'option' || tag === '#text';
      // Strictly speaking, seeing an <option> doesn't mean we're in a <select>
      // but
      case 'option':
        return tag === '#text';

      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intd
      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-incaption
      // No special behavior since these rules fall back to "in body" mode for
      // all except special table nodes which cause bad parsing behavior anyway.

      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intr
      case 'tr':
        return (
          tag === 'th' || tag === 'td' || tag === 'style' || tag === 'script' ||
          tag === 'template'
        );

      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intbody
      case 'tbody':
      case 'thead':
      case 'tfoot':
        return (
          tag === 'tr' || tag === 'style' || tag === 'script' ||
          tag === 'template'
        );

      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-incolgroup
      case 'colgroup':
        return tag === 'col' || tag === 'template';

      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intable
      case 'table':
        return (
          tag === 'caption' || tag === 'colgroup' || tag === 'tbody' ||
          tag === 'tfoot' || tag === 'thead' || tag === 'style' ||
          tag === 'script' || tag === 'template'
        );

      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inhead
      case 'head':
        return (
          tag === 'base' || tag === 'basefont' || tag === 'bgsound' ||
          tag === 'link' || tag === 'meta' || tag === 'title' ||
          tag === 'noscript' || tag === 'noframes' || tag === 'style' ||
          tag === 'script' || tag === 'template'
        );

      // https://html.spec.whatwg.org/multipage/semantics.html#the-html-element
      case 'html':
        return tag === 'head' || tag === 'body';
    }

    // Probably in the "in body" parsing mode, so we outlaw only tag combos
    // where the parsing rules cause implicit opens or closes to be added.
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
    switch (tag) {
      case 'address':
      case 'article':
      case 'aside':
      case 'blockquote':
      case 'center':
      case 'details':
      case 'dialog':
      case 'dir':
      case 'div':
      case 'dl':
      case 'fieldset':
      case 'figcaption':
      case 'figure':
      case 'footer':
      case 'header':
      case 'hgroup':
      case 'main':
      case 'menu':
      case 'nav':
      case 'ol':
      case 'p':
      case 'section':
      case 'summary':
      case 'ul':

      case 'pre':
      case 'listing':

      case 'table':

      case 'hr':

      case 'xmp':
        return !stackHasTagInButtonScope(openTagStack, 'p');

      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return (
          !stackHasTagInButtonScope(openTagStack, 'p') &&
          currentTag !== 'h1' && currentTag !== 'h2' && currentTag !== 'h3' &&
          currentTag !== 'h4' && currentTag !== 'h5' && currentTag !== 'h6'
        );

      case 'form':
        return (
          openTagStack.indexOf('form') === -1 &&
          !stackHasTagInButtonScope(openTagStack, 'p')
        );

      case 'li':
        return listItemTagAllowed(['li'], openTagStack);

      case 'dd':
      case 'dt':
        return listItemTagAllowed(['dd', 'dt'], openTagStack);

      case 'button':
        return !stackHasTagInScope(openTagStack, 'button');

      case 'a':
        // Spec says something about storing a list of markers, but it sounds
        // equivalent to this check.
        return !stackHasTagInScope(openTagStack, 'a');

      case 'nobr':
        return !stackHasTagInScope(openTagStack, 'nobr');

      case 'rp':
      case 'rt':
        return impliedEndTags.indexOf(currentTag) === -1;

      case 'caption':
      case 'col':
      case 'colgroup':
      case 'frame':
      case 'head':
      case 'tbody':
      case 'td':
      case 'tfoot':
      case 'th':
      case 'thead':
      case 'tr':
        return currentTag === undefined;
    }

    return true;
  };

  validateDOMNesting = function(parentStack, childTag, element) {
    if (!isTagValidInContext(childTag, parentStack)) {
      var info = '';
      var parentTag = parentStack[parentStack.length - 1];
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
        'validateDOMNesting(...): <%s> cannot appear as a child of <%s> ' +
        'in this context (%s).%s',
        childTag,
        parentTag,
        parentStack.join(' > '),
        info
      );
    }
  };

  validateDOMNesting.tagStackContextKey =
    '__validateDOMNesting_tagStack$' + Math.random().toString(36).slice(2);

  // For testing
  validateDOMNesting.isTagValidInContext = isTagValidInContext;
}

module.exports = validateDOMNesting;

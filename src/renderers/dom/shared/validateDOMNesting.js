/**
 * Copyright 2015-present, Facebook, Inc.
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
var getComponentName = require('getComponentName');
var warning = require('warning');

var validateDOMNesting = emptyFunction;

if (__DEV__) {
  var { getCurrentFiberStackAddendum } = require('ReactDebugCurrentFiber');

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
    'xmp',
  ];

  // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-scope
  var inScopeTags = [
    'applet', 'caption', 'html', 'table', 'td', 'th', 'marquee', 'object',
    'template',

    // https://html.spec.whatwg.org/multipage/syntax.html#html-integration-point
    // TODO: Distinguish by namespace here -- for <title>, including it here
    // errs on the side of fewer warnings
    'foreignObject', 'desc', 'title',
  ];

  // https://html.spec.whatwg.org/multipage/syntax.html#has-an-element-in-button-scope
  var buttonScopeTags = inScopeTags.concat(['button']);

  // https://html.spec.whatwg.org/multipage/syntax.html#generate-implied-end-tags
  var impliedEndTags =
    ['dd', 'dt', 'li', 'option', 'optgroup', 'p', 'rp', 'rt'];

  var emptyAncestorInfo = {
    current: null,

    formTag: null,
    aTagInScope: null,
    buttonTagInScope: null,
    nobrTagInScope: null,
    pTagInButtonScope: null,

    listItemTagAutoclosing: null,
    dlItemTagAutoclosing: null,
  };

  var updatedAncestorInfo = function(oldInfo, tag, instance) {
    var ancestorInfo = Object.assign({}, oldInfo || emptyAncestorInfo);
    var info = {tag: tag, instance: instance};

    if (inScopeTags.indexOf(tag) !== -1) {
      ancestorInfo.aTagInScope = null;
      ancestorInfo.buttonTagInScope = null;
      ancestorInfo.nobrTagInScope = null;
    }
    if (buttonScopeTags.indexOf(tag) !== -1) {
      ancestorInfo.pTagInButtonScope = null;
    }

    // See rules for 'li', 'dd', 'dt' start tags in
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
    if (
      specialTags.indexOf(tag) !== -1 &&
      tag !== 'address' && tag !== 'div' && tag !== 'p'
    ) {
      ancestorInfo.listItemTagAutoclosing = null;
      ancestorInfo.dlItemTagAutoclosing = null;
    }

    ancestorInfo.current = info;

    if (tag === 'form') {
      ancestorInfo.formTag = info;
    }
    if (tag === 'a') {
      ancestorInfo.aTagInScope = info;
    }
    if (tag === 'button') {
      ancestorInfo.buttonTagInScope = info;
    }
    if (tag === 'nobr') {
      ancestorInfo.nobrTagInScope = info;
    }
    if (tag === 'p') {
      ancestorInfo.pTagInButtonScope = info;
    }
    if (tag === 'li') {
      ancestorInfo.listItemTagAutoclosing = info;
    }
    if (tag === 'dd' || tag === 'dt') {
      ancestorInfo.dlItemTagAutoclosing = info;
    }

    return ancestorInfo;
  };

  /**
   * Returns whether
   */
  var isTagValidWithParent = function(tag, parentTag) {
    // First, let's check if we're in an unusual parsing mode...
    switch (parentTag) {
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
      case '#document':
        return tag === 'html';
    }

    // Probably in the "in body" parsing mode, so we outlaw only tag combos
    // where the parsing rules cause implicit opens or closes to be added.
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody
    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return (
          parentTag !== 'h1' && parentTag !== 'h2' && parentTag !== 'h3' &&
          parentTag !== 'h4' && parentTag !== 'h5' && parentTag !== 'h6'
        );

      case 'rp':
      case 'rt':
        return impliedEndTags.indexOf(parentTag) === -1;

      case 'body':
      case 'caption':
      case 'col':
      case 'colgroup':
      case 'frame':
      case 'head':
      case 'html':
      case 'tbody':
      case 'td':
      case 'tfoot':
      case 'th':
      case 'thead':
      case 'tr':
        // These tags are only valid with a few parents that have special child
        // parsing rules -- if we're down here, then none of those matched and
        // so we allow it only if we don't know what the parent is, as all other
        // cases are invalid.
        return parentTag == null;
    }

    return true;
  };

  /**
   * Returns whether
   */
  var findInvalidAncestorForTag = function(tag, ancestorInfo) {
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
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return ancestorInfo.pTagInButtonScope;

      case 'form':
        return ancestorInfo.formTag || ancestorInfo.pTagInButtonScope;

      case 'li':
        return ancestorInfo.listItemTagAutoclosing;

      case 'dd':
      case 'dt':
        return ancestorInfo.dlItemTagAutoclosing;

      case 'button':
        return ancestorInfo.buttonTagInScope;

      case 'a':
        // Spec says something about storing a list of markers, but it sounds
        // equivalent to this check.
        return ancestorInfo.aTagInScope;

      case 'nobr':
        return ancestorInfo.nobrTagInScope;
    }

    return null;
  };

  /**
   * Given a ReactCompositeComponent instance, return a list of its recursive
   * owners, starting at the root and ending with the instance itself.
   */
  var findOwnerStack = function(instance) {
    if (!instance) {
      return [];
    }

    var stack = [];
    do {
      stack.push(instance);
    } while ((instance = instance._currentElement._owner));
    stack.reverse();
    return stack;
  };

  var getOwnerInfo = function(childInstance, childTag, ancestorInstance, ancestorTag, isParent) {
    var childOwner = childInstance && childInstance._currentElement._owner;
    var ancestorOwner = ancestorInstance && ancestorInstance._currentElement._owner;

    var childOwners = findOwnerStack(childOwner);
    var ancestorOwners = findOwnerStack(ancestorOwner);

    var minStackLen = Math.min(childOwners.length, ancestorOwners.length);
    var i;

    var deepestCommon = -1;
    for (i = 0; i < minStackLen; i++) {
      if (childOwners[i] === ancestorOwners[i]) {
        deepestCommon = i;
      } else {
        break;
      }
    }

    var UNKNOWN = '(unknown)';
    var childOwnerNames = childOwners.slice(deepestCommon + 1).map(
      (inst) => getComponentName(inst) || UNKNOWN
    );
    var ancestorOwnerNames = ancestorOwners.slice(deepestCommon + 1).map(
      (inst) => getComponentName(inst) || UNKNOWN
    );
    var ownerInfo = [].concat(
      // If the parent and child instances have a common owner ancestor, start
      // with that -- otherwise we just start with the parent's owners.
      deepestCommon !== -1 ?
        getComponentName(childOwners[deepestCommon]) || UNKNOWN :
        [],
      ancestorOwnerNames,
      ancestorTag,
      // If we're warning about an invalid (non-parent) ancestry, add '...'
      isParent ? [] : ['...'],
      childOwnerNames,
      childTag
    ).join(' > ');

    return ownerInfo;
  };

  var didWarn = {};

  validateDOMNesting = function(
    childTag,
    childText,
    childInstance,
    ancestorInfo
  ) {
    ancestorInfo = ancestorInfo || emptyAncestorInfo;
    var parentInfo = ancestorInfo.current;
    var parentTag = parentInfo && parentInfo.tag;

    if (childText != null) {
      warning(
        childTag == null,
        'validateDOMNesting: when childText is passed, childTag should be null'
      );
      childTag = '#text';
    }

    var invalidParent =
      isTagValidWithParent(childTag, parentTag) ? null : parentInfo;
    var invalidAncestor =
      invalidParent ? null : findInvalidAncestorForTag(childTag, ancestorInfo);
    var invalidParentOrAncestor = invalidParent || invalidAncestor;
    if (!invalidParentOrAncestor) {
      return;
    }

    var ancestorInstance = invalidParentOrAncestor.instance;
    var ancestorTag = invalidParentOrAncestor.tag;
    var addendum;

    if (childInstance != null) {
      addendum = ' See ' + getOwnerInfo(
        childInstance,
        childTag,
        ancestorInstance,
        ancestorTag,
        Boolean(invalidParent)
      ) + '.';
    } else {
      addendum = getCurrentFiberStackAddendum();
    }

    var warnKey =
      !!invalidParent + '|' + childTag + '|' + ancestorTag + '|' + addendum;
    if (didWarn[warnKey]) {
      return;
    }
    didWarn[warnKey] = true;

    var tagDisplayName = childTag;
    var whitespaceInfo = '';
    if (childTag === '#text') {
      if (/\S/.test(childText)) {
        tagDisplayName = 'Text nodes';
      } else {
        tagDisplayName = 'Whitespace text nodes';
        whitespaceInfo =
          ' Make sure you don\'t have any extra whitespace between tags on ' +
          'each line of your source code.';
      }
    } else {
      tagDisplayName = '<' + childTag + '>';
    }

    if (invalidParent) {
      var info = '';
      if (ancestorTag === 'table' && childTag === 'tr') {
        info +=
          ' Add a <tbody> to your code to match the DOM tree generated by ' +
          'the browser.';
      }
      warning(
        false,
        'validateDOMNesting(...): %s cannot appear as a child of <%s>.%s%s%s',
        tagDisplayName,
        ancestorTag,
        whitespaceInfo,
        info,
        addendum
      );
    } else {
      warning(
        false,
        'validateDOMNesting(...): %s cannot appear as a descendant of ' +
        '<%s>.%s',
        tagDisplayName,
        ancestorTag,
        addendum
      );
    }
  };

  validateDOMNesting.updatedAncestorInfo = updatedAncestorInfo;

  // For testing
  validateDOMNesting.isTagValidInContext = function(tag, ancestorInfo) {
    ancestorInfo = ancestorInfo || emptyAncestorInfo;
    var parentInfo = ancestorInfo.current;
    var parentTag = parentInfo && parentInfo.tag;
    return (
      isTagValidWithParent(tag, parentTag) &&
      !findInvalidAncestorForTag(tag, ancestorInfo)
    );
  };
}

module.exports = validateDOMNesting;

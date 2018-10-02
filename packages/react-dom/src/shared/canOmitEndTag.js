/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {isAutonomousCustomComponent} from './isCustomComponent';

/**
 * Check if an HTML element's end tag can be omitted
 * w3.org/TR/html5/syntax.html#optional-tags
 *
 * @param {string} tagName HTML tag name that is being checked.
 * @param {?string} [nextSibling] HTML tag name of tagName's next sibling.
 * Null if tagName doesn't have a next sibling.
 * @param {?string} [parent] HTML tag name of tagName's parent.
 * Null if tagName doesn't have a parent.
 * @return {boolean} True if the end tag can be omitted.
 */
function canOmitEndTag(tagName: string, nextSibling: ?string, parent: ?string) {
  switch (tagName) {
    // An li element’s end tag may be omitted if the li element is
    // immediately followed by another li element or if there is no
    // more content in the parent element.
    case 'li':
      return nextSibling === 'li' || nextSibling === null;

    // A dt element’s end tag may be omitted if the dt element is
    // immediately followed by another dt element or a dd element.
    case 'dt':
      return nextSibling === 'dt' || nextSibling === 'dd';

    // A dd element’s end tag may be omitted if the dd element is
    // immediately followed by another dd element or a dt element,
    // or if there is no more content in the parent element.
    case 'dd':
      return (
        nextSibling === 'dd' || nextSibling === 'dt' || nextSibling === null
      );

    // A p element’s end tag may be omitted if the p element is
    // immediately followed by an address, article, aside, blockquote,
    // details, div, dl, fieldset, figcaption, figure, footer, form,
    // h1, h2, h3, h4, h5, h6, header, hr, main, nav, ol, p, pre,
    // section, table, or ul element, or if there is no more content
    // in the parent element and the parent element is an HTML element
    // that is not an a, audio, del, ins, map, noscript, or video element,
    // or an autonomous custom element.
    case 'p':
      return (
        nextSibling === 'address' ||
        nextSibling === 'article' ||
        nextSibling === 'aside' ||
        nextSibling === 'blockquote' ||
        nextSibling === 'details' ||
        nextSibling === 'div' ||
        nextSibling === 'dl' ||
        nextSibling === 'fieldset' ||
        nextSibling === 'figcaption' ||
        nextSibling === 'figure' ||
        nextSibling === 'footer' ||
        nextSibling === 'form' ||
        nextSibling === 'h1' ||
        nextSibling === 'h2' ||
        nextSibling === 'h3' ||
        nextSibling === 'h4' ||
        nextSibling === 'h5' ||
        nextSibling === 'h6' ||
        nextSibling === 'header' ||
        nextSibling === 'hr' ||
        nextSibling === 'main' ||
        nextSibling === 'nav' ||
        nextSibling === 'ol' ||
        nextSibling === 'p' ||
        nextSibling === 'pre' ||
        nextSibling === 'section' ||
        nextSibling === 'table' ||
        nextSibling === 'ul' ||
        (nextSibling === null &&
          typeof parent === 'string' &&
          !(
            parent === 'a' ||
            parent === 'audio' ||
            parent === 'del' ||
            parent === 'ins' ||
            parent === 'map' ||
            parent === 'noscript' ||
            parent === 'video' ||
            isAutonomousCustomComponent(parent)
          ))
      );

    // An rt element’s end tag may be omitted if the rt element is
    // immediately followed by an rt or rp element, or if there is
    // no more content in the parent element.
    case 'rt':
      return (
        nextSibling === 'rt' || nextSibling === 'rp' || nextSibling === null
      );

    // An rp element’s end tag may be omitted if the rp element is
    // immediately followed by an rt or rp element, or if there is
    // no more content in the parent element.
    case 'rp':
      return (
        nextSibling === 'rp' || nextSibling === 'rt' || nextSibling === null
      );

    // An optgroup element’s end tag may be omitted if the optgroup element is
    // immediately followed by another optgroup element, or if there is no more
    // content in the parent element.
    case 'optgroup':
      return nextSibling === 'optgroup' || nextSibling === null;

    // An option element’s end tag may be omitted if the option element is
    // immediately followed by another option element, or if it is immediately
    // followed by an optgroup element, or if there is no more content in
    // the parent element.
    case 'option':
      return (
        nextSibling === 'option' ||
        nextSibling === 'optgroup' ||
        nextSibling === null
      );

    // A colgroup element’s end tag may be omitted if the colgroup element is
    // not immediately followed by a space character or a comment.
    case 'colgroup':
      // TODO (tvler): Support space character and comments
      // as nextSibling parameter values
      return false;

    // A caption element’s end tag may be omitted if the caption element is
    // not immediately followed by a space character or a comment.
    case 'caption':
      // TODO (tvler): Support space character and comments
      // as nextSibling parameter values
      return false;

    // A thead element’s end tag may be omitted if the thead element is
    // immediately followed by a tbody or tfoot element.
    case 'thead':
      return nextSibling === 'tbody' || nextSibling === 'tfoot';

    // A tbody element’s end tag may be omitted if the tbody element is
    // immediately followed by a tbody or tfoot element, or if there is
    // no more content in the parent element.
    case 'tbody':
      return (
        nextSibling === 'tbody' ||
        nextSibling === 'tfoot' ||
        nextSibling === null
      );

    // A tfoot element’s end tag may be omitted if there is no more content
    // in the parent element.
    case 'tfoot':
      return nextSibling === null;

    // A tr element’s end tag may be omitted if the tr element is
    // immediately followed by another tr element, or if there is
    // no more content in the parent element.
    case 'tr':
      return nextSibling === 'tr' || nextSibling === null;

    // A td element’s end tag may be omitted if the td element is
    // immediately followed by a td or th element, or if there is
    // no more content in the parent element.
    case 'td':
      return (
        nextSibling === 'td' || nextSibling === 'th' || nextSibling === null
      );

    // A th element’s end tag may be omitted if the th element is
    // immediately followed by a td or th element, or if there is
    // no more content in the parent element.
    case 'th':
      return nextSibling === 'th' || nextSibling === null;

    default:
      return false;
  }
}

export default canOmitEndTag;

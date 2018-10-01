/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Check if we can omit an HTML element's end tag
 * w3.org/TR/html5/syntax.html#optional-tags
 *
 * @param {string} tagName HTML tag name that is being checked.
 * @param {string} [nextSiblingTagName] HTML tag name of tagName's next sibling.
 * Undefined if tagName doesn't have a next sibling.
 * @return {boolean} True if the end tag can be omitted.
 */
function canOmitEndTag(tagName: string, nextSiblingTagName: string) {
  switch (tagName) {
    // An li element’s end tag may be omitted if the li element is
    // immediately followed by another li element or if there is no
    // more content in the parent element.
    case 'li':
      return nextSiblingTagName === 'li' || nextSiblingTagName === undefined;

    // A dt element’s end tag may be omitted if the dt element is
    // immediately followed by another dt element or a dd element.
    case 'dt':

    // A dd element’s end tag may be omitted if the dd element is
    // immediately followed by another dd element or a dt element,
    // or if there is no more content in the parent element.
    case 'dd':

    // A p element’s end tag may be omitted if the p element is
    // immediately followed by an address, article, aside, blockquote,
    // details, div, dl, fieldset, figcaption, figure, footer, form,
    // h1, h2, h3, h4, h5, h6, header, hr, main, nav, ol, p, pre,
    // section, table, or ul element, or if there is no more content
    // in the parent element and the parent element is an HTML element
    // that is not an a, audio, del, ins, map, noscript, or video element,
    // or an autonomous custom element.
    case 'p':

    // An rt element’s end tag may be omitted if the rt element is
    // immediately followed by an rt or rp element, or if there is
    // no more content in the parent element.
    case 'rt':

    // An rp element’s end tag may be omitted if the rp element is
    // immediately followed by an rt or rp element, or if there is
    // no more content in the parent element.
    case 'rp':

    // An optgroup element’s end tag may be omitted if the optgroup element is
    // immediately followed by another optgroup element, or if there is no more
    // content in the parent element.
    case 'optgroup':

    // An option element’s end tag may be omitted if the option element is
    // immediately followed by another option element, or if it is immediately
    // followed by an optgroup element, or if there is no more content in
    // the parent element.
    case 'option':

    // A colgroup element’s end tag may be omitted if the colgroup element is
    // not immediately followed by a space character or a comment.
    case 'colgroup':

    // A caption element’s end tag may be omitted if the caption element is
    // not immediately followed by a space character or a comment.
    case 'caption':

    // A thead element’s end tag may be omitted if the thead element is
    // immediately followed by a tbody or tfoot element.
    case 'thead':

    // A tbody element’s end tag may be omitted if the tbody element is
    // immediately followed by a tbody or tfoot element, or if there is
    // no more content in the parent element.
    case 'tbody':

    // A tfoot element’s end tag may be omitted if there is no more content
    // in the parent element.
    case 'tfoot':

    // A tr element’s end tag may be omitted if the tr element is
    // immediately followed by another tr element, or if there is
    // no more content in the parent element.
    case 'tr':

    // A td element’s end tag may be omitted if the td element is
    // immediately followed by a td or th element, or if there is
    // no more content in the parent element.
    case 'td':

    // A th element’s end tag may be omitted if the th element is
    // immediately followed by a td or th element, or if there is
    // no more content in the parent element.
    case 'th':
      return false;

    default:
      return false;
  }
}

export default canOmitEndTag;

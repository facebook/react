import {isDevMode} from '@angular/core';

import {getDOM} from '../dom/dom_adapter';

import {sanitizeUrl} from './url_sanitizer';


/**
 * Regular expression for safe style values.
 *
 * Quotes (" and ') are allowed, but a check must be done elsewhere to ensure they're balanced.
 *
 * ',' allows multiple values to be assigned to the same property (e.g. background-attachment or
 * font-family) and hence could allow multiple values to get injected, but that should pose no risk
 * of XSS.
 *
 * The function expression checks only for XSS safety, not for CSS validity.
 *
 * This regular expression was taken from the Closure sanitization library, and augmented for
 * transformation values.
 */
const VALUES = '[-,."\'%_!# a-zA-Z0-9]+';
const TRANSFORMATION_FNS = '(?:matrix|translate|scale|rotate|skew|perspective)(?:X|Y|3d)?';
const COLOR_FNS = '(?:rgb|hsl)a?';
const FN_ARGS = '\\([-0-9.%, a-zA-Z]+\\)';
const SAFE_STYLE_VALUE =
    new RegExp(`^(${VALUES}|(?:${TRANSFORMATION_FNS}|${COLOR_FNS})${FN_ARGS})$`, 'g');

/**
 * Matches a `url(...)` value with an arbitrary argument as long as it does
 * not contain parentheses.
 *
 * The URL value still needs to be sanitized separately.
 *
 * `url(...)` values are a very common use case, e.g. for `background-image`. With carefully crafted
 * CSS style rules, it is possible to construct an information leak with `url` values in CSS, e.g.
 * by observing whether scroll bars are displayed, or character ranges used by a font face
 * definition.
 *
 * Angular only allows binding CSS values (as opposed to entire CSS rules), so it is unlikely that
 * binding a URL value without further cooperation from the page will cause an information leak, and
 * if so, it is just a leak, not a full blown XSS vulnerability.
 *
 * Given the common use case, low likelihood of attack vector, and low impact of an attack, this
 * code is permissive and allows URLs that sanitize otherwise.
 */
const URL_RE = /^url\(([^)]+)\)$/;

/**
 * Checks that quotes (" and ') are properly balanced inside a string. Assumes
 * that neither escape (\) nor any other character that could result in
 * breaking out of a string parsing context are allowed;
 * see http://www.w3.org/TR/css3-syntax/#string-token-diagram.
 *
 * This code was taken from the Closure sanitization library.
 */
function hasBalancedQuotes(value: string) {
  let outsideSingle = true;
  let outsideDouble = true;
  for (let i = 0; i < value.length; i++) {
    let c = value.charAt(i);
    if (c === '\'' && outsideDouble) {
      outsideSingle = !outsideSingle;
    } else if (c === '"' && outsideSingle) {
      outsideDouble = !outsideDouble;
    }
  }
  return outsideSingle && outsideDouble;
}

/**
 * Sanitizes the given untrusted CSS style property value (i.e. not an entire object, just a single
 * value) and returns a value that is safe to use in a browser environment.
 */
export function sanitizeStyle(value: string): string {
  value = String(value).trim();  // Make sure it's actually a string.

  // Single url(...) values are supported, but only for URLs that sanitize cleanly. See above for
  // reasoning behind this.
  let urlMatch = URL_RE.exec(value);
  if ((urlMatch && sanitizeUrl(urlMatch[1]) === urlMatch[1]) ||
      value.match(SAFE_STYLE_VALUE) && hasBalancedQuotes(value)) {
    return value;  // Safe style values.
  }

  if (isDevMode()) getDOM().log('WARNING: sanitizing unsafe style value ' + value);

  return 'unsafe';
}

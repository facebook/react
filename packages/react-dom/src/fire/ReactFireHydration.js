/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import warningWithoutStack from 'shared/warningWithoutStack';

let didWarnInvalidHydration = false;
let warnForTextDifference;
let normalizeMarkupForTextOrAttribute;

if (__DEV__) {
  // HTML parsing normalizes CR and CRLF to LF.
  // It also can turn \u0000 into \uFFFD inside attributes.
  // https://www.w3.org/TR/html5/single-page.html#preprocessing-the-input-stream
  // If we have a mismatch, it might be caused by that.
  // We will still patch up in this case but not fire the warning.
  const NORMALIZE_NEWLINES_REGEX = /\r\n?/g;
  const NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;

  normalizeMarkupForTextOrAttribute = function(markup: mixed): string {
    const markupString =
      typeof markup === 'string' ? markup : '' + (markup: any);
    return markupString
      .replace(NORMALIZE_NEWLINES_REGEX, '\n')
      .replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, '');
  };

  warnForTextDifference = function(
    serverText: string,
    clientText: string | number,
  ) {
    if (didWarnInvalidHydration) {
      return;
    }
    const normalizedClientText = normalizeMarkupForTextOrAttribute(clientText);
    const normalizedServerText = normalizeMarkupForTextOrAttribute(serverText);
    if (normalizedServerText === normalizedClientText) {
      return;
    }
    didWarnInvalidHydration = true;
    warningWithoutStack(
      false,
      'Text content did not match. Server: "%s" Client: "%s"',
      normalizedServerText,
      normalizedClientText,
    );
  };
}

export function warnForUnmatchedText(textNode: Text, text: string) {
  if (__DEV__) {
    warnForTextDifference(textNode.nodeValue, text);
  }
}

export function warnForInsertedHydratedText(
  parentNode: Element | Document,
  text: string,
) {
  if (__DEV__) {
    if (text === '') {
      // We expect to insert empty text nodes since they're not represented in
      // the HTML.
      // TODO: Remove this special case if we can just avoid inserting empty
      // text nodes.
      return;
    }
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    warningWithoutStack(
      false,
      'Expected server HTML to contain a matching text node for "%s" in <%s>.',
      text,
      parentNode.nodeName.toLowerCase(),
    );
  }
}

export function warnForInsertedHydratedElement(
  parentNode: Element | Document,
  tag: string,
  props: Object,
) {
  if (__DEV__) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    warningWithoutStack(
      false,
      'Expected server HTML to contain a matching <%s> in <%s>.',
      tag,
      parentNode.nodeName.toLowerCase(),
    );
  }
}

export function warnForDeletedHydratableElement(
  parentNode: Element | Document,
  child: Element,
) {
  if (__DEV__) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    warningWithoutStack(
      false,
      'Did not expect server HTML to contain a <%s> in <%s>.',
      child.nodeName.toLowerCase(),
      parentNode.nodeName.toLowerCase(),
    );
  }
}

export function warnForDeletedHydratableText(
  parentNode: Element | Document,
  child: Text,
) {
  if (__DEV__) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    warningWithoutStack(
      false,
      'Did not expect server HTML to contain the text node "%s" in <%s>.',
      child.nodeValue,
      parentNode.nodeName.toLowerCase(),
    );
  }
}

export function diffHydratedText(textNode: Text, text: string): boolean {
  const isDifferent = textNode.nodeValue !== text;
  return isDifferent;
}

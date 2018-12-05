/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  BLUR,
  COMPOSITION_START,
  COMPOSITION_UPDATE,
  KEY_DOWN,
  KEY_UP,
  KEY_PRESS,
  MOUSE_DOWN,
  COMPOSITION_END,
  TEXT_INPUT,
  PASTE,
} from '../ReactFireEventTypes';
import {traverseTwoPhase} from '../ReactFireEventTraversal';

import {canUseDOM} from 'shared/ExecutionEnvironment';

const SPACEBAR_CODE = 32;
const SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);
const END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
const START_KEYCODE = 229;

// Track whether we've ever handled a keypress on the space key.
let hasSpaceKeypress = false;
// Track the current IME composition status, if any.
let isComposing = false;

let documentMode = null;
if (canUseDOM && 'documentMode' in document) {
  documentMode = document.documentMode;
}

const canUseCompositionEvent = canUseDOM && 'CompositionEvent' in window;

// Webkit offers a very useful `textInput` event that can be used to
// directly represent `beforeInput`. The IE `textinput` event is not as
// useful, so we don't use it.
const canUseTextInputEvent =
  canUseDOM && 'TextEvent' in window && !documentMode;

// In IE9+, we have access to composition events, but the data supplied
// by the native compositionend event may be incorrect. Japanese ideographic
// spaces, for instance (\u3000) are not recorded correctly.
const useFallbackCompositionData =
  canUseDOM &&
  (!canUseCompositionEvent ||
    (documentMode && documentMode > 8 && documentMode <= 11));

/**
 * These variables store information about text content of a target node,
 * allowing comparison of content before and after a given event.
 *
 * Identify the node where selection currently begins, then observe
 * both its text content and its current position in the DOM. Since the
 * browser may natively replace the target node during composition, we can
 * use its position to find its replacement.
 *
 *
 */

let root = null;
let startText = null;
let fallbackText = null;

export function initialize(nativeEventTarget) {
  root = nativeEventTarget;
  startText = getText();
  return true;
}

export function reset() {
  root = null;
  startText = null;
  fallbackText = null;
}

export function getData() {
  if (fallbackText) {
    return fallbackText;
  }

  let start;
  const startValue = startText;
  const startLength = startValue.length;
  let end;
  const endValue = getText();
  const endLength = endValue.length;

  for (start = 0; start < startLength; start++) {
    if (startValue[start] !== endValue[start]) {
      break;
    }
  }

  const minEnd = startLength - start;
  for (end = 1; end <= minEnd; end++) {
    if (startValue[startLength - end] !== endValue[endLength - end]) {
      break;
    }
  }

  const sliceTail = end > 1 ? 1 - end : undefined;
  fallbackText = endValue.slice(start, sliceTail);
  return fallbackText;
}

export function getText() {
  if ('value' in root) {
    return root.value;
  }
  return root.textContent;
}

/**
 * Google Input Tools provides composition data via a CustomEvent,
 * with the `data` property populated in the `detail` object. If this
 * is available on the event object, use it. If not, this is a plain
 * composition event and we have nothing special to extract.
 */
function getDataFromCustomEvent(event) {
  const detail = event.detail;
  if (typeof detail === 'object' && 'data' in detail) {
    return detail.data;
  }
  return null;
}

/**
 * Return whether a native keypress event is assumed to be a command.
 * This is required because Firefox fires `keypress` events for key commands
 * (cut, copy, select-all, etc.) even though no character is inserted.
 */
function isKeypressCommand(event) {
  return (
    (event.ctrlKey || event.altKey || event.metaKey) &&
    // ctrlKey && altKey is equivalent to AltGr, and is not a command.
    !(event.ctrlKey && event.altKey)
  );
}

/**
 * Check if a composition event was triggered by Korean IME.
 * Our fallback mode does not work well with IE's Korean IME,
 * so just use native composition events when Korean IME is used.
 * Although CompositionEvent.locale property is deprecated,
 * it is available in IE, where our fallback mode is enabled.
 */
function isUsingKoreanIME(event) {
  return event.locale === 'ko';
}

/**
 * Does our fallback mode think that this event is the end of composition?
 */
function isFallbackCompositionEnd(eventName, event) {
  switch (eventName) {
    case KEY_UP:
      // Command keys insert or clear IME input.
      return END_KEYCODES.indexOf(event.keyCode) !== -1;
    case KEY_DOWN:
      // Expect IME keyCode on each keydown. If we get any other
      // code we must have exited earlier.
      return event.keyCode !== START_KEYCODE;
    case KEY_PRESS:
    case MOUSE_DOWN:
    case BLUR:
      // Events are not possible without cancelling IME.
      return true;
    default:
      return false;
  }
}

function getNativeBeforeInputChars(eventName, event) {
  switch (eventName) {
    case COMPOSITION_END:
      return getDataFromCustomEvent(event);
    case KEY_PRESS:
      /**
       * If native `textInput` events are available, our goal is to make
       * use of them. However, there is a special case: the spacebar key.
       * In Webkit, preventing default on a spacebar `textInput` event
       * cancels character insertion, but it *also* causes the browser
       * to fall back to its default spacebar behavior of scrolling the
       * page.
       *
       * Tracking at:
       * https://code.google.com/p/chromium/issues/detail?id=355103
       *
       * To avoid this issue, use the keypress event as if no `textInput`
       * event is available.
       */
      const which = event.which;
      if (which !== SPACEBAR_CODE) {
        return null;
      }

      hasSpaceKeypress = true;
      return SPACEBAR_CHAR;

    case TEXT_INPUT:
      // Record the characters to be added to the DOM.
      const chars = event.data;

      // If it's a spacebar character, assume that we have already handled
      // it at the keypress level and bail immediately. Android Chrome
      // doesn't give us keycodes, so we need to ignore it.
      if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
        return null;
      }

      return chars;

    default:
      // For other native event types, do nothing.
      return null;
  }
}

/**
 * For browsers that do not provide the `textInput` event, extract the
 * appropriate string to use for SyntheticInputEvent.
 */
function getFallbackBeforeInputChars(eventName, event) {
  // If we are currently composing (IME) and using a fallback to do so,
  // try to extract the composed characters from the fallback object.
  // If composition event is available, we extract a string only at
  // compositionevent, otherwise extract it at fallback events.
  if (isComposing) {
    if (
      eventName === COMPOSITION_END ||
      (!canUseCompositionEvent && isFallbackCompositionEnd(eventName, event))
    ) {
      const chars = getData();
      reset();
      isComposing = false;
      return chars;
    }
    return null;
  }

  switch (eventName) {
    case PASTE:
      // If a paste event occurs after a keypress, throw out the input
      // chars. Paste events should not lead to BeforeInput events.
      return null;
    case KEY_PRESS:
      /**
       * As of v27, Firefox may fire keypress events even when no character
       * will be inserted. A few possibilities:
       *
       * - `which` is `0`. Arrow keys, Esc key, etc.
       *
       * - `which` is the pressed key code, but no char is available.
       *   Ex: 'AltGr + d` in Polish. There is no modified character for
       *   this key combination and no character is inserted into the
       *   document, but FF fires the keypress for char code `100` anyway.
       *   No `input` event will occur.
       *
       * - `which` is the pressed key code, but a command combination is
       *   being used. Ex: `Cmd+C`. No character is inserted, and no
       *   `input` event will occur.
       */
      if (!isKeypressCommand(event)) {
        // IE fires the `keypress` event when a user types an emoji via
        // Touch keyboard of Windows.  In such a case, the `char` property
        // holds an emoji character like `\uD83D\uDE0A`.  Because its length
        // is 2, the property `which` does not represent an emoji correctly.
        // In such a case, we directly return the `char` property instead of
        // using `which`.
        if (event.char && event.char.length > 1) {
          return event.char;
        } else if (event.which) {
          return String.fromCharCode(event.which);
        }
      }
      return null;
    case COMPOSITION_END:
      return useFallbackCompositionData && !isUsingKoreanIME(event)
        ? null
        : event.data;
    default:
      return null;
  }
}

/**
 * Does our fallback best-guess model think this event signifies that
 * composition has begun?
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isFallbackCompositionStart(topLevelType, nativeEvent) {
  return topLevelType === KEY_DOWN && nativeEvent.keyCode === START_KEYCODE;
}

function getCompositionEventType(eventName) {
  switch (eventName) {
    case COMPOSITION_START:
      return COMPOSITION_START;
    case COMPOSITION_END:
      return COMPOSITION_END;
    case COMPOSITION_UPDATE:
      return COMPOSITION_UPDATE;
  }
}

function extractCompositionEvent(eventName, event, eventTarget) {
  let eventType;
  let fallbackData;

  if (canUseCompositionEvent) {
    eventType = getCompositionEventType(eventName);
  } else if (!isComposing) {
    if (isFallbackCompositionStart(eventName, event)) {
      eventType = COMPOSITION_START;
    }
  } else if (isFallbackCompositionEnd(eventName, event)) {
    eventType = COMPOSITION_END;
  }

  if (!eventType) {
    return null;
  }

  if (useFallbackCompositionData && !isUsingKoreanIME(event)) {
    // The current composition is stored statically and must not be
    // overwritten while composition continues.
    if (!isComposing && eventType === COMPOSITION_START) {
      isComposing = initialize(eventTarget);
    } else if (eventType === COMPOSITION_END) {
      if (isComposing) {
        fallbackData = getData();
      }
    }
  }

  if (fallbackData) {
    // Inject data generated from fallback path into the synthetic event.
    // This matches the property of native CompositionEventInterface.
    Object.defineProperty(event, 'data', {
      value: fallbackData,
    });
  } else {
    const customData = getDataFromCustomEvent(event);
    if (customData !== null) {
      Object.defineProperty(event, 'data', {
        value: customData,
      });
    }
  }

  return processContext => {
    if (processContext.eventName === `onBeforeInput-polyfill`) {
      if (eventName === COMPOSITION_END) {
        processContext.eventName = `onCompositionEnd-polyfill`;
      } else if (eventName === COMPOSITION_UPDATE) {
        processContext.eventName = `onCompositionUpdate-polyfill`;
      } else if (eventName === COMPOSITION_START) {
        processContext.eventName = `onCompositionStart-polyfill`;
      }
    }
    return traverseTwoPhase(processContext);
  };
}

/**
 * Extract a SyntheticInputEvent for `beforeInput`, based on either native
 * `textInput` or fallback behavior.
 */
function extractBeforeInputEvent(eventName, event) {
  let chars;

  if (canUseTextInputEvent) {
    chars = getNativeBeforeInputChars(eventName, event);
  } else {
    chars = getFallbackBeforeInputChars(eventName, event);
  }

  // If no characters are being inserted, no BeforeInput event should
  // be fired.
  if (!chars) {
    return null;
  }

  Object.defineProperty(event, 'data', {
    value: chars,
  });

  return processContext => {
    processContext.eventName = `onBeforeInput-polyfill`;
    return traverseTwoPhase(processContext);
  };
}

/**
 * Create an `onBeforeInput` event to match
 * http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105/#events-inputevents.
 *
 * This event plugin is based on the native `textInput` event
 * available in Chrome, Safari, Opera, and IE. This event fires after
 * `onKeyPress` and `onCompositionEnd`, but before `onInput`.
 *
 * `beforeInput` is spec'd but not implemented in any browsers, and
 * the `input` event does not provide any useful information about what has
 * actually been added, contrary to the spec. Thus, `textInput` is the best
 * available event to identify the characters that have actually been inserted
 * into the target node.
 *
 * This plugin is also responsible for emitting `composition` events, thus
 * allowing us to share composition fallback code for both `beforeInput` and
 * `composition` event types.
 */
function polyfilledEventListener(eventName, event, eventTarget) {
  const composition = extractCompositionEvent(eventName, event, eventTarget);
  const beforeInput = extractBeforeInputEvent(eventName, event);

  if (composition === null) {
    return beforeInput;
  }
  if (beforeInput === null) {
    return composition;
  }
  return beforeInput;
}

const onCompositionUpdateDependencies = [
  BLUR,
  COMPOSITION_UPDATE,
  KEY_DOWN,
  KEY_PRESS,
  KEY_UP,
  MOUSE_DOWN,
];

export const onCompositionUpdateHeuristics = [
  onCompositionUpdateDependencies,
  polyfilledEventListener,
];

const onCompositionStartDependencies = [
  BLUR,
  COMPOSITION_START,
  KEY_DOWN,
  KEY_PRESS,
  KEY_UP,
  MOUSE_DOWN,
];

export const onCompositionStartHeuristics = [
  onCompositionStartDependencies,
  polyfilledEventListener,
];

const onCompositionEndDependencies = [
  BLUR,
  COMPOSITION_END,
  KEY_DOWN,
  KEY_PRESS,
  KEY_UP,
  MOUSE_DOWN,
];

export const onCompositionEndHeuristics = [
  onCompositionEndDependencies,
  polyfilledEventListener,
];

const onBeforeInputDependencies = [
  COMPOSITION_END,
  KEY_PRESS,
  TEXT_INPUT,
  PASTE,
];

export const onBeforeInputHeuristics = [
  onBeforeInputDependencies,
  polyfilledEventListener,
];

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactDOMResponderEvent,
  ReactDOMResponderContext,
} from 'shared/ReactDOMTypes';

import React from 'react';
import {DiscreteEvent} from 'shared/ReactTypes';
import type {ReactEventResponderListener} from 'shared/ReactTypes';

type KeyboardEventType = 'keydown' | 'keyup';

type KeyboardProps = {
  disabled: boolean,
  onKeyDown: (e: KeyboardEvent) => void,
  onKeyUp: (e: KeyboardEvent) => void,
  preventKeys: Array<string>,
};

type KeyboardEvent = {|
  altKey: boolean,
  ctrlKey: boolean,
  isComposing: boolean,
  key: string,
  location: number,
  metaKey: boolean,
  repeat: boolean,
  shiftKey: boolean,
  target: Element | Document,
  type: KeyboardEventType,
  timeStamp: number,
  defaultPrevented: boolean,
|};

const isArray = Array.isArray;
const targetEventTypes = ['keydown_active', 'keyup'];
const modifiers = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];

/**
 * Normalization of deprecated HTML5 `key` values
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
const normalizeKey = {
  Esc: 'Escape',
  Spacebar: ' ',
  Left: 'ArrowLeft',
  Up: 'ArrowUp',
  Right: 'ArrowRight',
  Down: 'ArrowDown',
  Del: 'Delete',
  Win: 'OS',
  Menu: 'ContextMenu',
  Apps: 'ContextMenu',
  Scroll: 'ScrollLock',
  MozPrintableKey: 'Unidentified',
};

/**
 * Translation from legacy `keyCode` to HTML5 `key`
 * Only special keys supported, all others depend on keyboard layout or browser
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
const translateToKey = {
  '8': 'Backspace',
  '9': 'Tab',
  '12': 'Clear',
  '13': 'Enter',
  '16': 'Shift',
  '17': 'Control',
  '18': 'Alt',
  '19': 'Pause',
  '20': 'CapsLock',
  '27': 'Escape',
  '32': ' ',
  '33': 'PageUp',
  '34': 'PageDown',
  '35': 'End',
  '36': 'Home',
  '37': 'ArrowLeft',
  '38': 'ArrowUp',
  '39': 'ArrowRight',
  '40': 'ArrowDown',
  '45': 'Insert',
  '46': 'Delete',
  '112': 'F1',
  '113': 'F2',
  '114': 'F3',
  '115': 'F4',
  '116': 'F5',
  '117': 'F6',
  '118': 'F7',
  '119': 'F8',
  '120': 'F9',
  '121': 'F10',
  '122': 'F11',
  '123': 'F12',
  '144': 'NumLock',
  '145': 'ScrollLock',
  '224': 'Meta',
};

function isFunction(obj): boolean {
  return typeof obj === 'function';
}

function getEventKey(nativeEvent: Object): string {
  const nativeKey = nativeEvent.key;
  if (nativeKey) {
    // Normalize inconsistent values reported by browsers due to
    // implementations of a working draft specification.

    // FireFox implements `key` but returns `MozPrintableKey` for all
    // printable characters (normalized to `Unidentified`), ignore it.
    const key = normalizeKey[nativeKey] || nativeKey;
    if (key !== 'Unidentified') {
      return key;
    }
  }
  return translateToKey[nativeEvent.keyCode] || 'Unidentified';
}

function createKeyboardEvent(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  type: KeyboardEventType,
  defaultPrevented: boolean,
): KeyboardEvent {
  const nativeEvent = (event: any).nativeEvent;
  const {
    altKey,
    ctrlKey,
    isComposing,
    location,
    metaKey,
    repeat,
    shiftKey,
  } = nativeEvent;
  const target = ((context.getCurrentTarget(): any): Element);

  return {
    altKey,
    ctrlKey,
    defaultPrevented,
    isComposing,
    key: getEventKey(nativeEvent),
    location,
    metaKey,
    repeat,
    shiftKey,
    target,
    timeStamp: context.getTimeStamp(),
    type,
  };
}

function dispatchKeyboardEvent(
  event: ReactDOMResponderEvent,
  listener: KeyboardEvent => void,
  context: ReactDOMResponderContext,
  type: KeyboardEventType,
  defaultPrevented: boolean,
): void {
  const syntheticEvent = createKeyboardEvent(
    event,
    context,
    type,
    defaultPrevented,
  );
  const shouldPropagate = context.dispatchEvent(
    syntheticEvent,
    listener,
    DiscreteEvent,
  );
  if (shouldPropagate) {
    context.continuePropagation();
  }
}

const keyboardResponderImpl = {
  targetEventTypes,
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: KeyboardProps,
  ): void {
    const {type} = event;
    const nativeEvent: any = event.nativeEvent;

    if (props.disabled) {
      return;
    }
    let defaultPrevented = nativeEvent.defaultPrevented === true;
    if (type === 'keydown') {
      const preventKeys = props.preventKeys;
      if (!defaultPrevented && isArray(preventKeys)) {
        preventKeyLoop: for (let i = 0; i < preventKeys.length; i++) {
          const preventKey = preventKeys[i];
          let key = preventKey;

          if (isArray(preventKey)) {
            key = preventKey[0];
            const config = ((preventKey[1]: any): Object);
            for (let s = 0; s < modifiers.length; s++) {
              const modifier = modifiers[s];
              if (
                (config[modifier] && !nativeEvent[modifier]) ||
                (!config[modifier] && nativeEvent[modifier])
              ) {
                continue preventKeyLoop;
              }
            }
          }
          if (key === getEventKey(nativeEvent)) {
            defaultPrevented = true;
            nativeEvent.preventDefault();
            break;
          }
        }
      }
      const onKeyDown = props.onKeyDown;
      if (isFunction(onKeyDown)) {
        dispatchKeyboardEvent(
          event,
          onKeyDown,
          context,
          'keydown',
          defaultPrevented,
        );
      }
    } else if (type === 'keyup') {
      const onKeyUp = props.onKeyUp;
      if (isFunction(onKeyUp)) {
        dispatchKeyboardEvent(
          event,
          onKeyUp,
          context,
          'keyup',
          defaultPrevented,
        );
      }
    }
  },
};

export const KeyboardResponder = React.unstable_createResponder(
  'Keyboard',
  keyboardResponderImpl,
);

export function useKeyboard(
  props: KeyboardProps,
): ReactEventResponderListener<any, any> {
  return React.unstable_useResponder(KeyboardResponder, props);
}

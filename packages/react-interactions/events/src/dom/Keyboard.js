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
} from 'react-dom/src/shared/ReactDOMTypes';
import type {ReactEventResponderListener} from 'shared/ReactTypes';

import * as React from 'react';
import {DiscreteEvent} from 'shared/ReactTypes';
import {isVirtualClick} from './shared';

type KeyboardEventType =
  | 'keyboard:click'
  | 'keyboard:keydown'
  | 'keyboard:keyup';

type KeyboardProps = {|
  disabled?: boolean,
  onClick?: (e: KeyboardEvent) => void,
  onKeyDown?: (e: KeyboardEvent) => void,
  onKeyUp?: (e: KeyboardEvent) => void,
|};

type KeyboardState = {|
  isActive: boolean,
|};

export type KeyboardEvent = {|
  altKey: boolean,
  ctrlKey: boolean,
  defaultPrevented: boolean,
  isComposing?: boolean,
  key?: string,
  metaKey: boolean,
  pointerType: 'keyboard',
  shiftKey: boolean,
  target: Element | Document,
  type: KeyboardEventType,
  timeStamp: number,
  continuePropagation: () => void,
  preventDefault: () => void,
|};

const targetEventTypes = ['click_active', 'keydown_active', 'keyup'];

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
): KeyboardEvent {
  const nativeEvent = (event: any).nativeEvent;
  const {altKey, ctrlKey, metaKey, shiftKey} = nativeEvent;
  let keyboardEvent = {
    altKey,
    ctrlKey,
    defaultPrevented: nativeEvent.defaultPrevented === true,
    metaKey,
    pointerType: 'keyboard',
    shiftKey,
    target: event.target,
    timeStamp: context.getTimeStamp(),
    type,
    // We don't use stopPropagation, as the default behavior
    // is to not propagate. Plus, there might be confusion
    // using stopPropagation as we don't actually stop
    // native propagation from working, but instead only
    // allow propagation to the others keyboard responders.
    continuePropagation() {
      context.continuePropagation();
    },
    preventDefault() {
      keyboardEvent.defaultPrevented = true;
      nativeEvent.preventDefault();
    },
  };
  if (type !== 'keyboard:click') {
    const key = getEventKey(nativeEvent);
    const isComposing = nativeEvent.isComposing;
    keyboardEvent = context.objectAssign({isComposing, key}, keyboardEvent);
  }
  return keyboardEvent;
}

function dispatchKeyboardEvent(
  event: ReactDOMResponderEvent,
  listener: KeyboardEvent => void,
  context: ReactDOMResponderContext,
  type: KeyboardEventType,
): void {
  const syntheticEvent = createKeyboardEvent(event, context, type);
  context.dispatchEvent(syntheticEvent, listener, DiscreteEvent);
}

const keyboardResponderImpl = {
  targetEventTypes,
  targetPortalPropagation: true,
  getInitialState(): KeyboardState {
    return {
      isActive: false,
    };
  },
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: KeyboardProps,
    state: KeyboardState,
  ): void {
    const {type} = event;

    if (props.disabled) {
      return;
    }

    if (type === 'keydown') {
      state.isActive = true;
      const onKeyDown = props.onKeyDown;
      if (onKeyDown != null) {
        dispatchKeyboardEvent(
          event,
          ((onKeyDown: any): (e: KeyboardEvent) => void),
          context,
          'keyboard:keydown',
        );
      }
    } else if (type === 'click' && isVirtualClick(event)) {
      const onClick = props.onClick;
      if (onClick != null) {
        dispatchKeyboardEvent(event, onClick, context, 'keyboard:click');
      }
    } else if (type === 'keyup') {
      state.isActive = false;
      const onKeyUp = props.onKeyUp;
      if (onKeyUp != null) {
        dispatchKeyboardEvent(
          event,
          ((onKeyUp: any): (e: KeyboardEvent) => void),
          context,
          'keyboard:keyup',
        );
      }
    }
  },
};

// $FlowFixMe Can't add generic types without causing a parsing/syntax errors
export const KeyboardResponder = React.DEPRECATED_createResponder(
  'Keyboard',
  keyboardResponderImpl,
);

export function useKeyboard(
  props: KeyboardProps,
): ?ReactEventResponderListener<any, any> {
  return React.DEPRECATED_useResponder(KeyboardResponder, props);
}

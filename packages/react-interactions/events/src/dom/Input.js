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

import * as React from 'react';
import {DiscreteEvent} from 'shared/ReactTypes';
import type {ReactEventResponderListener} from 'shared/ReactTypes';

type InputEventType = 'change' | 'beforechange' | 'valuechange';

type InputResponderProps = {
  disabled: boolean,
  onBeforeChange: (e: InputEvent) => void,
  onChange: (e: InputEvent) => void,
  onValueChange: (value: string | boolean) => void,
  ...
};

type InputEvent = {|
  data: string,
  isComposing: boolean,
  inputType: string,
  dataTransfer: null | string,
  target: Element | Document,
  type: InputEventType,
  timeStamp: number,
|};

const targetEventTypes = ['input', 'change', 'beforeinput', 'click'];

const supportedInputTypes = new Set([
  'color',
  'date',
  'datetime',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'range',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
]);

function isFunction(obj): boolean {
  return typeof obj === 'function';
}

function createInputEvent(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  type: InputEventType,
  target: Document | Element,
): InputEvent {
  const {data, dataTransfer, inputType, isComposing} = (event: any).nativeEvent;
  return {
    data,
    dataTransfer,
    inputType,
    isComposing,
    target,
    timeStamp: context.getTimeStamp(),
    type,
  };
}

function dispatchInputEvent(
  event: ReactDOMResponderEvent,
  listener: InputEvent => void,
  context: ReactDOMResponderContext,
  type: InputEventType,
  target: Element | Document,
): void {
  const syntheticEvent = createInputEvent(event, context, type, target);
  context.dispatchEvent(syntheticEvent, listener, DiscreteEvent);
}

function getNodeName(elem: Element | Document): string {
  return elem.nodeName && elem.nodeName.toLowerCase();
}

function isTextInputElement(elem: Element | Document): boolean {
  const nodeName = getNodeName(elem);
  const type = (elem: any).type;
  return (
    nodeName === 'textarea' ||
    (nodeName === 'input' && (type == null || supportedInputTypes.has(type)))
  );
}

function isCheckable(elem: Element | Document): boolean {
  const nodeName = getNodeName(elem);
  const type = (elem: any).type;
  return nodeName === 'input' && (type === 'checkbox' || type === 'radio');
}

function shouldUseChangeEvent(elem: Element | Document): boolean {
  const nodeName = getNodeName(elem);
  return (
    nodeName === 'select' ||
    (nodeName === 'input' && (elem: any).type === 'file')
  );
}

function dispatchChangeEvent(
  context: ReactDOMResponderContext,
  props: InputResponderProps,
  target: Element | Document,
): void {
  const onValueChange = props.onValueChange;
  if (isFunction(onValueChange)) {
    const value = getValueFromNode(target);
    context.dispatchEvent(value, onValueChange, DiscreteEvent);
  }
}

function dispatchBothChangeEvents(
  event: ReactDOMResponderEvent,
  context: ReactDOMResponderContext,
  props: InputResponderProps,
  target: Document | Element,
): void {
  context.enqueueStateRestore(target);
  const onChange = props.onChange;
  if (isFunction(onChange)) {
    dispatchInputEvent(event, onChange, context, 'change', target);
  }
  dispatchChangeEvent(context, props, target);
}

function updateValueIfChanged(elem: Element | Document): boolean {
  // React's internal value tracker
  const valueTracker = (elem: any)._valueTracker;
  if (valueTracker == null) {
    return true;
  }
  const prevValue = valueTracker.getValue();
  const nextValue = getValueFromNode(elem);

  if (prevValue !== nextValue) {
    valueTracker.setValue(nextValue);
    return true;
  }
  return false;
}

function getValueFromNode(node: Element | Document): string {
  let value = '';
  if (!node) {
    return value;
  }

  if (isCheckable(node)) {
    value = (node: any).checked ? 'true' : 'false';
  } else {
    value = (node: any).value;
  }

  return value;
}

const inputResponderImpl = {
  targetEventTypes,
  onEvent(
    event: ReactDOMResponderEvent,
    context: ReactDOMResponderContext,
    props: InputResponderProps,
  ): void {
    const {type, target} = event;

    if (props.disabled) {
      return;
    }
    const currentTarget = context.getResponderNode();
    if (target !== currentTarget || currentTarget === null) {
      return;
    }
    switch (type) {
      default: {
        if (shouldUseChangeEvent(target) && type === 'change') {
          dispatchBothChangeEvents(event, context, props, currentTarget);
        } else if (
          isTextInputElement(target) &&
          (type === 'input' || type === 'change') &&
          updateValueIfChanged(target)
        ) {
          dispatchBothChangeEvents(event, context, props, currentTarget);
        } else if (
          isCheckable(target) &&
          type === 'click' &&
          updateValueIfChanged(target)
        ) {
          dispatchBothChangeEvents(event, context, props, currentTarget);
        }
        break;
      }
    }
  },
};

export const InputResponder = React.DEPRECATED_createResponder(
  'Input',
  inputResponderImpl,
);

export function useInput(
  props: InputResponderProps,
): ReactEventResponderListener<any, any> {
  return React.DEPRECATED_useResponder(InputResponder, props);
}

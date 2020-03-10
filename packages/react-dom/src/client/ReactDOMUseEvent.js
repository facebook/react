/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'shared/ReactTypes';
import type {
  ReactDOMListenerEvent,
  ReactDOMListenerMap,
} from 'shared/ReactDOMTypes';

import ReactSharedInternals from 'shared/ReactSharedInternals';
import invariant from 'shared/invariant';

import {getEventPriorityForListenerSystem} from '../events/DOMEventProperties';

type EventOptions = {|
  capture?: boolean,
  passive?: boolean,
  priority?: EventPriority,
|};

const {ReactCurrentDispatcher} = ReactSharedInternals;

function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  invariant(
    dispatcher !== null,
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
      ' one of the following reasons:\n' +
      '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
      '2. You might be breaking the Rules of Hooks\n' +
      '3. You might have more than one copy of React in the same app\n' +
      'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
  );
  return dispatcher;
}

export function useEvent(
  type: string,
  options?: EventOptions,
): ReactDOMListenerMap {
  const dispatcher = resolveDispatcher();
  let capture = false;
  let passive = false;
  let priority = getEventPriorityForListenerSystem((type: any));

  if (options != null) {
    const optionsCapture = options.capture;
    const optionsPassive = options.passive;
    const optionsPriority = options.priority;

    if (typeof optionsCapture === 'boolean') {
      capture = optionsCapture;
    }
    if (typeof optionsPassive === 'boolean') {
      passive = optionsPassive;
    }
    if (typeof optionsPriority === 'number') {
      priority = optionsPriority;
    }
  }
  const event: ReactDOMListenerEvent = {
    capture,
    passive,
    priority,
    type,
  };
  return dispatcher.useEvent(event);
}

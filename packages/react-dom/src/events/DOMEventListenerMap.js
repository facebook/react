/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';

import {registrationNameDependencies} from 'legacy-events/EventPluginRegistry';

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
// $FlowFixMe: Flow cannot handle polymorphic WeakMaps
const elementListenerMap: WeakMap<
  EventTarget,
  ElementListenerMap,
> = new PossiblyWeakMap();

export type ElementListenerMap = Map<
  DOMTopLevelEventType | string,
  ElementListenerMapEntry,
>;

export type ElementListenerMapEntry = {
  passive: void | boolean,
  listener: any => void,
};

export function getListenerMapForElement(
  target: EventTarget,
): ElementListenerMap {
  let listenerMap = elementListenerMap.get(target);
  if (listenerMap === undefined) {
    listenerMap = new Map();
    elementListenerMap.set(target, listenerMap);
  }
  return listenerMap;
}

export function isListeningToAllDependencies(
  registrationName: string,
  mountAt: Document | Element,
): boolean {
  const dependencies = registrationNameDependencies[registrationName];
  return isListeningToEvents(dependencies, mountAt);
}

export function isListeningToEvents(
  events: Array<string>,
  mountAt: Document | Element,
): boolean {
  const listenerMap = getListenerMapForElement(mountAt);
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!listenerMap.has(event)) {
      return false;
    }
  }
  return true;
}

export function isListeningToEvent(
  registrationName: string,
  mountAt: Document | Element,
): boolean {
  const listenerMap = getListenerMapForElement(mountAt);
  return listenerMap.has(registrationName);
}

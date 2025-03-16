/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {FiberRoot} from './ReactInternalTypes';
import type {ViewTransitionInstance, Instance} from './ReactFiberConfig';

import {
  getWorkInProgressRoot,
  getPendingTransitionTypes,
} from './ReactFiberWorkLoop';

import {getIsHydrating} from './ReactFiberHydrationContext';

import {getTreeId} from './ReactFiberTreeContext';

export type ViewTransitionClassPerType = {
  [transitionType: 'default' | string]: 'none' | string,
};

export type ViewTransitionClass = 'none' | string | ViewTransitionClassPerType;

export type ViewTransitionProps = {
  name?: string,
  children?: ReactNodeList,
  className?: ViewTransitionClass,
  enter?: ViewTransitionClass,
  exit?: ViewTransitionClass,
  layout?: ViewTransitionClass,
  share?: ViewTransitionClass,
  update?: ViewTransitionClass,
  onEnter?: (instance: ViewTransitionInstance, types: Array<string>) => void,
  onExit?: (instance: ViewTransitionInstance, types: Array<string>) => void,
  onLayout?: (instance: ViewTransitionInstance, types: Array<string>) => void,
  onShare?: (instance: ViewTransitionInstance, types: Array<string>) => void,
  onUpdate?: (instance: ViewTransitionInstance, types: Array<string>) => void,
};

export type ViewTransitionState = {
  autoName: null | string, // the view-transition-name to use when an explicit one is not specified
  paired: null | ViewTransitionState, // a temporary state during the commit phase if we have paired this with another instance
  clones: null | Array<Instance>, // a temporary state during the apply gesture phase if we cloned this boundary
  ref: null | ViewTransitionInstance, // the current ref instance. This can change through the lifetime of the instance.
};

let globalClientIdCounter: number = 0;

export function assignViewTransitionAutoName(
  props: ViewTransitionProps,
  instance: ViewTransitionState,
): string {
  if (instance.autoName !== null) {
    return instance.autoName;
  }

  const root = ((getWorkInProgressRoot(): any): FiberRoot);
  const identifierPrefix = root.identifierPrefix;

  let name;
  if (getIsHydrating()) {
    const treeId = getTreeId();
    // Use a captial R prefix for server-generated ids.
    name = '\u00AB' + identifierPrefix + 'T' + treeId + '\u00BB';
  } else {
    // Use a lowercase r prefix for client-generated ids.
    const globalClientId = globalClientIdCounter++;
    name =
      '\u00AB' +
      identifierPrefix +
      't' +
      globalClientId.toString(32) +
      '\u00BB';
  }
  instance.autoName = name;
  return name;
}

export function getViewTransitionName(
  props: ViewTransitionProps,
  instance: ViewTransitionState,
): string {
  if (props.name != null && props.name !== 'auto') {
    return props.name;
  }
  // We should have assigned a name by now.
  return (instance.autoName: any);
}

function getClassNameByType(classByType: ?ViewTransitionClass): ?string {
  if (classByType == null || typeof classByType === 'string') {
    return classByType;
  }
  let className: ?string = null;
  const activeTypes = getPendingTransitionTypes();
  if (activeTypes !== null) {
    for (let i = 0; i < activeTypes.length; i++) {
      const match = classByType[activeTypes[i]];
      if (match != null) {
        if (match === 'none') {
          // If anything matches "none" that takes precedence over any other
          // type that also matches.
          return 'none';
        }
        if (className == null) {
          className = match;
        } else {
          className += ' ' + match;
        }
      }
    }
  }
  if (className == null) {
    // We had no other matches. Match the default for this configuration.
    return classByType.default;
  }
  return className;
}

export function getViewTransitionClassName(
  defaultClass: ?ViewTransitionClass,
  eventClass: ?ViewTransitionClass,
): ?string {
  const className: ?string = getClassNameByType(defaultClass);
  const eventClassName: ?string = getClassNameByType(eventClass);
  if (eventClassName == null) {
    return className;
  }
  if (eventClassName === 'none') {
    return eventClassName;
  }
  if (className != null && className !== 'none') {
    return className + ' ' + eventClassName;
  }
  return eventClassName;
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ViewTransitionClass, ViewTransitionProps} from 'shared/ReactTypes';
import type {Fiber, FiberRoot} from './ReactInternalTypes';
import type {ViewTransitionInstance, Instance} from './ReactFiberConfig';

import {
  getCommittingRoot,
  getPendingTransitionTypes,
} from './ReactFiberWorkLoop';
import {getComponentNameFromOwner} from './getComponentNameFromFiber';

export type ViewTransitionState = {
  autoName: null | string, // the view-transition-name to use when an explicit one is not specified
  paired: null | ViewTransitionState, // a temporary state during the commit phase if we have paired this with another instance
  clones: null | Array<Instance>, // a temporary state during the apply gesture phase if we cloned this boundary
  ref: null | ViewTransitionInstance, // the current ref instance. This can change through the lifetime of the instance.
};

let globalClientIdCounter: number = 0;

export function getViewTransitionName(viewTransitionFiber: Fiber): string {
  const props: ViewTransitionProps = viewTransitionFiber.memoizedProps;
  const instance: ViewTransitionState = viewTransitionFiber.stateNode;

  if (props.name != null && props.name !== 'auto') {
    return props.name;
  }
  if (instance.autoName !== null) {
    return instance.autoName;
  }

  // We assume we always call this in the commit phase.
  const root = ((getCommittingRoot(): any): FiberRoot);
  const identifierPrefix = root.identifierPrefix;
  const globalClientId = globalClientIdCounter++;
  let name = '';
  if (__DEV__) {
    let owner = '';
    if (viewTransitionFiber._debugOwner) {
      const componentName = getComponentNameFromOwner(
        viewTransitionFiber._debugOwner,
      );
      if (componentName) {
        owner = formatOwnerNameDEV(componentName);
      } else {
        owner = 'UnnamedOwner';
      }
    } else {
      owner = 'UnknownOwner';
    }
    name =
      '\u00AB' +
      identifierPrefix +
      't' +
      globalClientId.toString(32) +
      '_' +
      owner +
      '_' +
      '\u00BB';
  } else {
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

function formatOwnerNameDEV(ownerName: string): string {
  // Strip to 16 characters and replace invalid characters.
  // We don't need to replace invalid first characters or forbidden values
  // because result will be prefixed.
  return ownerName.slice(0, 16).replace(/[^a-zA-Z0-9_-]/g, '\u2733');
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
    return className === 'auto' ? null : className;
  }
  if (eventClassName === 'auto') {
    return null;
  }
  return eventClassName;
}

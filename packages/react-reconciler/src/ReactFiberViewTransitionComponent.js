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

import {getWorkInProgressRoot} from './ReactFiberWorkLoop';

import {getIsHydrating} from './ReactFiberHydrationContext';

import {getTreeId} from './ReactFiberTreeContext';

export type ViewTransitionProps = {
  name?: string,
  className?: string,
  children?: ReactNodeList,
};

export type ViewTransitionInstance = {
  autoName: null | string, // the view-transition-name to use when an explicit one is not specified
  paired: null | ViewTransitionInstance, // a temporary state during the commit phase if we have paired this with another instance
};

let globalClientIdCounter: number = 0;

export function assignViewTransitionAutoName(
  props: ViewTransitionProps,
  instance: ViewTransitionInstance,
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
  instance: ViewTransitionInstance,
): string {
  if (props.name != null && props.name !== 'auto') {
    return props.name;
  }
  // We should have assigned a name by now.
  return (instance.autoName: any);
}

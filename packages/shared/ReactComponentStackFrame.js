/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Source} from 'shared/ReactElementType';
import type {LazyComponent} from 'react/src/ReactLazy';

import {
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_MEMO_TYPE,
  REACT_BLOCK_TYPE,
  REACT_LAZY_TYPE,
} from 'shared/ReactSymbols';

const BEFORE_SLASH_RE = /^(.*)[\\\/]/;

function describeComponentFrame(
  name: null | string,
  source: void | null | Source,
  ownerName: null | string,
) {
  let sourceInfo = '';
  if (__DEV__ && source) {
    const path = source.fileName;
    let fileName = path.replace(BEFORE_SLASH_RE, '');
    // In DEV, include code for a common special case:
    // prefer "folder/index.js" instead of just "index.js".
    if (/^index\./.test(fileName)) {
      const match = path.match(BEFORE_SLASH_RE);
      if (match) {
        const pathBeforeSlash = match[1];
        if (pathBeforeSlash) {
          const folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, '');
          fileName = folderName + '/' + fileName;
        }
      }
    }
    sourceInfo = ' (at ' + fileName + ':' + source.lineNumber + ')';
  } else if (ownerName) {
    sourceInfo = ' (created by ' + ownerName + ')';
  }
  return '\n    in ' + (name || 'Unknown') + sourceInfo;
}

export function describeBuiltInComponentFrame(
  name: string,
  source: void | null | Source,
  ownerFn: void | null | Function,
): string {
  let ownerName = null;
  if (__DEV__ && ownerFn) {
    ownerName = ownerFn.displayName || ownerFn.name || null;
  }
  return describeComponentFrame(name, source, ownerName);
}

export function describeClassComponentFrame(
  ctor: Function,
  source: void | null | Source,
  ownerFn: void | null | Function,
): string {
  return describeFunctionComponentFrame(ctor, source, ownerFn);
}

export function describeFunctionComponentFrame(
  fn: Function,
  source: void | null | Source,
  ownerFn: void | null | Function,
): string {
  if (!fn) {
    return '';
  }
  const name = fn.displayName || fn.name || null;
  let ownerName = null;
  if (__DEV__ && ownerFn) {
    ownerName = ownerFn.displayName || ownerFn.name || null;
  }
  return describeComponentFrame(name, source, ownerName);
}

function shouldConstruct(Component: Function) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

export function describeUnknownElementTypeFrameInDEV(
  type: any,
  source: void | null | Source,
  ownerFn: void | null | Function,
): string {
  if (!__DEV__) {
    return '';
  }
  if (type == null) {
    return '';
  }
  if (typeof type === 'function') {
    if (shouldConstruct(type)) {
      return describeClassComponentFrame(type, source, ownerFn);
    }
    return describeFunctionComponentFrame(type, source, ownerFn);
  }
  if (typeof type === 'string') {
    return describeBuiltInComponentFrame(type, source, ownerFn);
  }
  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return describeBuiltInComponentFrame('Suspense', source, ownerFn);
    case REACT_SUSPENSE_LIST_TYPE:
      return describeBuiltInComponentFrame('SuspenseList', source, ownerFn);
  }
  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeFunctionComponentFrame(type.render, source, ownerFn);
      case REACT_MEMO_TYPE:
        return describeFunctionComponentFrame(type.type, source, ownerFn);
      case REACT_BLOCK_TYPE:
        return describeFunctionComponentFrame(type._render, source, ownerFn);
      case REACT_LAZY_TYPE: {
        const lazyComponent: LazyComponent<any, any> = (type: any);
        const payload = lazyComponent._payload;
        const init = lazyComponent._init;
        try {
          return describeUnknownElementTypeFrameInDEV(
            init(payload),
            source,
            ownerFn,
          );
        } catch (x) {}
      }
    }
  }
  return '';
}

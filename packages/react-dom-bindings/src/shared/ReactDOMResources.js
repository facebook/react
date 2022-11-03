/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

import isArray from 'shared/isArray';
import {
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
} from 'shared/ReactSymbols';

export function concatTextChildrenProd(children: ReactNodeList): string {
  if (__DEV__) {
    throw new Error(
      'concatTextChildrenProd should never be called when running in development mode. This is a bug in React.',
    );
  }
  const combined = concatTextChildrenImpl(children);
  invalidChild = null;
  return combined;
}

export function concatTextChildrenDev(
  children: ReactNodeList,
  onInvalidChild: ReactNodeList => void,
): string {
  if (!__DEV__) {
    throw new Error(
      'concatTextChildrenDev should never be called when running in production mode. This is a bug in React.',
    );
  }
  const combined = concatTextChildrenImpl(children);
  if (invalidChild) {
    onInvalidChild(invalidChild);
  }
  invalidChild = null;
  return combined;
}

let invalidChild: ReactNodeList = null;
function concatTextChildrenImpl(children: ReactNodeList): string {
  let combined = '';
  if (isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      combined += concatTextChildrenImpl(children[i]);
      if (invalidChild) {
        return '';
      }
    }
    return combined;
  } else if (typeof children === 'object') {
    const {type, props} = (children: any);
    switch (typeof type) {
      case 'symbol': {
        if (type === REACT_FRAGMENT_TYPE) {
          return concatTextChildrenImpl(props.children);
        }
        // We intionally fall through if we are not a fragment because this child is not valid
      }
      // eslint-disable-next-line no-fallthrough
      default: {
        invalidChild = children;
        return '';
      }
    }
  } else if (typeof children === 'string') {
    return children;
  } else if (typeof children === 'number') {
    return '' + children;
  }
  invalidChild = children;
  return '';
}

export function describeInvalidChild(child: ReactNodeList): string {
  if (typeof child === 'object') {
    switch ((child: any).$$typeof) {
      case REACT_ELEMENT_TYPE: {
        const type = (child: any).type;
        switch (typeof type) {
          case 'string':
            return '<' + type + '>...</' + type + '>';
          case 'function': {
            return '<' + type.name + ' ... />';
          }
          case 'object': {
            switch (type.$$typeof) {
              case REACT_FORWARD_REF_TYPE:
                const render = type.render;
                if (render.name) return '<' + type.render.name + ' ... />';
                return 'an anonymous React.forwardRef component';
            }
          }
        }
        return 'a React element';
      }
    }
  }
  return `something with type "${typeof child}"`;
}

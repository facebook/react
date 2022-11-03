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

export function concatTitleTextChildren(children: ReactNodeList): string {
  const combined = concatTextChildren(children);
  if (__DEV__) {
    if (invalidChild) {
      console.error(
        'A title element was rendered with invalid children.' +
          ' In browsers title Elements can only have Text Nodes as children. React expects that the children' +
          ' passed to a title element will be a single string or number (<title>hello world</title> or <title>{1}</title>)' +
          ' or an Array or Fragment of strings and numbers and their combinations (<title><>hello {1}</>goodbye {2}</title>).' +
          ' Instead children contained %s.',
        describeInvalidChild(invalidChild),
      );
    }
  }
  invalidChild = null;
  return combined;
}

let invalidChild: ReactNodeList = null;
function concatTextChildren(children: ReactNodeList): string {
  let combined = '';
  if (isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      combined += concatTextChildren(children[i]);
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
          return concatTextChildren(props.children);
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

function describeInvalidChild(child: ReactNodeList): string {
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

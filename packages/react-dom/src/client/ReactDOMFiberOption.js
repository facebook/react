/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import warning from 'shared/warning';
import validateDOMNesting from './validateDOMNesting';

let didWarnSelectedSetOnOption = false;

function flattenChildren(children) {
  let content = '';

  // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.
  React.Children.forEach(children, function(child) {
    if (child == null) {
      return;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      content += child;
      return;
    }
    if (__DEV__) {
      // We do not have HostContext here
      // but we can put some parent information at least
      validateDOMNesting(child.type, null, {
        current: {
          tag: 'option',
        },
      });
    }
  });

  return content;
}

/**
 * Implements an <option> host component that warns when `selected` is set.
 */

export function validateProps(element: Element, props: Object) {
  // TODO (yungsters): Remove support for `selected` in <option>.
  if (__DEV__) {
    if (props.selected != null && !didWarnSelectedSetOnOption) {
      warning(
        false,
        'Use the `defaultValue` or `value` props on <select> instead of ' +
          'setting `selected` on <option>.',
      );
      didWarnSelectedSetOnOption = true;
    }
  }
}

export function postMountWrapper(element: Element, props: Object) {
  // value="" should make a value attribute (#6219)
  if (props.value != null) {
    element.setAttribute('value', props.value);
  }
}

export function getHostProps(element: Element, props: Object) {
  const hostProps = {children: undefined, ...props};
  const content = flattenChildren(props.children);

  if (content) {
    hostProps.children = content;
  }

  return hostProps;
}

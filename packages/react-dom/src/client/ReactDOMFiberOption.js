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
    }
    // Note: we don't warn about invalid children here.
    // Instead, this is done separately below so that
    // it happens during the hydration codepath too.
  });

  return content;
}

/**
 * Implements an <option> host component that warns when `selected` is set.
 */

export function validateProps(element: Element, props: Object) {
  if (__DEV__) {
    // Warn about invalid children, mirroring the logic above.
    if (typeof props.children === 'object' && props.children !== null) {
      React.Children.forEach(props.children, function(child) {
        if (child == null) {
          return;
        }
        if (typeof child === 'string' || typeof child === 'number') {
          return;
        }
        // This is not real ancestor info but it's close enough
        // to produce a useful warning for invalid children.
        // We don't have access to the real one because the <option>
        // fiber has already been popped, and threading it through
        // is needlessly annoying.
        const ancestorInfo = validateDOMNesting.updatedAncestorInfo(
          null,
          'option',
        );
        validateDOMNesting(child.type, null, ancestorInfo);
      });
    }

    // TODO: Remove support for `selected` in <option>.
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

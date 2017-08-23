/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFiberOption
 * @flow
 */

'use strict';

import {Children} from 'react';
import warning from 'fbjs/lib/warning';

function flattenChildren(children) {
  var content = '';

  // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.
  // We can silently skip them because invalid DOM nesting warning
  // catches these cases in Fiber.
  Children.forEach(children, function(child) {
    if (child == null) {
      return;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      content += child;
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
    warning(
      props.selected == null,
      'Use the `defaultValue` or `value` props on <select> instead of ' +
        'setting `selected` on <option>.',
    );
  }
}

export function postMountWrapper(element: Element, props: Object) {
  // value="" should make a value attribute (#6219)
  if (props.value != null) {
    element.setAttribute('value', props.value);
  }
}

export function getHostProps(element: Element, props: Object) {
  var hostProps = Object.assign({children: undefined}, props);

  var content = flattenChildren(props.children);

  if (content) {
    hostProps.children = content;
  }

  return hostProps;
}

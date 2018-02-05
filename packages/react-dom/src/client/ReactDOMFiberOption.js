/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import warning from 'fbjs/lib/warning';

let didWarnSelectedSetOnOption = false;

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

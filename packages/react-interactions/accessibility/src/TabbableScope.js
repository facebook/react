/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

const tabFocusableImpl = (type: string, props: Object): boolean => {
  if (props.tabIndex === -1 || props.disabled) {
    return false;
  }
  if (props.tabIndex === 0 || props.contentEditable === true) {
    return true;
  }
  if (type === 'a' || type === 'area') {
    return !!props.href && props.rel !== 'ignore';
  }
  if (type === 'input') {
    return props.type !== 'hidden' && props.type !== 'file';
  }
  return (
    type === 'button' ||
    type === 'textarea' ||
    type === 'object' ||
    type === 'select' ||
    type === 'iframe' ||
    type === 'embed'
  );
};

const TabbableScope = React.unstable_createScope(tabFocusableImpl);

export default TabbableScope;

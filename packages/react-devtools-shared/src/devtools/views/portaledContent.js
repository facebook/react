/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {createPortal} from 'react-dom';
import ErrorBoundary from './ErrorBoundary';

export type Props = {
  portalContainer?: Element,
};

export default function portaledContent(
  Component: React$StatelessFunctionalComponent<any>,
): React$StatelessFunctionalComponent<any> {
  return function PortaledContent({portalContainer, ...rest}: Props) {
    const children = (
      <ErrorBoundary>
        <Component {...rest} />
      </ErrorBoundary>
    );

    return portalContainer != null
      ? createPortal(children, portalContainer)
      : children;
  };
}

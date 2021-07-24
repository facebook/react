/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import {createPortal} from 'react-dom';
import ErrorBoundary from './ErrorBoundary';
import {StoreContext} from './context';
import ThemeProvider from './ThemeProvider';

export type Props = {portalContainer?: Element, ...};

export default function portaledContent(
  Component: React$StatelessFunctionalComponent<any>,
): React$StatelessFunctionalComponent<any> {
  return function PortaledContent({portalContainer, ...rest}: Props) {
    const store = useContext(StoreContext);

    const children = (
      <ErrorBoundary store={store}>
        <Component {...rest} />
      </ErrorBoundary>
    );

    return portalContainer != null
      ? createPortal(<ThemeProvider>{children}</ThemeProvider>, portalContainer)
      : children;
  };
}

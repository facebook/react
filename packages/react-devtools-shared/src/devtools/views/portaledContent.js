/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext, useMemo} from 'react';
import {createPortal} from 'react-dom';
import ErrorBoundary from './ErrorBoundary';
import ReactNotDetected from './ReactNotDetected';
import {StoreContext} from './context';
import {useSubscription} from './hooks';
import Store from '../store';

export type Props = {portalContainer?: Element, ...};

export default function portaledContent(
  Component: React$StatelessFunctionalComponent<any>,
  onErrorRetry?: (store: Store) => void,
): React$StatelessFunctionalComponent<any> {
  return function PortaledContent({portalContainer, ...rest}: Props) {
    const store = useContext(StoreContext);
    const subscription = useMemo(
      () => ({
        getCurrentValue: () => {
          return store.profilerStore.isProfiling || store.roots.length > 0;
        },
        subscribe: (callback: Function) => {
          store.addListener('roots', callback);
          store.profilerStore.addListener('isProfiling', callback);
          return () => {
            store.removeListener('roots', callback);
            store.profilerStore.removeListener('isProfiling', callback);
          };
        },
      }),
      [store],
    );

    const isReactDetected = useSubscription<boolean>(subscription);

    const children = (
      <ErrorBoundary store={store} onRetry={onErrorRetry}>
        {isReactDetected ? <Component {...rest} /> : <ReactNotDetected />}
      </ErrorBoundary>
    );

    return portalContainer != null
      ? createPortal(children, portalContainer)
      : children;
  };
}

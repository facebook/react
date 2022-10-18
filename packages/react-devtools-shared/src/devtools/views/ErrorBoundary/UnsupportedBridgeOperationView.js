/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import styles from './shared.css';

type Props = {
  callStack: string | null,
  children: React$Node,
  componentStack: string | null,
  errorMessage: string | null,
};

export default function UnsupportedBridgeOperationView({
  callStack,
  children,
  componentStack,
  errorMessage,
}: Props): React.Node {
  return (
    <div className={styles.ErrorBoundary}>
      {children}
      <div className={styles.ErrorInfo}>
        <div className={styles.HeaderRow}>
          <div className={styles.ErrorHeader}>
            {errorMessage || 'Bridge protocol mismatch'}
          </div>
        </div>
        <div className={styles.InfoBox}>
          An incompatible version of <code>react-devtools-core</code> has been
          embedded in a renderer like React Native. To fix this, update the{' '}
          <code>react-devtools-core</code> package within the React Native
          application, or downgrade the <code>react-devtools</code> package you
          use to open the DevTools UI.
        </div>
        {!!callStack && (
          <div className={styles.ErrorStack}>
            The error was thrown {callStack.trim()}
          </div>
        )}
      </div>
    </div>
  );
}

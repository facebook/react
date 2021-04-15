/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import styles from './shared.css';

type Props = {|
  callStack: string | null,
  children: React$Node,
  componentStack: string | null,
  errorMessage: string | null,
|};

export default function ErrorView({
  callStack,
  children,
  componentStack,
  errorMessage,
}: Props) {
  return (
    <div className={styles.ErrorBoundary}>
      {children}
      <div className={styles.ErrorInfo}>
        <div className={styles.Header}>
          Uncaught Error: {errorMessage || ''}
        </div>
        {!!callStack && (
          <div className={styles.Stack}>
            The error was thrown {callStack.trim()}
          </div>
        )}
        {!!componentStack && (
          <div className={styles.Stack}>
            The error occurred {componentStack.trim()}
          </div>
        )}
      </div>
    </div>
  );
}

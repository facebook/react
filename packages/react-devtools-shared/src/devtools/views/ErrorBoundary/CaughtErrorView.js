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
  info: React$Node | null,
  componentStack: string | null,
  errorMessage: string,
|};

export default function CaughtErrorView({
  callStack,
  children,
  info,
  componentStack,
  errorMessage,
}: Props) {
  return (
    <div className={styles.ErrorBoundary}>
      {children}
      <div className={styles.ErrorInfo}>
        <div className={styles.HeaderRow}>
          <div className={styles.ErrorHeader}>{errorMessage}</div>
        </div>
        {!!info && <div className={styles.InfoBox}>{info}</div>}
        {!!callStack && (
          <div className={styles.ErrorStack}>
            The error was thrown {callStack.trim()}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import styles from './shared.css';

type Props = {|
  callStack: string | null,
  children: React$Node,
  componentStack: string | null,
  dismissError: Function | null,
  errorMessage: string | null,
|};

export default function ErrorView({
  callStack,
  children,
  componentStack,
  dismissError = null,
  errorMessage,
}: Props) {
  return (
    <div className={styles.ErrorBoundary}>
      {children}
      <div className={styles.ErrorInfo}>
        <div className={styles.HeaderRow}>
          <div className={styles.ErrorHeader}>
            Uncaught Error: {errorMessage || ''}
          </div>
          {dismissError !== null && (
            <Button className={styles.CloseButton} onClick={dismissError}>
              Dismiss
              <ButtonIcon className={styles.CloseButtonIcon} type="close" />
            </Button>
          )}
        </div>
        {!!callStack && (
          <div className={styles.ErrorStack}>
            The error was thrown {callStack.trim()}
          </div>
        )}
        {!!componentStack && (
          <div className={styles.ErrorStack}>
            The error occurred {componentStack.trim()}
          </div>
        )}
      </div>
    </div>
  );
}

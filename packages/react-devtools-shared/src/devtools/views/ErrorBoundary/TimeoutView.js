/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

type Props = {
  callStack: string | null,
  children: React$Node,
  componentStack: string | null,
  dismissError: Function,
  errorMessage: string | null,
};

export default function TimeoutView({
  callStack,
  children,
  componentStack,
  dismissError = null,
  errorMessage,
}: Props): React.Node {
  return (
    <div className={styles.ErrorBoundary}>
      {children}
      <div className={styles.ErrorInfo}>
        <div className={styles.HeaderRow}>
          <div className={styles.TimeoutHeader}>
            {errorMessage || 'Timed out waiting'}
          </div>
          <Button className={styles.CloseButton} onClick={dismissError}>
            Retry
            <ButtonIcon className={styles.CloseButtonIcon} type="close" />
          </Button>
        </div>
        {!!componentStack && (
          <div className={styles.TimeoutStack}>
            The timeout occurred {componentStack.trim()}
          </div>
        )}
      </div>
    </div>
  );
}

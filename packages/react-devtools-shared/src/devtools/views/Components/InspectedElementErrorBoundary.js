/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import ErrorBoundary from '../ErrorBoundary';
import styles from './InspectedElementErrorBoundary.css';

type WrapperProps = {|
  children: React$Node,
|};

export default function InspectedElementErrorBoundaryWrapper({
  children,
}: WrapperProps) {
  return (
    <div className={styles.Wrapper}>
      <ErrorBoundary canDismiss={true}>{children}</ErrorBoundary>
    </div>
  );
}

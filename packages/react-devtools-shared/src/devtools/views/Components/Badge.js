/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment} from 'react';
import {
  ElementTypeMemo,
  ElementTypeForwardRef,
} from 'react-devtools-shared/src/types';
import styles from './Badge.css';

import type {ElementType} from 'react-devtools-shared/src/types';

type Props = {|
  className?: string,
  hocDisplayNames: Array<string> | null,
  type: ElementType,
|};

export default function Badge({className, hocDisplayNames, type}: Props) {
  let hocDisplayName = null;
  let totalBadgeCount = 0;
  let typeLabel = null;

  if (hocDisplayNames !== null) {
    hocDisplayName = hocDisplayNames[0];
    totalBadgeCount += hocDisplayNames.length;
  }

  if (type === ElementTypeMemo) {
    typeLabel = 'Memo';
    totalBadgeCount++;
  } else if (type === ElementTypeForwardRef) {
    typeLabel = 'ForwardRef';
    totalBadgeCount++;
  }

  if (hocDisplayNames === null && typeLabel === null) {
    return null;
  }

  return (
    <Fragment>
      <div className={`${styles.Badge} ${className || ''}`}>
        {hocDisplayName || typeLabel}
      </div>
      {totalBadgeCount > 1 && (
        <div className={styles.ExtraLabel}>+{totalBadgeCount - 1}</div>
      )}
    </Fragment>
  );
}

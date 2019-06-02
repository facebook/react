// @flow

import React, { Fragment } from 'react';
import { ElementTypeMemo, ElementTypeForwardRef } from 'src/types';
import styles from './Badge.css';

import type { ElementType } from 'src/types';

type Props = {|
  className?: string,
  hocDisplayNames: Array<string> | null,
  type: ElementType,
|};

export default function Badge({ className, hocDisplayNames, type }: Props) {
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
        <div className={styles.ExtraLabel}>+{totalBadgeCount}</div>
      )}
    </Fragment>
  );
}

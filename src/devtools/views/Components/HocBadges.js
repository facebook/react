// @flow

import React from 'react';
import { ElementTypeForwardRef, ElementTypeMemo } from 'src/types';
import Badge from './Badge';
import styles from './HocBadges.css';

import type { Element } from './types';

type Props = {|
  element: Element,
|};

export default function HocBadges({ element }: Props) {
  const { hocDisplayNames, type } = ((element: any): Element);

  let typeBadge = null;
  if (type === ElementTypeMemo) {
    typeBadge = 'Memo';
  } else if (type === ElementTypeForwardRef) {
    typeBadge = 'ForwardRef';
  }

  if (hocDisplayNames === null && typeBadge === null) {
    return null;
  }

  return (
    <div className={styles.HocBadges}>
      <Badge>{typeBadge}</Badge>
      {hocDisplayNames !== null &&
        hocDisplayNames.map(hocDisplayName => (
          <Badge key={hocDisplayName}>{hocDisplayName}</Badge>
        ))}
    </div>
  );
}

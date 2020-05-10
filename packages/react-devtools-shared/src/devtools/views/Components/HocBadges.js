/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  ElementTypeForwardRef,
  ElementTypeMemo,
} from 'react-devtools-shared/src/types';
import styles from './HocBadges.css';

import type {Element} from './types';

type Props = {|
  element: Element,
|};

export default function HocBadges({element}: Props) {
  const {hocDisplayNames, type} = ((element: any): Element);

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
      {typeBadge !== null && <div className={styles.Badge}>{typeBadge}</div>}
      {hocDisplayNames !== null &&
        hocDisplayNames.map(hocDisplayName => (
          <div key={hocDisplayName} className={styles.Badge}>
            {hocDisplayName}
          </div>
        ))}
    </div>
  );
}

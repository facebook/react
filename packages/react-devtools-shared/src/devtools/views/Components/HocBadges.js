/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import styles from './HocBadges.css';

import type {Element} from './types';

type Props = {|
  element: Element,
|};

export default function HocBadges({element}: Props) {
  const {hocDisplayNames} = ((element: any): Element);

  if (hocDisplayNames === null) {
    return null;
  }

  return (
    <div className={styles.HocBadges}>
      {hocDisplayNames !== null &&
        hocDisplayNames.map(hocDisplayName => (
          <div key={hocDisplayName} className={styles.Badge}>
            {hocDisplayName}
          </div>
        ))}
    </div>
  );
}

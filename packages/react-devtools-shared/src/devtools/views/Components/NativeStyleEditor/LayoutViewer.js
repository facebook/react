/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import styles from './LayoutViewer.css';

import type {Layout} from './types';

type Props = {
  id: number,
  layout: Layout,
};

export default function LayoutViewer({id, layout}: Props): React.Node {
  const {height, margin, padding, y, width, x} = layout;

  return (
    <div className={styles.LayoutViewer}>
      <div className={styles.Header}>layout</div>
      <div className={styles.DashedBox}>
        <div className={styles.LabelRow}>
          <label className={styles.Label}>margin</label>

          <label>{margin.top || '-'}</label>
        </div>

        <div className={styles.BoxRow}>
          <label>{margin.left || '-'}</label>

          <div className={styles.SolidBox}>
            <div className={styles.LabelRow}>
              <label className={styles.Label}>padding</label>

              <label>{padding.top || '-'}</label>
            </div>

            <div className={styles.BoxRow}>
              <label>{padding.left || '-'}</label>

              <div className={styles.DashedBox}>
                <div className={styles.LabelRow}>
                  {format(width)} x {format(height)} ({format(x)}, {format(y)})
                </div>
              </div>

              <label>{padding.right || '-'}</label>
            </div>

            <label>{padding.bottom || '-'}</label>
          </div>
          <label>{margin.right || '-'}</label>
        </div>
        <label>{margin.bottom || '-'}</label>
      </div>
    </div>
  );
}

function format(number: number): string | number {
  if (Math.round(number) === number) {
    return number;
  } else {
    return number.toFixed(1);
  }
}

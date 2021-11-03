/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import useResizeObserver from './useResizeObserver';

import styles from './AutoSizer.css';

type SizeState = {|
  height: number,
  width: number,
|};

type Props = {|
  children: SizeState => React$Element<*>,
|};

// TODO Deprecate
export default function AutoSizer({children}: Props) {
  const {ref, width, height} = useResizeObserver();

  return (
    <div ref={ref} className={styles.AutoSizer}>
      {children({height, width})}
    </div>
  );
}

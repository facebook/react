/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import styles from './NoInteractions.css';

export default function NoInteractions({
  height,
  width,
}: {|
  height: number,
  width: number,
|}) {
  return (
    <div className={styles.NoInteractions} style={{height, width}}>
      <p className={styles.Header}>No interactions were recorded.</p>
      <p>
        <a
          className={styles.Link}
          href="https://reactjs.org/link/interaction-tracing"
          rel="noopener noreferrer"
          target="_blank">
          Learn more about the interaction tracing API here.
        </a>
      </p>
    </div>
  );
}

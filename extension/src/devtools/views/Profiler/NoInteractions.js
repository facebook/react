// @flow

import React from 'react';

import styles from './NoInteractions.css';

export default function NoInteractions({
  height,
  width,
}: {|
  height: number,
  width: number,
|}) {
  return (
    <div className={styles.NoInteractions} style={{ height, width }}>
      <p className={styles.Header}>No interactions were recorded.</p>
      <p>
        <a
          className={styles.Link}
          href="http://fb.me/react-interaction-tracing"
          rel="noopener noreferrer"
          target="_blank"
        >
          Learn more about the interaction tracing API here.
        </a>
      </p>
    </div>
  );
}

// @flow

import React from 'react';
import styles from './Badge.css';

type Props = {|
  children: string | null,
|};

export default function Badge({ children }: Props) {
  if (children === null) {
    return null;
  }

  return <div className={styles.Badge}>{children}</div>;
}

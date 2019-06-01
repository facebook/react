// @flow

import React from 'react';
import styles from './Badge.css';

type Props = {|
  children: string | null,
  className?: string,
|};

export default function Badge({ children, className }: Props) {
  if (children === null) {
    return null;
  }

  return <div className={`${styles.Badge} ${className || ''}`}>{children}</div>;
}

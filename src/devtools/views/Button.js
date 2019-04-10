// @flow

import React from 'react';

import styles from './Button.css';

type Props = {
  className?: string,
  title: string,
};

export default function Button({ className, ...rest }: Props) {
  return <button className={`${styles.Button} ${className || ''}`} {...rest} />;
}

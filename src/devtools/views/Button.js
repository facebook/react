// @flow

import React from 'react';
// TODO (tooltips) import Tooltip from '@reach/tooltip';

import styles from './Button.css';
// TODO (tooltips) import tooltipStyles from './Tooltip.css';

type Props = {
  children: React$Node,
  className?: string,
  title: string,
};

export default function Button({
  children,
  className = '',
  title,
  ...rest
}: Props) {
  let button = (
    <button className={`${styles.Button} ${className}`} title={title} {...rest}>
      <span className={`${styles.ButtonContent} ${className}`} tabIndex={-1}>
        {children}
      </span>
    </button>
  );

  /* TODO (tooltips)
  if (title) {
    button = (
      <Tooltip className={tooltipStyles.Tooltip} label={title}>
        {button}
      </Tooltip>
    );
  }
  */

  return button;
}

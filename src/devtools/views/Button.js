// @flow

import React from 'react';
import Tooltip from '@reach/tooltip';

import styles from './Button.css';
import tooltipStyles from './Tooltip.css';

type Props = {
  className?: string,
  title: string,
};

export default function Button({ className, title, ...rest }: Props) {
  let button = (
    <button className={`${styles.Button} ${className || ''}`} {...rest} />
  );

  if (title) {
    button = (
      <Tooltip className={tooltipStyles.Tooltip} label={title}>
        {button}
      </Tooltip>
    );
  }

  return button;
}

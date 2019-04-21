// @flow

import React, { useCallback } from 'react';
// TODO (tooltips) import Tooltip from '@reach/tooltip';

import styles from './Toggle.css';
// TODO (tooltips) import tooltipStyles from './Tooltip.css';

type Props = {
  children: React$Node,
  className?: string,
  isChecked: boolean,
  isDisabled?: boolean,
  onChange: (isChecked: boolean) => void,
  title?: string,
};

export default function Toggle({
  children,
  className = '',
  isDisabled = false,
  isChecked,
  onChange,
  title,
}: Props) {
  let defaultClassName;
  if (isDisabled) {
    defaultClassName = styles.ToggleDisabled;
  } else if (isChecked) {
    defaultClassName = styles.ToggleOn;
  } else {
    defaultClassName = styles.ToggleOff;
  }

  const handleClick = useCallback(() => onChange(!isChecked), [
    isChecked,
    onChange,
  ]);

  let toggle = (
    <button
      className={`${defaultClassName} ${className}`}
      disabled={isDisabled}
      onClick={handleClick}
      title={title}
    >
      <span className={styles.ToggleContent} tabIndex={-1}>
        {children}
      </span>
    </button>
  );

  /* TODO (tooltips)
  if (title) {
    toggle = (
      <Tooltip className={tooltipStyles.Tooltip} label={title}>
        {toggle}
      </Tooltip>
    );
  }
  */

  return toggle;
}

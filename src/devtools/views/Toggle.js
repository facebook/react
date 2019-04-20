// @flow

import React, { useCallback } from 'react';
import Tooltip from '@reach/tooltip';

import styles from './Toggle.css';
import tooltipStyles from './Tooltip.css';

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

  const handleChange = useCallback(
    ({ target }) => {
      onChange(target.checked);
    },
    [onChange]
  );

  let toggle = (
    <label className={`${defaultClassName} ${className}`}>
      <input
        type="checkbox"
        className={styles.Input}
        checked={isChecked}
        disabled={isDisabled}
        onChange={handleChange}
      />
      {children}
    </label>
  );

  if (title) {
    toggle = (
      <Tooltip className={tooltipStyles.Tooltip} label={title}>
        {toggle}
      </Tooltip>
    );
  }

  return toggle;
}

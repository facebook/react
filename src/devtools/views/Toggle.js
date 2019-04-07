// @flow

import React, { useCallback } from 'react';

import styles from './Toggle.css';

type Props = {
  children: React$Node,
  className?: string,
  isChecked: boolean,
  isDisabled?: boolean,
  onChange: (isChecked: boolean) => void,
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

  return (
    <label className={`${defaultClassName} ${className}`} title={title}>
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
}

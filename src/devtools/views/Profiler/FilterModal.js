// @flow

import React, { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage, useModalDismissSignal } from '../hooks';

import styles from './FilterModal.css';

type Props = {|
  dismissModal: Function,
|};

export default function FilterModal({ dismissModal }: Props) {
  const [isEnabled, setIsEnabled] = useLocalStorage<boolean>(
    'minCommitDurationFilterEnabled',
    false
  );
  const [value, setValue] = useLocalStorage<number>(
    'minCommitDurationFilter',
    0
  );

  const handleNumberChange = useCallback(
    ({ currentTarget }) => {
      const newValue = parseInt(currentTarget.value, 10);
      setValue(Number.isNaN(newValue) || newValue <= 0 ? 0 : newValue);
    },
    [setValue]
  );

  const handleEnabledChange = useCallback(
    ({ currentTarget }) => {
      setIsEnabled(currentTarget.checked);
      if (currentTarget.checked) {
        if (inputRef.current !== null) {
          inputRef.current.focus();
        }
      }
    },
    [setIsEnabled]
  );

  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useModalDismissSignal(modalRef, dismissModal);

  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <div className={styles.Background}>
      <div className={styles.Modal} ref={modalRef}>
        <label>
          <input
            checked={isEnabled}
            onChange={handleEnabledChange}
            type="checkbox"
          />{' '}
          Hide commits below
        </label>{' '}
        <input
          className={styles.Input}
          onChange={handleNumberChange}
          ref={inputRef}
          type="number"
          value={value}
        />{' '}
        (ms)
      </div>
    </div>
  );
}

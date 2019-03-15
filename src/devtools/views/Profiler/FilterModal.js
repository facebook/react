// @flow

import React, { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage, useModalDismissSignal } from '../hooks';

import styles from './FilterModal.css';

type Props = {|
  dismissModal: Function,
|};

export default function FilterModal({ dismissModal }: Props) {
  const [
    isCommitFilterEnabled,
    setIsCommitFilterEnabled,
  ] = useLocalStorage<boolean>('isCommitFilterEnabled', false);
  const [minCommitDuration, setMinCommitDuration] = useLocalStorage<number>(
    'minCommitDuration',
    0
  );

  const handleNumberChange = useCallback(
    ({ currentTarget }) => {
      const newValue = parseInt(currentTarget.value, 10);
      setMinCommitDuration(
        Number.isNaN(newValue) || newValue <= 0 ? 0 : newValue
      );
    },
    [setMinCommitDuration]
  );

  const handleEnabledChange = useCallback(
    ({ currentTarget }) => {
      setIsCommitFilterEnabled(currentTarget.checked);
      if (currentTarget.checked) {
        if (inputRef.current !== null) {
          inputRef.current.focus();
        }
      }
    },
    [setIsCommitFilterEnabled]
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
            checked={isCommitFilterEnabled}
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
          value={minCommitDuration}
        />{' '}
        (ms)
      </div>
    </div>
  );
}

// @flow

import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { CommitFilterModalContext } from './CommitFilterModalContext';
import { ProfilerContext } from './ProfilerContext';
import { useModalDismissSignal } from '../hooks';

import styles from './CommitFilterModal.css';

export default function FilterModal(_: {||}) {
  const { isModalShowing } = useContext(CommitFilterModalContext);

  if (!isModalShowing) {
    return null;
  }

  return <FilterModalImpl />;
}

function FilterModalImpl(_: {||}) {
  const {
    isCommitFilterEnabled,
    minCommitDuration,
    setIsCommitFilterEnabled,
    setMinCommitDuration,
  } = useContext(ProfilerContext);

  const { setIsModalShowing } = useContext(CommitFilterModalContext);
  const dismissModal = useCallback(() => setIsModalShowing(false), [
    setIsModalShowing,
  ]);

  const handleNumberChange = useCallback(
    (event: SyntheticEvent<HTMLInputElement>) => {
      const newValue = parseFloat(event.currentTarget.value);
      setMinCommitDuration(
        Number.isNaN(newValue) || newValue <= 0 ? 0 : newValue
      );
    },
    [setMinCommitDuration]
  );

  const handleEnabledChange = useCallback(
    (event: SyntheticEvent<HTMLInputElement>) => {
      const checked = event.currentTarget.checked;
      setIsCommitFilterEnabled(checked);
      if (checked) {
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

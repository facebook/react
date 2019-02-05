// @flow

import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { SearchContext } from './SearchContext';
import ButtonIcon from './ButtonIcon';

import styles from './SearchInput.css';

type Props = {||};

export default function SearchInput(props: Props) {
  const {
    currentIndex,
    ids,
    updateCurrentIndex,
    updateText,
    text,
  } = useContext(SearchContext);

  const inputRef = useRef();

  const handleTextChange = useCallback(({ currentTarget }) => {
    updateText(currentTarget.value);
  });

  const selectNext = useCallback(() => {
    if (currentIndex !== null) {
      updateCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex]);

  const selectPrevious = useCallback(() => {
    if (currentIndex !== null) {
      updateCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const resetSearch = useCallback(() => {
    updateText('');
  }, [updateText]);

  const handleInputKeyPress = useCallback(
    ({ key }) => {
      if (key === 'Enter') {
        if (currentIndex !== null) {
          if (currentIndex + 1 < ids.length) {
            updateCurrentIndex(currentIndex + 1);
          } else {
            updateCurrentIndex(0);
          }
        }
      }
    },
    [currentIndex, ids]
  );

  // Auto-focus search input
  useEffect(() => {
    const handleWindowKeyDown = event => {
      const { key, metaKey } = event;
      if (key === 'f' && metaKey) {
        if (inputRef.current !== null) {
          inputRef.current.focus();
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);

    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [inputRef]);

  return (
    <div className={styles.SearchInput}>
      <input
        className={styles.Input}
        onKeyPress={handleInputKeyPress}
        onChange={handleTextChange}
        placeholder="Search (text or /regex/)"
        ref={inputRef}
        value={text}
      />
      {!!text && (
        <span className={styles.IndexLabel}>
          {Math.min(currentIndex + 1, ids.length)} | {ids.length}
        </span>
      )}
      <div className={styles.LeftVRule} />
      <button
        className={styles.IconButton}
        disabled={currentIndex === null || currentIndex === 0}
        onClick={selectPrevious}
        title="Scroll to previous search result"
      >
        <ButtonIcon type="up" />
      </button>
      <button
        className={styles.IconButton}
        disabled={currentIndex === null || currentIndex === ids.length - 1}
        onClick={selectNext}
        title="Scroll to next search result"
      >
        <ButtonIcon type="down" />
      </button>
      <button
        className={styles.IconButton}
        disabled={!text}
        onClick={resetSearch}
        title="Reset search"
      >
        <ButtonIcon type="close" />
      </button>
      <div className={styles.RightVRule} />
    </div>
  );
}

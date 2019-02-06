// @flow

import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { SearchContext } from './SearchContext';
import ButtonIcon from './ButtonIcon';

import styles from './SearchInput.css';

type Props = {||};

export default function SearchInput(props: Props) {
  const searchContext = useContext(SearchContext);

  const inputRef = useRef();

  const handleTextChange = useCallback(({ currentTarget }) => {
    searchContext.updateText(currentTarget.value);
  });

  const selectNext = useCallback(() => {
    const { currentIndex } = searchContext;
    if (currentIndex !== null) {
      searchContext.updateCurrentIndex(currentIndex + 1);
    }
  }, [searchContext]);

  const selectPrevious = useCallback(() => {
    const { currentIndex } = searchContext;
    if (currentIndex !== null) {
      searchContext.updateCurrentIndex(currentIndex - 1);
    }
  }, [searchContext]);

  const resetSearch = useCallback(() => {
    searchContext.updateText('');
  }, [searchContext]);

  const handleInputKeyPress = useCallback(
    ({ key }) => {
      if (key === 'Enter') {
        const { currentIndex, ids } = searchContext;
        if (currentIndex !== null) {
          if (currentIndex + 1 < ids.length) {
            searchContext.updateCurrentIndex(currentIndex + 1);
          } else {
            searchContext.updateCurrentIndex(0);
          }
        }
      }
    },
    [searchContext]
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

  const { currentIndex, ids, text } = searchContext;

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

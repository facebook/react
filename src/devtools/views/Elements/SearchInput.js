// @flow

import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { TreeContext } from './TreeContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Icon from '../Icon';

import styles from './SearchInput.css';

type Props = {||};

export default function SearchInput(props: Props) {
  const {
    goToNextSearchResult,
    goToPreviousSearchResult,
    searchIndex,
    searchResults,
    searchText,
    setSearchText,
  } = useContext(TreeContext);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleTextChange = useCallback(
    ({ currentTarget }) => setSearchText(currentTarget.value),
    [setSearchText]
  );

  const resetSearch = useCallback(() => {
    setSearchText('');
  }, [setSearchText]);

  const handleKeyDown = useCallback(event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      // It's convenient for up/down arrow keys to change the selected element when focused on the search input.
      // But e.g. left/right arrow keys should move the text cursor.
      // For now just block everything except for up/down arrow keys.
      // TODO Revisit this approach.
      event.stopPropagation();
    }
  }, []);

  const handleInputKeyPress = useCallback(
    ({ key }) => {
      if (key === 'Enter') {
        goToNextSearchResult();
      }
    },
    [goToNextSearchResult]
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
      <Icon className={styles.InputIcon} type="search" />
      <input
        className={styles.Input}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onKeyPress={handleInputKeyPress}
        placeholder="Search (text or /regex/)"
        ref={inputRef}
        value={searchText}
      />
      {!!searchText && (
        <span className={styles.IndexLabel}>
          {Math.min(searchIndex + 1, searchResults.length)} |{' '}
          {searchResults.length}
        </span>
      )}
      <div className={styles.LeftVRule} />
      <Button
        className={styles.IconButton}
        disabled={!searchText}
        onClick={goToPreviousSearchResult}
        title="Scroll to previous search result"
      >
        <ButtonIcon type="up" />
      </Button>
      <Button
        className={styles.IconButton}
        disabled={!searchText}
        onClick={goToNextSearchResult}
        title="Scroll to next search result"
      >
        <ButtonIcon type="down" />
      </Button>
      <Button
        className={styles.IconButton}
        disabled={!searchText}
        onClick={resetSearch}
        title="Reset search"
      >
        <ButtonIcon type="close" />
      </Button>
      <div className={styles.RightVRule} />
    </div>
  );
}

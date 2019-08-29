/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useCallback, useContext, useEffect, useRef} from 'react';
import {TreeDispatcherContext, TreeStateContext} from './TreeContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Icon from '../Icon';

import styles from './SearchInput.css';

type Props = {||};

export default function SearchInput(props: Props) {
  const {searchIndex, searchResults, searchText} = useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatcherContext);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleTextChange = useCallback(
    ({currentTarget}) =>
      dispatch({type: 'SET_SEARCH_TEXT', payload: currentTarget.value}),
    [dispatch],
  );
  const resetSearch = useCallback(
    () => dispatch({type: 'SET_SEARCH_TEXT', payload: ''}),
    [dispatch],
  );

  const handleKeyDown = useCallback(
    event => {
      // For convenience, let up/down arrow keys change Tree selection.
      switch (event.key) {
        case 'ArrowDown':
          dispatch({type: 'SELECT_NEXT_ELEMENT_IN_TREE'});
          event.preventDefault();
          break;
        case 'ArrowUp':
          dispatch({type: 'SELECT_PREVIOUS_ELEMENT_IN_TREE'});
          event.preventDefault();
          break;
        default:
          break;
      }
    },
    [dispatch],
  );

  const handleInputKeyPress = useCallback(
    ({key}) => {
      if (key === 'Enter') {
        dispatch({type: 'GO_TO_NEXT_SEARCH_RESULT'});
      }
    },
    [dispatch],
  );

  // Auto-focus search input
  useEffect(
    () => {
      if (inputRef.current === null) {
        return () => {};
      }

      const handleWindowKey = (event: KeyboardEvent) => {
        const {key, metaKey} = event;
        if (key === 'f' && metaKey) {
          if (inputRef.current !== null) {
            inputRef.current.focus();
            event.preventDefault();
            event.stopPropagation();
          }
        }
      };

      // It's important to listen to the ownerDocument to support the browser extension.
      // Here we use portals to render individual tabs (e.g. Profiler),
      // and the root document might belong to a different window.
      const ownerDocument = inputRef.current.ownerDocument;
      ownerDocument.addEventListener('keydown', handleWindowKey);

      return () =>
        ownerDocument.removeEventListener('keydown', handleWindowKey);
    },
    [inputRef],
  );

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
        onClick={() => dispatch({type: 'GO_TO_PREVIOUS_SEARCH_RESULT'})}
        title="Scroll to previous search result">
        <ButtonIcon type="up" />
      </Button>
      <Button
        className={styles.IconButton}
        disabled={!searchText}
        onClick={() => dispatch({type: 'GO_TO_NEXT_SEARCH_RESULT'})}
        title="Scroll to next search result">
        <ButtonIcon type="down" />
      </Button>
      <Button
        className={styles.IconButton}
        disabled={!searchText}
        onClick={resetSearch}
        title="Reset search">
        <ButtonIcon type="close" />
      </Button>
    </div>
  );
}

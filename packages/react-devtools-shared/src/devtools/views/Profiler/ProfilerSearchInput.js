/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useState, useContext, useCallback, useEffect} from 'react';

import SearchInput from 'react-devtools-shared/src/devtools/views/SearchInput';
import {ProfilerContext} from './ProfilerContext';

export default function ProfilerSearchInput(): React.Node {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const {
    searchIndex,
    searchResults,
    searchText,
    setSearchText,
    goToNextSearchResult,
    goToPreviousSearchResult,
  } = useContext(ProfilerContext);

  // Sync local state with context when search is cleared externally (e.g., commit change)
  useEffect(() => {
    if (searchText === '' && localSearchQuery !== '') {
      setLocalSearchQuery('');
    }
  }, [searchText, localSearchQuery]);

  const search = useCallback(
    (text: string) => {
      setLocalSearchQuery(text);
      setSearchText(text);
    },
    [setLocalSearchQuery, setSearchText],
  );
  const goToNextResult = useCallback(
    () => goToNextSearchResult(),
    [goToNextSearchResult],
  );
  const goToPreviousResult = useCallback(
    () => goToPreviousSearchResult(),
    [goToPreviousSearchResult],
  );

  return (
    <SearchInput
      goToNextResult={goToNextResult}
      goToPreviousResult={goToPreviousResult}
      placeholder="Search components (text or /regex/)"
      search={search}
      searchIndex={searchIndex !== null ? searchIndex : 0}
      searchResultsCount={searchResults.length}
      searchText={localSearchQuery}
      testName="ProfilerSearchInput"
    />
  );
}


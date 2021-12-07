/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import {createPortal} from 'react-dom';
import SearchInput from 'react-devtools-shared/src/devtools/views/SearchInput';
import {TimelineContext} from './TimelineContext';
import {TimelineSearchContext} from './TimelineSearchContext';

type Props = {||};

export default function TimelineSearchInput(props: Props) {
  const {searchInputContainerRef} = useContext(TimelineContext);
  const {dispatch, searchIndex, searchResults, searchText} = useContext(
    TimelineSearchContext,
  );

  if (searchInputContainerRef.current === null) {
    return null;
  }

  const search = text => dispatch({type: 'SET_SEARCH_TEXT', payload: text});
  const goToNextResult = () => dispatch({type: 'GO_TO_NEXT_SEARCH_RESULT'});
  const goToPreviousResult = () =>
    dispatch({type: 'GO_TO_PREVIOUS_SEARCH_RESULT'});

  return createPortal(
    <SearchInput
      goToNextResult={goToNextResult}
      goToPreviousResult={goToPreviousResult}
      placeholder="Search components by name"
      search={search}
      searchIndex={searchIndex}
      searchResultsCount={searchResults.length}
      searchText={searchText}
    />,
    searchInputContainerRef.current,
  );
}

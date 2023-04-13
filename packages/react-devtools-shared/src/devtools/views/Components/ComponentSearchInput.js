/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import {TreeDispatcherContext, TreeStateContext} from './TreeContext';

import SearchInput from '../SearchInput';

type Props = {};

export default function ComponentSearchInput(props: Props): React.Node {
  const {searchIndex, searchResults, searchText} = useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatcherContext);

  const search = (text: string) =>
    dispatch({type: 'SET_SEARCH_TEXT', payload: text});
  const goToNextResult = () => dispatch({type: 'GO_TO_NEXT_SEARCH_RESULT'});
  const goToPreviousResult = () =>
    dispatch({type: 'GO_TO_PREVIOUS_SEARCH_RESULT'});

  return (
    <SearchInput
      goToNextResult={goToNextResult}
      goToPreviousResult={goToPreviousResult}
      placeholder="Search (text or /regex/)"
      search={search}
      searchIndex={searchIndex}
      searchResultsCount={searchResults.length}
      searchText={searchText}
      testName="ComponentSearchInput"
    />
  );
}

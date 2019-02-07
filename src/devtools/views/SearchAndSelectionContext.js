// @flow

// This context contains both the current search state and the selected element.
// These values are combined into a single context because changes in one often impact the other.
// Combining them enables us to avoid cascading renders.

import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
} from 'react';
import { createRegExp } from './utils';
import { StoreContext } from './context';
import Store from '../store';

import type { Element } from 'src/devtools/types';

type Context = {|
  // Read current context values:
  searchIndex: number | null,
  searchResults: Array<number>,
  searchText: string,
  selectedElementID: number | null,
  selectedElementIndex: number | null,

  // Update current context values:
  decrementSearchIndex(): void,
  incrementSearchIndex(): void,
  selectElementWithID(id: number | null): void,
  selectElementAtIndex(index: number | null): void,
  updateSearchText(searchText: string): void,
|};

const SearchAndSelectionContext = createContext<Context>(
  ((null: any): Context)
);
// $FlowFixMe displayName is a valid attribute of React$ConsearchText
SearchAndSelectionContext.displayName = 'SearchAndSelectionContext';

type State = {|
  searchIndex: number | null,
  searchResults: Array<number>,
  searchText: string,
  selectedElementID: number | null,
  selectedElementIndex: number | null,
|};

type Action = {|
  type:
    | 'DECREMENT_SEARCH_INDEX'
    | 'INCREMENT_SEARCH_INDEX'
    | 'REFINE_SEARCH_RESULTS'
    | 'SELECT_ELEMENT_WITH_ID'
    | 'SELECT_ELEMENT_AT_INDEX'
    | 'UPDATE_SEARCH_TEXT',
  payload?: any,
|};

type Props = {|
  children: React$Node,
|};

// TODO Remove this wrapper element once global ConsearchText.write API exists.
function SearchAndSelectionController({ children }: Props) {
  const store = useContext(StoreContext);

  // This reducer is created inline because it needs access to the Store.
  // The store is mutable, but the Store itself is global and lives for the lifetime of the DevTools,
  // so it's okay for the reducer to have an empty dependencies array.
  const reducer = useMemo(
    () =>
      function reducer(state: State, action: Action): State {
        const { searchIndex, searchResults, searchText } = state;
        const { payload, type } = action;

        let newSearchIndex,
          newSearchResults,
          newSearchText,
          newSelectedElementID;

        switch (type) {
          case 'DECREMENT_SEARCH_INDEX':
            if (searchResults.length === 0) return state;

            newSearchIndex =
              ((searchIndex: any): number) > 0
                ? ((searchIndex: any): number) - 1
                : searchResults.length - 1;
            newSelectedElementID = searchResults[newSearchIndex];

            return {
              ...state,
              searchIndex: newSearchIndex,
              selectedElementID: newSelectedElementID,
              selectedElementIndex: store.getIndexOfElementID(
                newSelectedElementID
              ),
            };

          case 'INCREMENT_SEARCH_INDEX':
            if (searchResults.length === 0) return state;

            newSearchIndex =
              ((searchIndex: any): number) + 1 < searchResults.length
                ? ((searchIndex: any): number) + 1
                : 0;
            newSelectedElementID = searchResults[newSearchIndex];

            return {
              ...state,
              searchIndex: newSearchIndex,
              selectedElementID: newSelectedElementID,
              selectedElementIndex: store.getIndexOfElementID(
                newSelectedElementID
              ),
            };

          case 'REFINE_SEARCH_RESULTS':
            const [
              addedElementIDs,
              removedElementIDs,
            ] = ((payload: any): Array<Uint32Array>);

            newSearchResults = searchResults;
            newSearchIndex = searchIndex;

            removedElementIDs.forEach(id => {
              // Prune this item from the search results.
              const index = newSearchResults.indexOf(id);
              if (index >= 0) {
                newSearchResults = newSearchResults
                  .slice(0, index)
                  .concat(newSearchResults.slice(index + 1));

                // If the results are now empty, also deselect things.
                if (newSearchResults.length === 0) {
                  newSearchIndex = null;
                } else if (
                  ((newSearchIndex: any): number) >= newSearchResults.length
                ) {
                  newSearchIndex = newSearchResults.length - 1;
                }
              }
            });

            addedElementIDs.forEach(id => {
              const { displayName } = ((store.getElementByID(
                id
              ): any): Element);

              // Add this item to the search results if it matches.
              const regExp = createRegExp(searchText);
              if (displayName !== null && regExp.test(displayName)) {
                const newElementIndex = ((store.getIndexOfElementID(
                  id
                ): any): number);

                let foundMatch = false;
                for (let index = 0; index < newSearchResults.length; index++) {
                  const id = newSearchResults[index];
                  if (
                    newElementIndex <
                    ((store.getIndexOfElementID(id): any): number)
                  ) {
                    foundMatch = true;
                    newSearchResults = newSearchResults
                      .slice(0, index)
                      .concat(id)
                      .concat(newSearchResults.slice(index));
                    break;
                  }
                }
                if (!foundMatch) {
                  newSearchResults = newSearchResults.concat(id);
                }

                newSearchIndex = newSearchIndex === null ? 0 : newSearchIndex;
              }
            });

            newSelectedElementID =
              newSearchIndex !== null ? newSearchResults[newSearchIndex] : null;

            return {
              ...state,
              searchIndex: newSearchIndex,
              searchResults: newSearchResults,
              selectedElementID: newSelectedElementID,
              selectedElementIndex:
                newSelectedElementID !== null
                  ? store.getIndexOfElementID(newSelectedElementID)
                  : null,
            };

          case 'SELECT_ELEMENT_WITH_ID':
            newSelectedElementID = ((payload: any): number | null);

            return {
              ...state,
              selectedElementID: newSelectedElementID,
              selectedElementIndex:
                newSelectedElementID !== null
                  ? store.getIndexOfElementID(newSelectedElementID)
                  : null,
            };

          case 'SELECT_ELEMENT_AT_INDEX':
            newSearchIndex = ((payload: any): number | null);

            const element =
              newSearchIndex !== null
                ? store.getElementAtIndex(newSearchIndex)
                : null;

            return {
              ...state,
              selectedElementID: element !== null ? element.id : null,
              selectedElementIndex: newSearchIndex,
            };

          case 'UPDATE_SEARCH_TEXT':
            newSearchIndex = searchIndex;
            newSearchResults = [];
            newSearchText = ((payload: any): string);

            // Find all matching elements.
            if (newSearchText !== '') {
              const regExp = createRegExp(newSearchText);
              store.roots.forEach(rootID => {
                recursivelySearchTree(store, rootID, regExp, newSearchResults);
              });

              // If this is a refinement of a previous search, preserve the current index (unless it's no longer valid).
              // If it's a new search, reset the index.
              if (newSearchResults.length === 0) {
                newSearchIndex = null;
              } else if (
                searchIndex !== null &&
                newSearchText.startsWith(searchText)
              ) {
                newSearchIndex = Math.min(
                  searchIndex,
                  newSearchResults.length - 1
                );
              } else {
                newSearchIndex = 0;
              }
            } else {
              newSearchIndex = null;
            }

            newSelectedElementID =
              newSearchIndex !== null ? newSearchResults[newSearchIndex] : null;

            return {
              ...state,
              searchIndex: newSearchIndex,
              searchResults: newSearchResults,
              searchText: newSearchText,
              selectedElementID: newSelectedElementID,
              selectedElementIndex:
                newSelectedElementID !== null
                  ? store.getIndexOfElementID(newSelectedElementID)
                  : null,
            };

          default:
            throw new Error(`Unrecognized action "${type}"`);
        }
      },
    []
  );

  const [state, dispatch] = useReducer(reducer, {
    searchIndex: null,
    searchResults: [],
    searchText: '',
    selectedElementID: null,
    selectedElementIndex: null,
  });

  const decrementSearchIndex = useCallback(
    () => dispatch({ type: 'DECREMENT_SEARCH_INDEX' }),
    [dispatch]
  );
  const incrementSearchIndex = useCallback(
    () => dispatch({ type: 'INCREMENT_SEARCH_INDEX' }),
    [dispatch]
  );
  const selectElementWithID = useCallback(
    (id: number | null) =>
      dispatch({ type: 'SELECT_ELEMENT_WITH_ID', payload: id }),
    [dispatch]
  );
  const selectElementAtIndex = useCallback(
    (index: number | null) =>
      dispatch({ type: 'SELECT_ELEMENT_AT_INDEX', payload: index }),
    [dispatch]
  );
  const updateSearchText = useCallback(
    (searchText: string) =>
      dispatch({ type: 'UPDATE_SEARCH_TEXT', payload: searchText }),
    [dispatch]
  );

  const value = useMemo(
    () => ({
      searchIndex: state.searchIndex,
      searchResults: state.searchResults,
      searchText: state.searchText,
      selectedElementID: state.selectedElementID,
      selectedElementIndex: state.selectedElementIndex,

      decrementSearchIndex,
      incrementSearchIndex,
      selectElementWithID,
      selectElementAtIndex,
      updateSearchText,
    }),
    [state]
  );

  // Listen for changes to the tree and incrementally adjust the search results.
  useLayoutEffect(() => {
    const handleStoreMutated = ([
      addedElementIDs,
      removedElementIDs,
    ]: Array<Uint32Array>) => {
      if (!state.searchText) {
        return;
      }

      dispatch({
        type: 'REFINE_SEARCH_RESULTS',
        payload: [addedElementIDs, removedElementIDs],
      });
    };

    store.addListener('mutated', handleStoreMutated);

    return () => store.removeListener('mutated', handleStoreMutated);
  }, [state, store]);

  return (
    <SearchAndSelectionContext.Provider value={value}>
      {children}
    </SearchAndSelectionContext.Provider>
  );
}

function recursivelySearchTree(
  store: Store,
  elementID: number,
  regExp: RegExp,
  searchResults: Array<number>
): void {
  const { children, displayName } = ((store.getElementByID(
    elementID
  ): any): Element);
  if (displayName !== null) {
    if (regExp.test(displayName)) {
      searchResults.push(elementID);
    }
  }
  children.forEach(childID =>
    recursivelySearchTree(store, childID, regExp, searchResults)
  );
}

export { SearchAndSelectionContext, SearchAndSelectionController };

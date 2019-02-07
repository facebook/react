// @flow

// This context contains both the search, owners stack, and selected element states.
// These values are combined into a single context because changes in one often impact the others.
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
  // Read current context values
  ownerIDStack: Array<number>,
  ownerList: Array<number> | null,
  searchIndex: number | null,
  searchResults: Array<number>,
  searchText: string,
  selectedElementID: number | null,
  selectedElementIndex: number | null,

  // Update current context values:
  clearOwnerList: () => void,
  decrementSearchIndex(): void,
  incrementSearchIndex(): void,
  popToOwnerList(elementID: number): void,
  pushOwnerList(elementID: number): void,
  selectElementWithID(id: number | null): void,
  selectNextElementInTree(): void,
  selectPreviousElementInTree(): void,
  updateSearchText(searchText: string): void,
|};

const SearchAndSelectionContext = createContext<Context>(
  ((null: any): Context)
);
// $FlowFixMe displayName is a valid attribute of React$ConsearchText
SearchAndSelectionContext.displayName = 'SearchAndSelectionContext';

type State = {|
  ownerIDStack: Array<number>,
  ownerList: Array<number> | null,
  searchIndex: number | null,
  searchResults: Array<number>,
  searchText: string,
  selectedElementID: number | null,
  selectedElementIndex: number | null,
|};

type Action = {|
  type:
    | 'CLEAR_OWNER_LIST'
    | 'DECREMENT_SEARCH_INDEX'
    | 'INCREMENT_SEARCH_INDEX'
    | 'POP_TO_OWNER_LIST'
    | 'PUSH_OWNER_LIST'
    | 'REFINE_AFTER_MUTATION'
    | 'SELECT_ELEMENT_WITH_ID'
    | 'SELECT_NEXT_ELEMENT_IN_TREE'
    | 'SELECT_PREVIOUS_ELEMENT_IN_TREE'
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
        const {
          ownerIDStack,
          ownerList,
          searchIndex,
          searchResults,
          searchText,
          selectedElementID,
          selectedElementIndex,
        } = state;
        const { payload, type } = action;

        let element,
          elementID,
          newOwnerList,
          newOwnerIDStack,
          newSearchIndex,
          newSearchResults,
          newSearchText,
          newSelectedElementID,
          newSelectedElementIndex;

        const updateSelectedElementIndexHelper = (
          newSelectedElementIndex: number
        ) => {
          if (ownerList !== null) {
            newSelectedElementID =
              newSelectedElementIndex !== null
                ? ownerList[newSelectedElementIndex]
                : null;

            return {
              ...state,
              selectedElementID: newSelectedElementID,
              selectedElementIndex: newSelectedElementIndex,
            };
          } else {
            element =
              newSelectedElementIndex !== null
                ? store.getElementAtIndex(newSelectedElementIndex)
                : null;

            return {
              ...state,
              selectedElementID: element !== null ? element.id : null,
              selectedElementIndex: newSelectedElementIndex,
            };
          }
        };

        switch (type) {
          case 'CLEAR_OWNER_LIST':
            return {
              ...state,
              ownerList: null,
              ownerIDStack: [],
            };

          case 'DECREMENT_SEARCH_INDEX':
            if (ownerList !== null) {
              throw Error(
                `Can't update search index while owner list is active`
              );
            }

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
            if (ownerList !== null) {
              throw Error(
                `Can't update search index while owner list is active`
              );
            }

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

          case 'POP_TO_OWNER_LIST':
            elementID = ((payload: any): number);
            return {
              ...state,
              ownerList: calculateCurrentOwnerList(
                store,
                elementID,
                elementID,
                []
              ),
              ownerIDStack: ownerIDStack.slice(
                0,
                ownerIDStack.indexOf(elementID) + 1
              ),
              selectedElementIndex: null,
              selectedElementID: null,
            };

          case 'PUSH_OWNER_LIST':
            elementID = ((payload: any): number);
            if (ownerIDStack.includes(elementID)) return state;

            // Add this new owner, and fill in the owners above it as well.
            const ownerIDsToConcat = [];
            let currentOwnerID = elementID;
            while (
              currentOwnerID !== 0 &&
              ownerIDStack[ownerIDStack.length - 1] !== currentOwnerID
            ) {
              ownerIDsToConcat.unshift(currentOwnerID);
              currentOwnerID = ((store.getElementByID(
                currentOwnerID
              ): any): Element).ownerID;
            }

            return {
              ...state,
              ownerList: calculateCurrentOwnerList(
                store,
                elementID,
                elementID,
                []
              ),
              ownerIDStack: ownerIDStack.concat(ownerIDsToConcat),
              selectedElementIndex: null,
              selectedElementID: null,
              searchIndex: null,
              searchResults: [],
              searchText: '',
            };

          case 'REFINE_AFTER_MUTATION':
            const [
              addedElementIDs,
              removedElementIDs,
            ] = ((payload: any): Array<Uint32Array>);

            newOwnerList = ownerList;
            newOwnerIDStack = ownerIDStack;
            newSearchIndex = searchIndex;
            newSearchResults = searchResults;
            newSearchText = searchText;
            newSelectedElementID = selectedElementID;
            newSelectedElementIndex = selectedElementIndex;

            if (searchText !== '') {
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
                  for (
                    let index = 0;
                    index < newSearchResults.length;
                    index++
                  ) {
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
                newSearchIndex !== null
                  ? newSearchResults[newSearchIndex]
                  : null;
              newSelectedElementIndex =
                newSelectedElementID !== null
                  ? store.getIndexOfElementID(newSelectedElementID)
                  : null;
            }

            // If an item in the owner stack has been removed from the tree, unwind it.
            if (ownerIDStack.length > 0) {
              let indexOfRemovedItem = -1;
              for (let i = 0; i < ownerIDStack.length; i++) {
                if (removedElementIDs.includes(ownerIDStack[i])) {
                  indexOfRemovedItem = i;
                  break;
                }
              }

              if (indexOfRemovedItem >= 0) {
                newOwnerIDStack = ownerIDStack.slice(0, indexOfRemovedItem);
              }

              if (newOwnerIDStack.length === 0) {
                newOwnerList = null;
              } else {
                elementID = newOwnerIDStack[newOwnerIDStack.length - 1];

                newOwnerList = calculateCurrentOwnerList(
                  store,
                  elementID,
                  elementID,
                  []
                );

                newSelectedElementIndex =
                  newSelectedElementID !== null
                    ? newOwnerList.indexOf(newSelectedElementID)
                    : null;
              }
            }

            return {
              ...state,
              ownerIDStack: newOwnerIDStack,
              ownerList: newOwnerList,
              searchIndex: newSearchIndex,
              searchResults: newSearchResults,
              selectedElementID: newSelectedElementID,
              selectedElementIndex: newSelectedElementIndex,
            };

          case 'SELECT_ELEMENT_WITH_ID':
            newSelectedElementID = ((payload: any): number | null);
            newSelectedElementIndex = null;

            if (newSelectedElementID !== null) {
              if (ownerList !== null) {
                newSelectedElementIndex = ownerList.indexOf(
                  newSelectedElementID
                );
              } else {
                newSelectedElementIndex = store.getIndexOfElementID(
                  newSelectedElementID
                );
              }
            }

            const isInOwnerList =
              newSelectedElementID !== null &&
              ownerList !== null &&
              ownerList.includes(newSelectedElementID);

            return {
              ...state,
              ownerIDStack: isInOwnerList ? ownerIDStack : [],
              ownerList: isInOwnerList ? ownerList : null,
              selectedElementID: newSelectedElementID,
              selectedElementIndex: newSelectedElementIndex,
            };

          case 'SELECT_NEXT_ELEMENT_IN_TREE':
            if (selectedElementIndex === null) {
              return state;
            } else if (ownerList !== null) {
              return updateSelectedElementIndexHelper(
                selectedElementIndex + 1 < ownerList.length
                  ? selectedElementIndex + 1
                  : selectedElementIndex
              );
            } else {
              return updateSelectedElementIndexHelper(
                selectedElementIndex + 1 < store.numElements
                  ? selectedElementIndex + 1
                  : selectedElementIndex
              );
            }

          case 'SELECT_PREVIOUS_ELEMENT_IN_TREE':
            if (selectedElementIndex === null) {
              return state;
            } else if (ownerList !== null) {
              return updateSelectedElementIndexHelper(
                selectedElementIndex > 0
                  ? selectedElementIndex - 1
                  : selectedElementIndex
              );
            } else {
              return updateSelectedElementIndexHelper(
                selectedElementIndex > 0
                  ? selectedElementIndex - 1
                  : selectedElementIndex
              );
            }

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
    ownerIDStack: [],
    ownerList: null,
    searchIndex: null,
    searchResults: [],
    searchText: '',
    selectedElementID: null,
    selectedElementIndex: null,
  });

  const clearOwnerList = useCallback(
    () => dispatch({ type: 'CLEAR_OWNER_LIST' }),
    [dispatch]
  );
  const decrementSearchIndex = useCallback(
    () => dispatch({ type: 'DECREMENT_SEARCH_INDEX' }),
    [dispatch]
  );
  const incrementSearchIndex = useCallback(
    () => dispatch({ type: 'INCREMENT_SEARCH_INDEX' }),
    [dispatch]
  );
  const popToOwnerList = useCallback(
    (elementID: number) =>
      dispatch({ type: 'POP_TO_OWNER_LIST', payload: elementID }),
    [dispatch]
  );
  const pushOwnerList = useCallback(
    (elementID: number) =>
      dispatch({ type: 'PUSH_OWNER_LIST', payload: elementID }),
    [dispatch]
  );
  const selectElementWithID = useCallback(
    (id: number | null) =>
      dispatch({ type: 'SELECT_ELEMENT_WITH_ID', payload: id }),
    [dispatch]
  );
  const selectNextElementInTree = useCallback(
    () => dispatch({ type: 'SELECT_NEXT_ELEMENT_IN_TREE' }),
    [dispatch]
  );
  const selectPreviousElementInTree = useCallback(
    () => dispatch({ type: 'SELECT_PREVIOUS_ELEMENT_IN_TREE' }),
    [dispatch]
  );
  const updateSearchText = useCallback(
    (searchText: string) =>
      dispatch({ type: 'UPDATE_SEARCH_TEXT', payload: searchText }),
    [dispatch]
  );

  const value = useMemo(
    () => ({
      ownerList: state.ownerList,
      ownerIDStack: state.ownerIDStack,
      searchIndex: state.searchIndex,
      searchResults: state.searchResults,
      searchText: state.searchText,
      selectedElementID: state.selectedElementID,
      selectedElementIndex: state.selectedElementIndex,

      clearOwnerList,
      decrementSearchIndex,
      incrementSearchIndex,
      popToOwnerList,
      pushOwnerList,
      selectElementWithID,
      selectNextElementInTree,
      selectPreviousElementInTree,
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
      if (!state.searchText && state.ownerList === null) {
        return;
      }

      dispatch({
        type: 'REFINE_AFTER_MUTATION',
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

function calculateCurrentOwnerList(
  store: Store,
  rootOwnerID: number,
  elementID: number,
  ownerList: Array<number>
): Array<number> {
  if (elementID === rootOwnerID) {
    ownerList.push(elementID);
    const { children } = ((store.getElementByID(elementID): any): Element);
    children.forEach(childID =>
      calculateCurrentOwnerList(store, rootOwnerID, childID, ownerList)
    );
  } else {
    const { children, ownerID } = ((store.getElementByID(
      elementID
    ): any): Element);
    if (ownerID === rootOwnerID) {
      ownerList.push(elementID);
      children.forEach(childID =>
        calculateCurrentOwnerList(store, rootOwnerID, childID, ownerList)
      );
    }
  }

  return ownerList;
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

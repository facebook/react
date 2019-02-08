// @flow

// This context combines tree/selection state, search, and the owners stack.
// These values are managed together because changes in one often impact the others.
// Combining them enables us to avoid cascading renders.
//
// Changes to search state may impact tree state.
// For example, updating the selected search result also updates the tree's selected value.
// Search does not fundamanetally change the tree though.
// It is also possible to update the selected tree value independently.
//
// Changes to owners state mask search and tree values.
// When owners statck is not empty, search is temporarily disabnled,
// and tree values (e.g. num elements, selected element) are masked.
// Both tree and search values are restored when the owners stack is cleared.
//
// For this reason, changes to the tree context are processed in sequence: tree -> search -> owners
// This enables each section to potentially override (or mask) previous values.

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
  // Tree
  baseDepth: number,
  numElements: number,
  selectedElementID: number | null,
  selectedElementIndex: number | null,
  getElementAtIndex(index: number): Element | null,
  selectElementAtIndex(index: number): void,
  selectElementByID(id: number | null): void,
  selectNextElementInTree(): void,
  selectPreviousElementInTree(): void,

  // Search
  searchIndex: number | null,
  searchResults: Array<number>,
  searchText: string,
  setSearchText(text: string): void,
  goToNextSearchResult(): void,
  goToPreviousSearchResult(): void,

  // Owners
  ownerStack: Array<number>,
  ownerStackIndex: number | null,
  resetOwnerStack(): void,
  selectOwner(id: number): void,
|};

const TreeContext = createContext<Context>(((null: any): Context));
// $FlowFixMe displayName is a valid attribute of React$ConsearchText
TreeContext.displayName = 'TreeContext';

type State = {|
  // Tree
  baseDepth: number,
  numElements: number,
  selectedElementID: number | null,
  selectedElementIndex: number | null,

  // Search
  searchIndex: number | null,
  searchResults: Array<number>,
  searchText: string,

  // Owners
  ownerStack: Array<number>,
  ownerStackIndex: number | null,
  _ownerFlatTree: Array<number> | null,
|};

type Action = {|
  type:
    | 'GO_TO_NEXT_SEARCH_RESULT'
    | 'GO_TO_PREVIOUS_SEARCH_RESULT'
    | 'HANDLE_STORE_MUTATION'
    | 'RESET_OWNER_STACK'
    | 'SELECT_ELEMENT_AT_INDEX'
    | 'SELECT_ELEMENT_BY_ID'
    | 'SELECT_NEXT_ELEMENT_IN_TREE'
    | 'SELECT_PREVIOUS_ELEMENT_IN_TREE'
    | 'SELECT_OWNER'
    | 'SET_SEARCH_TEXT',
  payload?: any,
|};

function reduceTreeState(store: Store, state: State, action: Action): State {
  const { type, payload } = action;

  let {
    numElements,
    ownerStack,
    selectedElementIndex,
    selectedElementID,
  } = state;

  // Base tree should ignore selected element changes when the owner's tree is active.
  if (ownerStack.length === 0) {
    switch (type) {
      case 'HANDLE_STORE_MUTATION':
        numElements = store.numElements;

        // If the currently-selected Element has been removed from the tree, update selection state.
        if (selectedElementID !== null) {
          const removedElementIDs = ((payload: any): Array<Uint32Array>)[1];
          if (removedElementIDs.includes(((selectedElementID: any): number))) {
            selectedElementIndex = null;
          }
        }
        break;
      case 'SELECT_ELEMENT_AT_INDEX':
        selectedElementIndex = ((payload: any): number | null);
        break;
      case 'SELECT_ELEMENT_BY_ID':
        selectedElementIndex =
          payload === null
            ? null
            : store.getIndexOfElementID(((payload: any): number));
        break;
      case 'SELECT_NEXT_ELEMENT_IN_TREE':
        if (
          selectedElementIndex !== null &&
          selectedElementIndex + 1 < numElements
        ) {
          selectedElementIndex++;
        }
        break;
      case 'SELECT_PREVIOUS_ELEMENT_IN_TREE':
        if (selectedElementIndex !== null && selectedElementIndex > 0) {
          selectedElementIndex--;
        }
        break;
      default:
        // React can bailout of no-op updates.
        return state;
    }
  }

  // Keep selected item ID and index in sync.
  if (selectedElementIndex !== state.selectedElementIndex) {
    if (selectedElementIndex === null) {
      selectedElementID = null;
    } else {
      selectedElementID = store.getElementIDAtIndex(
        ((selectedElementIndex: any): number)
      );
    }
  }

  return {
    ...state,

    numElements,
    selectedElementIndex,
    selectedElementID,
  };
}

function reduceSearchState(store: Store, state: State, action: Action): State {
  const { type, payload } = action;

  let {
    ownerStack,
    searchIndex,
    searchResults,
    searchText,
    selectedElementID,
    selectedElementIndex,
  } = state;

  const prevSearchIndex = searchIndex;
  const numPrevSearchResults = searchResults.length;

  // Search isn't supported when the owner's tree is active.
  if (ownerStack.length === 0) {
    switch (type) {
      case 'GO_TO_NEXT_SEARCH_RESULT':
        if (numPrevSearchResults > 0) {
          searchIndex =
            searchIndex + 1 < numPrevSearchResults ? searchIndex + 1 : 0;
        }
        break;
      case 'GO_TO_PREVIOUS_SEARCH_RESULT':
        if (numPrevSearchResults > 0) {
          searchIndex =
            ((searchIndex: any): number) > 0
              ? ((searchIndex: any): number) - 1
              : numPrevSearchResults - 1;
        }
        break;
      case 'HANDLE_STORE_MUTATION':
        if (searchText !== '') {
          const [
            addedElementIDs,
            removedElementIDs,
          ] = ((payload: any): Array<Uint32Array>);

          removedElementIDs.forEach(id => {
            // Prune this item from the search results.
            const index = searchResults.indexOf(id);
            if (index >= 0) {
              searchResults = searchResults
                .slice(0, index)
                .concat(searchResults.slice(index + 1));

              // If the results are now empty, also deselect things.
              if (searchResults.length === 0) {
                searchIndex = null;
              } else if (((searchIndex: any): number) >= searchResults.length) {
                searchIndex = searchResults.length - 1;
              }
            }
          });

          addedElementIDs.forEach(id => {
            const { displayName } = ((store.getElementByID(id): any): Element);

            // Add this item to the search results if it matches.
            const regExp = createRegExp(searchText);
            if (displayName !== null && regExp.test(displayName)) {
              const newElementIndex = ((store.getIndexOfElementID(
                id
              ): any): number);

              let foundMatch = false;
              for (let index = 0; index < searchResults.length; index++) {
                const id = searchResults[index];
                if (
                  newElementIndex <
                  ((store.getIndexOfElementID(id): any): number)
                ) {
                  foundMatch = true;
                  searchResults = searchResults
                    .slice(0, index)
                    .concat(id)
                    .concat(searchResults.slice(index));
                  break;
                }
              }
              if (!foundMatch) {
                searchResults = searchResults.concat(id);
              }

              searchIndex = searchIndex === null ? 0 : searchIndex;
            }
          });
        }
        break;
      case 'SET_SEARCH_TEXT':
        searchIndex = null;
        searchResults = [];
        searchText = ((payload: any): string);

        if (searchText !== '') {
          const regExp = createRegExp(searchText);
          store.roots.forEach(rootID => {
            recursivelySearchTree(store, rootID, regExp, searchResults);
          });

          if (searchResults.length > 0) {
            if (prevSearchIndex === null) {
              searchIndex = 0;
            } else {
              searchIndex = Math.min(
                ((prevSearchIndex: any): number),
                searchResults.length - 1
              );
            }
          }
        }
        break;
      default:
        // React can bailout of no-op updates.
        return state;
    }
  }

  // Changes in search index should override the selected element.
  if (searchIndex !== prevSearchIndex) {
    if (searchIndex === null) {
      selectedElementIndex = null;
      selectedElementID = null;
    } else {
      selectedElementID = ((searchResults[searchIndex]: any): number);
      selectedElementIndex = store.getIndexOfElementID(
        ((selectedElementID: any): number)
      );
    }
  }

  return {
    ...state,

    selectedElementID,
    selectedElementIndex,

    searchIndex,
    searchResults,
    searchText,
  };
}

function reduceOwnersState(store: Store, state: State, action: Action): State {
  const { payload, type } = action;

  let {
    baseDepth,
    numElements,
    selectedElementID,
    selectedElementIndex,
    ownerStack,
    ownerStackIndex,
    searchIndex,
    searchResults,
    searchText,
    _ownerFlatTree,
  } = state;

  switch (type) {
    case 'HANDLE_STORE_MUTATION':
      if (ownerStack.length > 0) {
        // eslint-disable-next-line no-unused-vars
        const [_, removedElementIDs] = ((payload: any): Array<Uint32Array>);

        let indexOfRemovedItem = -1;
        for (let i = 0; i < ownerStack.length; i++) {
          if (removedElementIDs.includes(ownerStack[i])) {
            indexOfRemovedItem = i;
            break;
          }
        }

        if (indexOfRemovedItem >= 0) {
          ownerStack = ownerStack.slice(0, indexOfRemovedItem);
          if (ownerStack.length === 0) {
            _ownerFlatTree = null;
          } else {
            ownerStackIndex = ownerStack.length - 1;
          }
        }
      }
      break;
    case 'RESET_OWNER_STACK':
      ownerStack = [];
      ownerStackIndex = null;
      _ownerFlatTree = null;
      break;
    case 'SELECT_ELEMENT_AT_INDEX':
      if (_ownerFlatTree !== null) {
        selectedElementIndex = ((payload: any): number | null);
      }
      break;
    case 'SELECT_ELEMENT_BY_ID':
      if (_ownerFlatTree !== null) {
        selectedElementIndex =
          payload === null ? null : _ownerFlatTree.indexOf(payload);
      }
      break;
    case 'SELECT_NEXT_ELEMENT_IN_TREE':
      if (_ownerFlatTree !== null && _ownerFlatTree.length > 0) {
        if (selectedElementIndex === null) {
          selectedElementIndex = 0;
        } else if (selectedElementIndex + 1 < _ownerFlatTree.length) {
          selectedElementIndex++;
        }
      }
      break;
    case 'SELECT_PREVIOUS_ELEMENT_IN_TREE':
      if (_ownerFlatTree !== null && _ownerFlatTree.length > 0) {
        if (selectedElementIndex !== null && selectedElementIndex > 0) {
          selectedElementIndex--;
        }
      }
      break;
    case 'SELECT_OWNER':
      ownerStackIndex = ownerStack.indexOf(payload);

      // If this owner is already in the current stack, just select it.
      // Otherwise, create a new stack.
      if (ownerStackIndex < 0) {
        // Add this new owner, and fill in the owners above it as well.
        ownerStack = [];
        let currentOwnerID = ((payload: any): number);
        while (currentOwnerID !== 0) {
          ownerStack.unshift(currentOwnerID);
          currentOwnerID = ((store.getElementByID(
            currentOwnerID
          ): any): Element).ownerID;
        }
        ownerStackIndex = ownerStack.length - 1;
        selectedElementIndex = 0;

        if (searchText !== '') {
          searchIndex = null;
          searchResults = [];
          searchText = '';
        }
      }
      break;
    default:
      // React can bailout of no-op updates.
      return state;
  }

  // Changes in the selected owner require re-calculating the owners tree.
  if (
    ownerStackIndex !== state.ownerStackIndex ||
    ownerStack !== state.ownerStack ||
    type === 'HANDLE_STORE_MUTATION'
  ) {
    if (ownerStackIndex === null) {
      _ownerFlatTree = null;
      baseDepth = 0;
      numElements = store.numElements;
    } else {
      _ownerFlatTree = calculateCurrentOwnerList(
        store,
        ownerStack[ownerStackIndex],
        ownerStack[ownerStackIndex],
        []
      );

      baseDepth = ((store.getElementByID(_ownerFlatTree[0]): any): Element)
        .depth;
      numElements = _ownerFlatTree.length;
    }
  }

  // Keep selected item ID and index in sync.
  if (selectedElementIndex !== state.selectedElementIndex) {
    if (selectedElementIndex === null) {
      selectedElementID = null;
    } else if (_ownerFlatTree !== null) {
      selectedElementID = _ownerFlatTree[((selectedElementIndex: any): number)];
    }
  }

  return {
    ...state,

    baseDepth,
    numElements,
    selectedElementID,
    selectedElementIndex,

    searchIndex,
    searchResults,
    searchText,

    ownerStack,
    ownerStackIndex,
    _ownerFlatTree,
  };
}

// TODO Remove TreeContextController wrapper element once global ConsearchText.write API exists.
function TreeContextController({ children }: {| children: React$Node |}) {
  const store = useContext(StoreContext);

  // This reducer is created inline because it needs access to the Store.
  // The store is mutable, but the Store itself is global and lives for the lifetime of the DevTools,
  // so it's okay for the reducer to have an empty dependencies array.
  const reducer = useMemo(
    () => (state: State, action: Action): State => {
      const { type } = action;
      switch (type) {
        case 'GO_TO_NEXT_SEARCH_RESULT':
        case 'GO_TO_PREVIOUS_SEARCH_RESULT':
        case 'HANDLE_STORE_MUTATION':
        case 'RESET_OWNER_STACK':
        case 'SELECT_ELEMENT_AT_INDEX':
        case 'SELECT_ELEMENT_BY_ID':
        case 'SELECT_NEXT_ELEMENT_IN_TREE':
        case 'SELECT_PREVIOUS_ELEMENT_IN_TREE':
        case 'SELECT_OWNER':
        case 'SET_SEARCH_TEXT':
          state = reduceTreeState(store, state, action);
          state = reduceSearchState(store, state, action);
          state = reduceOwnersState(store, state, action);
          return state;
        default:
          throw new Error(`Unrecognized action "${type}"`);
      }
    },
    [store]
  );

  const [state, dispatch] = useReducer(reducer, {
    // Tree
    baseDepth: 0,
    numElements: store.numElements,
    selectedElementIndex: null,
    selectedElementID: null,

    // Search
    searchIndex: null,
    searchResults: [],
    searchText: '',

    // Owners
    ownerStack: [],
    ownerStackIndex: null,
    _ownerFlatTree: null,
  });

  const getElementAtIndex = useCallback(
    (index: number) => {
      return state._ownerFlatTree === null
        ? store.getElementAtIndex(index)
        : store.getElementByID(state._ownerFlatTree[index]);
    },
    [state]
  );
  const selectElementAtIndex = useCallback(
    (index: number) =>
      dispatch({ type: 'SELECT_ELEMENT_AT_INDEX', payload: index }),
    [dispatch]
  );
  const selectElementByID = useCallback(
    (id: number | null) =>
      dispatch({ type: 'SELECT_ELEMENT_BY_ID', payload: id }),
    [dispatch]
  );
  const setSearchText = useCallback(
    (text: string) => dispatch({ type: 'SET_SEARCH_TEXT', payload: text }),
    [dispatch]
  );
  const goToNextSearchResult = useCallback(
    () => dispatch({ type: 'GO_TO_NEXT_SEARCH_RESULT' }),
    [dispatch]
  );
  const goToPreviousSearchResult = useCallback(
    () => dispatch({ type: 'GO_TO_PREVIOUS_SEARCH_RESULT' }),
    [dispatch]
  );
  const resetOwnerStack = useCallback(
    () => dispatch({ type: 'RESET_OWNER_STACK' }),
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
  const selectOwner = useCallback(
    (id: number) => dispatch({ type: 'SELECT_OWNER', payload: id }),
    [dispatch]
  );

  const value = useMemo(
    () => ({
      // Tree (derived from Store or owners state)
      baseDepth: state.baseDepth,
      numElements: state.numElements,
      selectedElementID: state.selectedElementID,
      selectedElementIndex: state.selectedElementIndex,
      getElementAtIndex,
      selectElementByID,
      selectElementAtIndex,
      selectNextElementInTree,
      selectPreviousElementInTree,

      // Search
      searchIndex: state.searchIndex,
      searchResults: state.searchResults,
      searchText: state.searchText,
      setSearchText,
      goToNextSearchResult,
      goToPreviousSearchResult,

      // Owners
      ownerStack: state.ownerStack,
      ownerStackIndex: state.ownerStackIndex,
      resetOwnerStack,
      selectOwner,
    }),
    [state]
  );

  // Mutations to the underlying tree may impact this context (e.g. search results, selection state).
  useLayoutEffect(() => {
    const handleStoreMutated = ([
      addedElementIDs,
      removedElementIDs,
    ]: Array<Uint32Array>) => {
      dispatch({
        type: 'HANDLE_STORE_MUTATION',
        payload: [addedElementIDs, removedElementIDs],
      });
    };

    // TODO Even though we're using layout effect, concurrent rendering may cause us to miss a mutation.
    // Should the store expose some sort of version number that we could check after mounting?

    store.addListener('mutated', handleStoreMutated);

    return () => store.removeListener('mutated', handleStoreMutated);
  }, [state, store]);

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
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

export { TreeContext, TreeContextController };

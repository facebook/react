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
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { createRegExp } from '../utils';
import { BridgeContext, StoreContext } from '../context';
import Store from '../../store';

import type { Element } from './types';

type StateContext = {|
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
  ownerFlatTree: Array<number> | null,
  ownerStack: Array<number>,
  ownerStackIndex: number | null,
|};

type ACTION_GO_TO_NEXT_SEARCH_RESULT = {|
  type: 'GO_TO_NEXT_SEARCH_RESULT',
|};
type ACTION_GO_TO_PREVIOUS_SEARCH_RESULT = {|
  type: 'GO_TO_PREVIOUS_SEARCH_RESULT',
|};
type ACTION_HANDLE_STORE_MUTATION = {|
  type: 'HANDLE_STORE_MUTATION',
  payload: [Uint32Array, Uint32Array],
|};
type ACTION_RESET_OWNER_STACK = {|
  type: 'RESET_OWNER_STACK',
|};
type ACTION_SELECT_CHILD_ELEMENT_IN_TREE = {|
  type: 'SELECT_CHILD_ELEMENT_IN_TREE',
|};
type ACTION_SELECT_ELEMENT_AT_INDEX = {|
  type: 'SELECT_ELEMENT_AT_INDEX',
  payload: number | null,
|};
type ACTION_SELECT_ELEMENT_BY_ID = {|
  type: 'SELECT_ELEMENT_BY_ID',
  payload: number | null,
|};
type ACTION_SELECT_NEXT_ELEMENT_IN_TREE = {|
  type: 'SELECT_NEXT_ELEMENT_IN_TREE',
|};
type ACTION_SELECT_PARENT_ELEMENT_IN_TREE = {|
  type: 'SELECT_PARENT_ELEMENT_IN_TREE',
|};
type ACTION_SELECT_PREVIOUS_ELEMENT_IN_TREE = {|
  type: 'SELECT_PREVIOUS_ELEMENT_IN_TREE',
|};
type ACTION_SELECT_OWNER = {|
  type: 'SELECT_OWNER',
  payload: number,
|};
type ACTION_SET_SEARCH_TEXT = {|
  type: 'SET_SEARCH_TEXT',
  payload: string,
|};

type Action =
  | ACTION_GO_TO_NEXT_SEARCH_RESULT
  | ACTION_GO_TO_PREVIOUS_SEARCH_RESULT
  | ACTION_HANDLE_STORE_MUTATION
  | ACTION_RESET_OWNER_STACK
  | ACTION_SELECT_CHILD_ELEMENT_IN_TREE
  | ACTION_SELECT_ELEMENT_AT_INDEX
  | ACTION_SELECT_ELEMENT_BY_ID
  | ACTION_SELECT_NEXT_ELEMENT_IN_TREE
  | ACTION_SELECT_PARENT_ELEMENT_IN_TREE
  | ACTION_SELECT_PREVIOUS_ELEMENT_IN_TREE
  | ACTION_SELECT_OWNER
  | ACTION_SET_SEARCH_TEXT;

type DispatcherContext = (action: Action) => void;

const TreeStateContext = createContext<StateContext>(
  ((null: any): StateContext)
);
TreeStateContext.displayName = 'TreeStateContext';

const TreeDispatcherContext = createContext<DispatcherContext>(
  ((null: any): DispatcherContext)
);
TreeDispatcherContext.displayName = 'TreeDispatcherContext';

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
  ownerFlatTree: Array<number> | null,
|};

function reduceTreeState(store: Store, state: State, action: Action): State {
  let {
    numElements,
    ownerStack,
    selectedElementIndex,
    selectedElementID,
  } = state;

  let lookupIDForIndex = true;

  // Base tree should ignore selected element changes when the owner's tree is active.
  if (ownerStack.length === 0) {
    switch (action.type) {
      case 'HANDLE_STORE_MUTATION':
        numElements = store.numElements;

        // If the currently-selected Element has been removed from the tree, update selection state.
        if (
          selectedElementID !== null &&
          store.getElementByID(selectedElementID) === null
        ) {
          selectedElementIndex = null;
        }
        break;
      case 'SELECT_CHILD_ELEMENT_IN_TREE':
        if (selectedElementIndex !== null) {
          const selectedElement = store.getElementAtIndex(
            ((selectedElementIndex: any): number)
          );
          if (
            selectedElement !== null &&
            selectedElement.children.length > 0 &&
            !selectedElement.isCollapsed
          ) {
            const firstChildID = selectedElement.children[0];
            const firstChildIndex = store.getIndexOfElementID(firstChildID);
            if (firstChildIndex !== null) {
              selectedElementIndex = firstChildIndex;
            }
          }
        }
        break;
      case 'SELECT_ELEMENT_AT_INDEX':
        selectedElementIndex = (action: ACTION_SELECT_ELEMENT_AT_INDEX).payload;
        break;
      case 'SELECT_ELEMENT_BY_ID':
        // Skip lookup in this case; it would be redundant.
        // It might also cause problems if the specified element was inside of a (not yet expanded) subtree.
        lookupIDForIndex = false;

        selectedElementID = (action: ACTION_SELECT_ELEMENT_BY_ID).payload;
        selectedElementIndex =
          selectedElementID === null
            ? null
            : store.getIndexOfElementID(selectedElementID);
        break;
      case 'SELECT_NEXT_ELEMENT_IN_TREE':
        if (
          selectedElementIndex === null ||
          selectedElementIndex + 1 >= numElements
        ) {
          selectedElementIndex = 0;
        } else {
          selectedElementIndex++;
        }
        break;
      case 'SELECT_PARENT_ELEMENT_IN_TREE':
        if (selectedElementIndex !== null) {
          const selectedElement = store.getElementAtIndex(
            ((selectedElementIndex: any): number)
          );
          if (selectedElement !== null && selectedElement.parentID !== null) {
            const parentIndex = store.getIndexOfElementID(
              selectedElement.parentID
            );
            if (parentIndex !== null) {
              selectedElementIndex = parentIndex;
            }
          }
        }
        break;
      case 'SELECT_PREVIOUS_ELEMENT_IN_TREE':
        if (selectedElementIndex === null || selectedElementIndex === 0) {
          selectedElementIndex = numElements - 1;
        } else {
          selectedElementIndex--;
        }
        break;
      default:
        // React can bailout of no-op updates.
        return state;
    }
  }

  // Keep selected item ID and index in sync.
  if (lookupIDForIndex && selectedElementIndex !== state.selectedElementIndex) {
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
  let {
    ownerStack,
    searchIndex,
    searchResults,
    searchText,
    selectedElementID,
    selectedElementIndex,
  } = state;

  const prevSearchIndex = searchIndex;
  const prevSearchText = searchText;
  const numPrevSearchResults = searchResults.length;

  // We track explicitly whether search was requested because
  // we might want to search even if search index didn't change.
  // For example, if you press "next result" on a search with a single
  // result but a different current selection, we'll set this to true.
  let didRequestSearch = false;

  // Search isn't supported when the owner's tree is active.
  if (ownerStack.length === 0) {
    switch (action.type) {
      case 'GO_TO_NEXT_SEARCH_RESULT':
        if (numPrevSearchResults > 0) {
          didRequestSearch = true;
          searchIndex =
            searchIndex + 1 < numPrevSearchResults ? searchIndex + 1 : 0;
        }
        break;
      case 'GO_TO_PREVIOUS_SEARCH_RESULT':
        if (numPrevSearchResults > 0) {
          didRequestSearch = true;
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
          ] = (action: ACTION_HANDLE_STORE_MUTATION).payload;

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
            const element = ((store.getElementByID(id): any): Element);

            // It's possible that multiple tree operations will fire before this action has run.
            // So it's important to check for elements that may have been added and then removed.
            if (element !== null) {
              const { displayName } = element;

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
            }
          });
        }
        break;
      case 'SET_SEARCH_TEXT':
        searchIndex = null;
        searchResults = [];
        searchText = (action: ACTION_SET_SEARCH_TEXT).payload;

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

  if (searchText !== prevSearchText) {
    const newSearchIndex = searchResults.indexOf(selectedElementID);
    if (newSearchIndex === -1) {
      // Only move the selection if the new query
      // doesn't match the current selection anymore.
      didRequestSearch = true;
    } else {
      // Selected item still matches the new search query.
      // Adjust the index to reflect its position in new results.
      searchIndex = newSearchIndex;
    }
  }
  if (didRequestSearch && searchIndex !== null) {
    selectedElementID = ((searchResults[searchIndex]: any): number);
    selectedElementIndex = store.getIndexOfElementID(
      ((selectedElementID: any): number)
    );
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
  let {
    baseDepth,
    numElements,
    selectedElementID,
    selectedElementIndex,
    ownerFlatTree,
    ownerStack,
    ownerStackIndex,
    searchIndex,
    searchResults,
    searchText,
  } = state;

  let prevSelectedElementIndex = selectedElementIndex;

  switch (action.type) {
    case 'HANDLE_STORE_MUTATION':
      if (ownerStack.length > 0) {
        let indexOfRemovedItem = -1;
        for (let i = 0; i < ownerStack.length; i++) {
          if (store.getElementByID(ownerStack[i]) === null) {
            indexOfRemovedItem = i;
            break;
          }
        }

        if (indexOfRemovedItem >= 0) {
          ownerStack = ownerStack.slice(0, indexOfRemovedItem);
          if (ownerStack.length === 0) {
            ownerFlatTree = null;
            ownerStackIndex = null;
          } else {
            ownerStackIndex = ownerStack.length - 1;
          }
        }
        if (selectedElementID !== null && ownerFlatTree !== null) {
          // Mutation might have caused the index of this ID to shift.
          selectedElementIndex = ownerFlatTree.indexOf(selectedElementID);
        }
      } else {
        if (selectedElementID !== null) {
          // Mutation might have caused the index of this ID to shift.
          selectedElementIndex = store.getIndexOfElementID(selectedElementID);
        }
      }
      if (selectedElementIndex === -1) {
        // If we couldn't find this ID after mutation, unselect it.
        selectedElementIndex = null;
        selectedElementID = null;
      }
      break;
    case 'RESET_OWNER_STACK':
      ownerStack = [];
      ownerStackIndex = null;
      selectedElementIndex =
        selectedElementID !== null
          ? store.getIndexOfElementID(selectedElementID)
          : null;
      ownerFlatTree = null;
      break;
    case 'SELECT_ELEMENT_AT_INDEX':
      if (ownerFlatTree !== null) {
        selectedElementIndex = (action: ACTION_SELECT_ELEMENT_AT_INDEX).payload;
      }
      break;
    case 'SELECT_ELEMENT_BY_ID':
      if (ownerFlatTree !== null) {
        const payload = (action: ACTION_SELECT_ELEMENT_BY_ID).payload;
        selectedElementIndex =
          payload === null ? null : ownerFlatTree.indexOf(payload);
      }
      break;
    case 'SELECT_NEXT_ELEMENT_IN_TREE':
      if (ownerFlatTree !== null && ownerFlatTree.length > 0) {
        if (selectedElementIndex === null) {
          selectedElementIndex = 0;
        } else if (selectedElementIndex + 1 < ownerFlatTree.length) {
          selectedElementIndex++;
        }
      }
      break;
    case 'SELECT_PREVIOUS_ELEMENT_IN_TREE':
      if (ownerFlatTree !== null && ownerFlatTree.length > 0) {
        if (selectedElementIndex !== null && selectedElementIndex > 0) {
          selectedElementIndex--;
        }
      }
      break;
    case 'SELECT_OWNER':
      // If the Store doesn't have any owners metadata, don't drill into an empty stack.
      // This is a confusing user experience.
      if (store.hasOwnerMetadata) {
        const id = (action: ACTION_SELECT_OWNER).payload;
        ownerStackIndex = ownerStack.indexOf(id);

        // Always force reset selection to be the top of the new owner tree.
        selectedElementIndex = 0;
        prevSelectedElementIndex = null;

        // If this owner is already in the current stack, just select it.
        // Otherwise, create a new stack.
        if (ownerStackIndex < 0) {
          // Add this new owner, and fill in the owners above it as well.
          ownerStack = [];
          let currentOwnerID = id;
          while (currentOwnerID !== 0) {
            ownerStack.unshift(currentOwnerID);
            currentOwnerID = ((store.getElementByID(
              currentOwnerID
            ): any): Element).ownerID;
          }
          ownerStackIndex = ownerStack.length - 1;

          if (searchText !== '') {
            searchIndex = null;
            searchResults = [];
            searchText = '';
          }
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
    action.type === 'HANDLE_STORE_MUTATION'
  ) {
    if (ownerStackIndex === null) {
      ownerFlatTree = null;
      baseDepth = 0;
      numElements = store.numElements;
    } else {
      ownerFlatTree = calculateCurrentOwnerList(
        store,
        ownerStack[ownerStackIndex],
        ownerStack[ownerStackIndex],
        []
      );

      baseDepth = ((store.getElementByID(ownerFlatTree[0]): any): Element)
        .depth;
      numElements = ownerFlatTree.length;
    }
  }

  // Keep selected item ID and index in sync.
  if (selectedElementIndex !== prevSelectedElementIndex) {
    if (selectedElementIndex === null) {
      selectedElementID = null;
    } else if (ownerFlatTree !== null) {
      selectedElementID = ownerFlatTree[((selectedElementIndex: any): number)];
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
    ownerFlatTree,
  };
}

type Props = {| children: React$Node |};

// TODO Remove TreeContextController wrapper element once global ConsearchText.write API exists.
function TreeContextController({ children }: Props) {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const initialRevision = useMemo(() => store.revision, [store]);

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
        case 'SELECT_CHILD_ELEMENT_IN_TREE':
        case 'SELECT_NEXT_ELEMENT_IN_TREE':
        case 'SELECT_PARENT_ELEMENT_IN_TREE':
        case 'SELECT_PREVIOUS_ELEMENT_IN_TREE':
        case 'SELECT_OWNER':
        case 'SET_SEARCH_TEXT':
          state = reduceTreeState(store, state, action);
          state = reduceSearchState(store, state, action);
          state = reduceOwnersState(store, state, action);

          // If the selected ID is in a collapsed subtree, reset the selected index to null.
          // We'll know the correct index after the layout effect will toggle the tree,
          // and the store tree is mutated to account for that.
          if (
            state.selectedElementID !== null &&
            store.isInsideCollapsedSubTree(state.selectedElementID)
          ) {
            return {
              ...state,
              selectedElementIndex: null,
            };
          }

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
    ownerFlatTree: null,
  });

  // Listen for host element selections.
  useEffect(() => {
    const handleSelectFiber = (id: number) =>
      dispatch({ type: 'SELECT_ELEMENT_BY_ID', payload: id });
    bridge.addListener('selectFiber', handleSelectFiber);
    return () => bridge.removeListener('selectFiber', handleSelectFiber);
  }, [bridge, dispatch]);

  // If a newly-selected search result or inspection selection is inside of a collapsed subtree, auto expand it.
  // This needs to be a layout effect to avoid temporarily flashing an incorrect selection.
  const prevSelectedElementID = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (state.selectedElementID !== prevSelectedElementID.current) {
      prevSelectedElementID.current = state.selectedElementID;

      if (state.selectedElementID !== null) {
        let element = store.getElementByID(state.selectedElementID);
        if (element !== null && element.parentID > 0) {
          store.toggleIsCollapsed(element.parentID, false);
        }
      }
    }
  }, [state.selectedElementID, store]);

  // Mutations to the underlying tree may impact this context (e.g. search results, selection state).
  useEffect(() => {
    const handleStoreMutated = ([
      addedElementIDs,
      removedElementIDs,
    ]: Array<Uint32Array>) => {
      dispatch({
        type: 'HANDLE_STORE_MUTATION',
        payload: [addedElementIDs, removedElementIDs],
      });
    };

    // Since this is a passive effect, the tree may have been mutated before our initial subscription.
    if (store.revision !== initialRevision) {
      // At the moment, we can treat this as a mutation.
      // We don't know which Elements were newly added/removed, but that should be okay in this case.
      // It would only impact the search state, which is unlikely to exist yet at this point.
      dispatch({
        type: 'HANDLE_STORE_MUTATION',
        payload: [new Uint32Array(0), new Uint32Array(0)],
      });
    }

    store.addListener('mutated', handleStoreMutated);

    return () => store.removeListener('mutated', handleStoreMutated);
  }, [dispatch, initialRevision, store]);

  return (
    <TreeStateContext.Provider value={state}>
      <TreeDispatcherContext.Provider value={dispatch}>
        {children}
      </TreeDispatcherContext.Provider>
    </TreeStateContext.Provider>
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

export { TreeDispatcherContext, TreeStateContext, TreeContextController };

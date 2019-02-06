// @flow

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
} from 'react';
import { createRegExp } from './utils';
import { StoreContext } from './context';
import { SelectedElementContext } from './SelectedElementContext';
import Store from '../store';

import type { Element } from 'src/devtools/types';

export type SearchContextValue = {|
  get currentIndex(): number | null,
  get ids(): Array<number>,
  get text(): string,
  updateCurrentIndex(newCurrentIndex: number): void,
  updateText(newText: string): void,
|};

const SearchContext = createContext<SearchContextValue>(
  ((null: any): SearchContextValue)
);
// $FlowFixMe displayName is a valid attribute of React$Context
SearchContext.displayName = 'SearchContext';

type State = {|
  currentIndex: number | null,
  ids: Array<number>,
  text: string,
|};

type Action = {|
  type: 'UPDATE',
  payload: $Shape<State>,
|};

function reducer(state: State, action: Action) {
  switch (action.type) {
    case 'UPDATE':
      return {
        ...state,
        ...action.payload,
      };
    default:
      throw new Error();
  }
}

type Props = {|
  children: React$Node,
|};

// TODO Remove this wrapper element once global Context.write API exists.
function SearchController({ children }: Props) {
  const store = useContext(StoreContext);
  const selectedElement = useContext(SelectedElementContext);

  const [state, dispatch] = useReducer(reducer, {
    currentIndex: null,
    ids: [],
    text: '',
  });

  const value = useMemo(
    () => ({
      get currentIndex(): number | null {
        return state.currentIndex;
      },

      get ids(): Array<number> {
        return state.ids;
      },

      get text(): string {
        return state.text;
      },

      updateCurrentIndex(newCurrentIndex: number) {
        dispatch({
          type: 'UPDATE',
          payload: {
            currentIndex: newCurrentIndex,
          },
        });

        // Make sure a new search result is also selected.
        selectedElement.id =
          newCurrentIndex !== null ? state.ids[newCurrentIndex] : null;
      },

      updateText(newText: string) {
        const { currentIndex: oldCurrentIndex, text: oldText } = state;

        let newCurrentIndex = oldCurrentIndex;
        let newIDs = [];

        // Find all matching elements.
        if (newText !== '') {
          let regExp = createRegExp(newText);
          store.roots.forEach(rootID => {
            searchTree(store, rootID, regExp, newIDs);
          });

          // If this is a refinement of a previous search, preserve the current index (unless it's no longer valid).
          // If it's a new search, reset the index.
          if (newIDs.length === 0) {
            newCurrentIndex = null;
          } else if (oldCurrentIndex !== null && newText.startsWith(oldText)) {
            newCurrentIndex = Math.min(oldCurrentIndex, newIDs.length - 1);
          } else {
            newCurrentIndex = 0;
          }
        } else {
          newCurrentIndex = null;
        }

        dispatch({
          type: 'UPDATE',
          payload: {
            currentIndex: newCurrentIndex,
            ids: newIDs,
            text: newText,
          },
        });

        // Make sure a new search result is also selected.
        selectedElement.id =
          newCurrentIndex !== null ? newIDs[newCurrentIndex] : null;
      },
    }),
    [state]
  );

  // Listen for changes to the tree and incrementally adjust the search results.
  useLayoutEffect(() => {
    const handleStoreMutated = ([
      addedElementIDs,
      removedElementIDs,
    ]: Array<Uint32Array>) => {
      const { currentIndex, ids, text } = state;

      if (!text) {
        return;
      }

      let newIDs = ids;
      let newCurrentIndex = currentIndex;

      removedElementIDs.forEach(id => {
        // Prune this item from the search results.
        const index = newIDs.indexOf(id);
        if (index >= 0) {
          newIDs = newIDs.slice(0, index).concat(newIDs.slice(index + 1));

          // If the results are now empty, also deselect things.
          if (newIDs.length === 0) {
            newCurrentIndex = null;
          } else if (((newCurrentIndex: any): number) >= newIDs.length) {
            newCurrentIndex = newIDs.length - 1;
          }
        }
      });

      addedElementIDs.forEach(id => {
        const { displayName } = ((store.getElementByID(id): any): Element);

        // Add this item to the search results if it matches.
        const regExp = createRegExp(text);
        if (displayName !== null && regExp.test(displayName)) {
          const newElementIndex = ((store.getIndexOfElementID(
            id
          ): any): number);

          let foundMatch = false;
          for (let index = 0; index < newIDs.length; index++) {
            const id = newIDs[index];
            if (
              newElementIndex < ((store.getIndexOfElementID(id): any): number)
            ) {
              foundMatch = true;
              newIDs = newIDs
                .slice(0, index)
                .concat(id)
                .concat(newIDs.slice(index));
              break;
            }
          }
          if (!foundMatch) {
            newIDs = newIDs.concat(id);
          }

          newCurrentIndex = newCurrentIndex === null ? 0 : newCurrentIndex;
        }
      });

      dispatch({
        type: 'UPDATE',
        payload: {
          currentIndex: newCurrentIndex,
          ids: newIDs,
        },
      });

      // Make sure a new search result is also selected.
      selectedElement.id =
        newCurrentIndex !== null ? newIDs[newCurrentIndex] : null;
    };

    store.addListener('mutated', handleStoreMutated);

    return () => store.removeListener('mutated', handleStoreMutated);
  }, [state, store]);

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

function searchTree(
  store: Store,
  elementID: number,
  regExp: RegExp,
  ids: Array<number>
): void {
  const { children, displayName } = ((store.getElementByID(
    elementID
  ): any): Element);
  if (displayName !== null) {
    if (regExp.test(displayName)) {
      ids.push(elementID);
    }
  }
  children.forEach(childID => searchTree(store, childID, regExp, ids));
}

export { SearchContext, SearchController };

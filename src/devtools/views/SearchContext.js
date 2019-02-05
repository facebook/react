// @flow

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
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

type Props = {|
  children: React$Node,
|};

// TODO Remove this wrapper element once global Context.write API exists.
function SearchController({ children }: Props) {
  const store = useContext(StoreContext);
  const selectedElement = useContext(SelectedElementContext);

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [ids, setIDs] = useState<Array<number>>([]);
  const [text, setText] = useState<string>('');

  const updateIndexHelper = (
    newCurrentIndex: number | null,
    newOrCurrentIDs: Array<number>
  ) => {
    setCurrentIndex(newCurrentIndex);

    // Make sure a new search result is also selected.
    selectedElement.id =
      newCurrentIndex !== null ? newOrCurrentIDs[newCurrentIndex] : null;
  };

  const value = useMemo(
    () => ({
      get currentIndex(): number | null {
        return currentIndex;
      },

      get ids(): Array<number> {
        return ids;
      },

      get text(): string {
        return text;
      },

      updateCurrentIndex(newCurrentIndex: number) {
        updateIndexHelper(newCurrentIndex, ids);
      },

      updateText(newText: string) {
        setText(newText);

        // Find all matching elements.
        const newIDs = [];
        if (newText !== '') {
          const regExp = new RegExp(newText, 'i');
          store.roots.forEach(rootID => {
            searchTree(store, rootID, regExp, newIDs);
          });

          setIDs(newIDs);

          // If this is a refinement of a previous search, preserve the current index (unless it's no longer valid).
          // If it's a new search, reset the index.
          if (newIDs.length === 0) {
            updateIndexHelper(null, newIDs);
          } else if (currentIndex !== null && newText.startsWith(text)) {
            updateIndexHelper(
              Math.min(currentIndex, newIDs.length - 1),
              newIDs
            );
          } else {
            updateIndexHelper(0, newIDs);
          }
        } else {
          setIDs([]);
          updateIndexHelper(null, newIDs);
        }
      },
    }),
    [currentIndex, ids, text]
  );

  // Listen for changes to the tree and incrementally adjust the search results.
  useLayoutEffect(() => {
    const handleElementAdded = (element: Element) => {
      if (!text) {
        return;
      }

      const { displayName, id } = element;

      // Add this item to the search results if it matches.
      const regExp = new RegExp(text, 'i');
      if (displayName !== null && regExp.test(displayName)) {
        const newElementIndex = ((store.getIndexOfElementID(id): any): number);

        let newIDs = null;
        for (let index = 0; index < ids.length; index++) {
          const id = ids[index];
          if (
            newElementIndex < ((store.getIndexOfElementID(id): any): number)
          ) {
            newIDs = ids
              .slice(0, index)
              .concat(id)
              .concat(ids.slice(index));
            break;
          }
        }
        if (newIDs === null) {
          newIDs = ids.concat(id);
        }

        setIDs(newIDs);
        updateIndexHelper(currentIndex === null ? 0 : currentIndex, newIDs);
      }
    };
    const handleElementRemoved = (element: Element) => {
      if (!text) {
        return;
      }

      // Prune this item from the search results.
      const index = ids.indexOf(element.id);
      if (index >= 0) {
        const newIDs = ids.slice(0, index).concat(ids.slice(index + 1));
        setIDs(newIDs);

        // If the results are now empty, also deselect things.
        if (newIDs.length === 0) {
          updateIndexHelper(null, newIDs);
        } else if (((currentIndex: any): number) < newIDs.length) {
          updateIndexHelper(currentIndex, newIDs);
        } else {
          updateIndexHelper(newIDs.length - 1, newIDs);
        }
      }
    };

    store.addListener('elementAdded', handleElementAdded);
    store.addListener('elementRemoved', handleElementRemoved);

    return () => {
      store.removeListener('elementAdded', handleElementAdded);
      store.removeListener('elementRemoved', handleElementRemoved);
    };
  }, [currentIndex, ids, store, text]);

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

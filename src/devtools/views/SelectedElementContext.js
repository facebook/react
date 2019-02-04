// @flow

import React, { createContext, useContext, useMemo, useState } from 'react';
import { StoreContext } from './context';

export type SelectedElementContextValue = {|
  id: number | null,
  index: number | null,
|};

const SelectedElementContext = createContext<SelectedElementContextValue>(
  ((null: any): SelectedElementContextValue)
);
// $FlowFixMe displayName is a valid attribute of React$Context
SelectedElementContext.displayName = 'SelectedElementContext';

type Props = {|
  children: React$Node,
|};

// TODO Remove this wrapper element once global Context.write API exists.
function SelectedElementController({ children }: Props) {
  const store = useContext(StoreContext);

  const [id, setID] = useState<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);

  const value = useMemo(
    () => ({
      get id() {
        return id;
      },
      set id(id: number | null) {
        setID(id);
        setIndex(id !== null ? store.getIndexOfElementID(id) : null);
      },
      get index() {
        return index;
      },
      set index(index: number | null) {
        const element = index !== null ? store.getElementAtIndex(index) : null;
        setID(element !== null ? element.id : null);
        setIndex(index);
      },
    }),
    [id]
  );

  return (
    <SelectedElementContext.Provider value={value}>
      {children}
    </SelectedElementContext.Provider>
  );
}

export { SelectedElementContext, SelectedElementController };

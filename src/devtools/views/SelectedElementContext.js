// @flow

import React, { createContext, useMemo, useState } from 'react';

type SelectedElementContextValue = {|
  id: number | null,
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
  const [id, setID] = useState<number | null>(null);
  const value = useMemo(
    () => ({
      get id() {
        return id;
      },
      set id(id: number | null) {
        setID(id);
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

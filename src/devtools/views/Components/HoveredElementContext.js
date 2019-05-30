// @flow

import React, { createContext, useState } from 'react';

type ID = number | null;
type SetID = (id: ID) => void;

const HoveredElementIDContext = createContext<ID>(null);
HoveredElementIDContext.displayName = 'HoveredElementIDContext';

const HoveredElementSetIDContext = createContext<SetID>(((null: any): SetID));
HoveredElementSetIDContext.displayName = 'HoveredElementSetIDContext';

type Props = {|
  children: React$Node,
|};

function HoveredElementContextController({ children }: Props) {
  const [hoveredElementID, setHoveredElementID] = useState<ID>(null);

  return (
    <HoveredElementIDContext.Provider value={hoveredElementID}>
      <HoveredElementSetIDContext.Provider value={setHoveredElementID}>
        {children}
      </HoveredElementSetIDContext.Provider>
    </HoveredElementIDContext.Provider>
  );
}

export {
  HoveredElementIDContext,
  HoveredElementSetIDContext,
  HoveredElementContextController,
};

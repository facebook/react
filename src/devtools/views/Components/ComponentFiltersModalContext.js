// @flow

import React, { createContext, useMemo, useState } from 'react';

type Context = {|
  isModalShowing: boolean,
  setIsModalShowing: (value: boolean) => void,
|};

const ComponentFiltersModalContext = createContext<Context>(
  ((null: any): Context)
);
ComponentFiltersModalContext.displayName = 'ComponentFiltersModalContext';

type Props = {|
  children: React$Node,
|};

function ComponentFiltersModalContextController({ children }: Props) {
  const [isModalShowing, setIsModalShowing] = useState(false);

  const value = useMemo(
    () => ({
      isModalShowing,
      setIsModalShowing,
    }),
    [isModalShowing]
  );

  return (
    <ComponentFiltersModalContext.Provider value={value}>
      {children}
    </ComponentFiltersModalContext.Provider>
  );
}

export { ComponentFiltersModalContext, ComponentFiltersModalContextController };

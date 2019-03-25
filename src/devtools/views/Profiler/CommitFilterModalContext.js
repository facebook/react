// @flow

import React, { createContext, useMemo, useState } from 'react';

type Context = {|
  isFilterModalShowing: boolean,
  setIsFilterModalShowing: (value: boolean) => void,
|};

const CommitFilterModalContext = createContext<Context>(((null: any): Context));
CommitFilterModalContext.displayName = 'CommitFilterModalContext';

type Props = {|
  children: React$Node,
|};

function CommitFilterModalContextController({ children }: Props) {
  const [isFilterModalShowing, setIsFilterModalShowing] = useState(false);

  const value = useMemo(
    () => ({
      isFilterModalShowing,
      setIsFilterModalShowing,
    }),
    [isFilterModalShowing]
  );

  return (
    <CommitFilterModalContext.Provider value={value}>
      {children}
    </CommitFilterModalContext.Provider>
  );
}

export { CommitFilterModalContext, CommitFilterModalContextController };

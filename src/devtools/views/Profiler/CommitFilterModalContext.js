// @flow

import React, { createContext, useMemo, useState } from 'react';

type Context = {|
  isModalShowing: boolean,
  setIsModalShowing: (value: boolean) => void,
|};

const CommitFilterModalContext = createContext<Context>(((null: any): Context));
CommitFilterModalContext.displayName = 'CommitFilterModalContext';

type Props = {|
  children: React$Node,
|};

function CommitFilterModalContextController({ children }: Props) {
  const [isModalShowing, setIsModalShowing] = useState(false);

  const value = useMemo(
    () => ({
      isModalShowing,
      setIsModalShowing,
    }),
    [isModalShowing]
  );

  return (
    <CommitFilterModalContext.Provider value={value}>
      {children}
    </CommitFilterModalContext.Provider>
  );
}

export { CommitFilterModalContext, CommitFilterModalContextController };

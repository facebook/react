// @flow

import React, { createContext, useMemo, useState } from 'react';

type Context = {|
  importError: Error | null,
  isModalShowing: boolean,
  setImportError: (error: Error | null) => void,
|};

const ImportFailedModalContext = createContext<Context>(((null: any): Context));
ImportFailedModalContext.displayName = 'ImportFailedModalContext';

type Props = {|
  children: React$Node,
|};

function ImportFailedModalContextController({ children }: Props) {
  const [importError, setImportError] = useState<Error | null>(null);

  const value = useMemo(
    () => ({
      importError,
      isModalShowing: !!importError,
      setImportError,
    }),
    [importError]
  );

  return (
    <ImportFailedModalContext.Provider value={value}>
      {children}
    </ImportFailedModalContext.Provider>
  );
}

export { ImportFailedModalContext, ImportFailedModalContextController };

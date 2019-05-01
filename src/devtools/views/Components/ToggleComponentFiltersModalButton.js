// @flow

import React, { useContext, useMemo } from 'react';
import { useSubscription } from '../hooks';
import { ComponentFiltersModalContext } from './ComponentFiltersModalContext';
import { StoreContext } from '../context';
import Toggle from '../Toggle';
import ButtonIcon from '../ButtonIcon';
import Store from 'src/devtools/store';

export default function ToggleCommitFilterModalButton() {
  const store = useContext(StoreContext);

  const { isModalShowing, setIsModalShowing } = useContext(
    ComponentFiltersModalContext
  );

  // Re-mounting a tree while profiling is in progress might break a lot of assumptions.
  // If necessary, we could support this- but it doesn't seem like a necessary use case.
  const isProfilingSubscription = useMemo(
    () => ({
      getCurrentValue: () => store.isProfiling,
      subscribe: (callback: Function) => {
        store.addListener('isProfiling', callback);
        return () => store.removeListener('isProfiling', callback);
      },
    }),
    [store]
  );
  const isProfiling = useSubscription<boolean, Store>(isProfilingSubscription);

  return (
    <Toggle
      isChecked={isModalShowing}
      isDisabled={isProfiling}
      onChange={setIsModalShowing}
      title="Filter preferences"
    >
      <ButtonIcon type="filter" />
    </Toggle>
  );
}

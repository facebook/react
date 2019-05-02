// @flow

import React, { useContext, useMemo } from 'react';
import { useSubscription } from '../hooks';
import { ComponentFiltersModalContext } from './ComponentFiltersModalContext';
import { StoreContext } from '../context';
import Toggle from '../Toggle';
import ButtonIcon from '../ButtonIcon';
import Store from 'src/devtools/store';

import styles from './ToggleCommitFilterModalButton.css';

import type { ComponentFilter } from 'src/types';

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

  const componentFiltersSubscription = useMemo(
    () => ({
      getCurrentValue: () => store.componentFilters,
      subscribe: (callback: Function) => {
        store.addListener('componentFilters', callback);
        return () => store.removeListener('componentFilters', callback);
      },
    }),
    [store]
  );
  const componentFilters = useSubscription<Array<ComponentFilter>, Store>(
    componentFiltersSubscription
  );

  const enabledCount = useMemo(
    () =>
      componentFilters.reduce(
        (count, componentFilter) =>
          componentFilter.isEnabled ? count + 1 : count,
        0
      ),
    [componentFilters]
  );

  return (
    <Toggle
      isChecked={isModalShowing}
      isDisabled={isProfiling}
      onChange={setIsModalShowing}
      title={
        enabledCount > 0
          ? `Filter preferences (${enabledCount} enabled)`
          : 'Filter preferences'
      }
    >
      <div className={styles.Wrapper}>
        <ButtonIcon type="filter" />
        {enabledCount > 0 && (
          <span className={styles.Label}>{enabledCount}</span>
        )}
      </div>
    </Toggle>
  );
}

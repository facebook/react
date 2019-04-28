// @flow

import React, { Fragment, useCallback, useContext, useMemo } from 'react';
import { ElementTypeHostComponent } from 'src/types';
import Store from 'src/devtools/store';
import { StoreContext } from '../context';
import { useSubscription } from '../hooks';

import styles from './FilterList.css';

import type { FilterPreferences } from 'src/types';

export default function FilterList(_: {||}) {
  const store = useContext(StoreContext);

  const filterPreferencesSubscription = useMemo(
    () => ({
      getCurrentValue: () => store.filterPreferences,
      subscribe: (callback: Function) => {
        store.addListener('filterPreferences', callback);
        return () => store.removeListener('filterPreferences', callback);
      },
    }),
    [store]
  );
  const filterPreferences = useSubscription<FilterPreferences, Store>(
    filterPreferencesSubscription
  );

  const updateFilterPreferences = useCallback(
    ({ currentTarget }) => {
      const filterPreferences = store.filterPreferences;
      if (currentTarget.checked) {
        filterPreferences.hideElementsWithTypes.add(ElementTypeHostComponent);
      } else {
        filterPreferences.hideElementsWithTypes.delete(
          ElementTypeHostComponent
        );
      }
      store.filterPreferences = { ...filterPreferences };
    },
    [store]
  );

  // TODO (filter) Disable toggles if isProfiling

  return (
    <Fragment>
      <label className={styles.Filter}>
        <input
          type="checkbox"
          checked={filterPreferences.hideElementsWithTypes.has(
            ElementTypeHostComponent
          )}
          onChange={updateFilterPreferences}
        />{' '}
        Hide host components (e.g. <code>&lt;div&gt;</code>)
      </label>
    </Fragment>
  );
}

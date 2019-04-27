// @flow

import React, { Fragment, useCallback, useState } from 'react';
import { getSavedFilterPreferences, saveFilterPreferences } from 'src/utils';
import { ElementTypeHostComponent } from 'src/types';

import styles from './FilterList.css';

export default function FilterList(_: {||}) {
  const [filterPreferences, setFilterPreferences] = useState(
    getSavedFilterPreferences
  );
  const updateFilterPreferences = useCallback(() => {
    const clonedFilterPreferences = { ...filterPreferences };
    setFilterPreferences(clonedFilterPreferences);
    saveFilterPreferences(clonedFilterPreferences);
  }, [filterPreferences]);

  const { hideElementsWithTypes } = filterPreferences;

  return (
    <Fragment>
      <label className={styles.Filter}>
        <input
          type="checkbox"
          checked={hideElementsWithTypes.has(ElementTypeHostComponent)}
          onChange={() => {
            if (hideElementsWithTypes.has(ElementTypeHostComponent)) {
              hideElementsWithTypes.delete(ElementTypeHostComponent);
            } else {
              hideElementsWithTypes.add(ElementTypeHostComponent);
            }
            updateFilterPreferences();
          }}
        />{' '}
        Hide host components (e.g. <code>&lt;div&gt;</code>)
      </label>
    </Fragment>
  );
}

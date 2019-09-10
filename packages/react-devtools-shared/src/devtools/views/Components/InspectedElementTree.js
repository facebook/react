/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {copy} from 'clipboard-js';
import React, {useEffect, useCallback, useState} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import KeyValue from './KeyValue';
import EditableName from './EditableName';
import EditableValue from './EditableValue';
import {alphaSortEntries, serializeDataForCopy} from '../utils';
import styles from './InspectedElementTree.css';

import type {InspectPath} from './SelectedElement';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type Props = {|
  data: Object | null,
  inspectPath?: InspectPath,
  label: string,
  overrideValueFn?: ?OverrideValueFn,
  showWhenEmpty?: boolean,
  canAddEntries?: boolean,
|};

export default function InspectedElementTree({
  data,
  inspectPath,
  label,
  overrideValueFn,
  canAddEntries = false,
  showWhenEmpty = false,
}: Props) {
  const [entries, setEntries] = useState(null);
  const [entryToAdd, setEntryToAdd] = useState(null);

  useEffect(
    () => {
      if (data != null) {
        setEntries(Object.entries(data).sort(alphaSortEntries));
      } else {
        setEntries(null);
      }
    },
    [data],
  );

  const isEmpty = entries === null || entries.length === 0;

  const handleCopy = useCallback(
    () => copy(serializeDataForCopy(((data: any): Object))),
    [data],
  );

  const handleEntryAdd = useCallback(
    () => {
      setEntryToAdd({
        key: null,
        value: '',
      });
    },
    [setEntryToAdd],
  );

  const handleEntryAddName = useCallback(
    key => {
      setEntryToAdd({
        ...entryToAdd,
        key,
      });
    },
    [entryToAdd, setEntryToAdd],
  );

  const handleEntryAddValue = useCallback(
    (...args) => {
      setEntryToAdd(null);

      if (typeof overrideValueFn === 'function') {
        overrideValueFn(...args);
      }
    },
    [overrideValueFn, setEntryToAdd],
  );

  if (isEmpty && !showWhenEmpty) {
    return null;
  } else {
    return (
      <div className={styles.InspectedElementTree}>
        <div className={styles.HeaderRow}>
          <div className={styles.Header}>{label}</div>
          {!isEmpty && (
            <Button onClick={handleCopy} title="Copy to clipboard">
              <ButtonIcon type="copy" />
            </Button>
          )}
          {canAddEntries && (
            <Button onClick={handleEntryAdd} title={`Add ${label}`}>
              <ButtonIcon type="add" />
            </Button>
          )}
        </div>
        {isEmpty && <div className={styles.Empty}>None</div>}
        {!isEmpty &&
          (entries: any).map(([name, value]) => (
            <KeyValue
              key={name}
              alphaSort={true}
              depth={1}
              inspectPath={inspectPath}
              name={name}
              overrideValueFn={overrideValueFn}
              path={[name]}
              value={value}
            />
          ))}
        {entryToAdd && (
          <div className={styles.AddEntry}>
            <EditableName overrideNameFn={handleEntryAddName} />:
            <EditableValue
              dataType={typeof entryToAdd.value}
              overrideValueFn={handleEntryAddValue}
              path={[entryToAdd.key]}
              initialValue={entryToAdd.value}
            />
          </div>
        )}
      </div>
    );
  }
}

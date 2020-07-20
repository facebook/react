/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {copy} from 'clipboard-js';
import * as React from 'react';
import {useCallback, useState} from 'react';
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
  pathRoot: string,
  showWhenEmpty?: boolean,
  canAddEntries?: boolean,
|};

export default function InspectedElementTree({
  data,
  inspectPath,
  label,
  overrideValueFn,
  pathRoot,
  canAddEntries = false,
  showWhenEmpty = false,
}: Props) {
  const entries = data != null ? Object.entries(data) : null;
  if (entries !== null) {
    entries.sort(alphaSortEntries);
  }

  const [newPropKey, setNewPropKey] = useState<number>(0);
  const [newPropName, setNewPropName] = useState<string>('');

  const isEmpty = entries === null || entries.length === 0;

  const handleCopy = useCallback(
    () => copy(serializeDataForCopy(((data: any): Object))),
    [data],
  );

  const handleNewEntryValue = useCallback(
    (name, value) => {
      if (!newPropName) {
        return;
      }

      setNewPropName('');
      setNewPropKey(key => key + 1);

      if (typeof overrideValueFn === 'function') {
        overrideValueFn(name, value);
      }
    },
    [newPropName, overrideValueFn],
  );

  if (isEmpty && !showWhenEmpty && !canAddEntries) {
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
        </div>
        {isEmpty && !canAddEntries && <div className={styles.Empty}>None</div>}
        {!isEmpty &&
          (entries: any).map(([name, value]) => (
            <KeyValue
              key={name}
              alphaSort={true}
              pathRoot={pathRoot}
              depth={1}
              inspectPath={inspectPath}
              name={name}
              overrideValueFn={overrideValueFn}
              path={[name]}
              value={value}
            />
          ))}
        {canAddEntries && (
          <div className={styles.AddEntry} key={newPropKey}>
            <EditableName
              autoFocus={newPropKey > 0}
              overrideNameFn={setNewPropName}
            />
            :&nbsp;
            <EditableValue
              className={styles.EditableValue}
              overrideValueFn={handleNewEntryValue}
              path={[newPropName]}
              value={''}
            />
          </div>
        )}
      </div>
    );
  }
}

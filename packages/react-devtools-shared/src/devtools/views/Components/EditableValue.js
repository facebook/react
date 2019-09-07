/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Fragment, useEffect, useCallback, useRef, useState} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import styles from './EditableValue.css';
import {sanitizeForParse} from '../../utils';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type EditableValueProps = {|
  dataType: string,
  overrideValueFn: OverrideValueFn,
  path: Array<string | number>,
  value: any,
|};

export default function EditableValue({
  dataType,
  overrideValueFn,
  path,
  value,
}: EditableValueProps) {
  const [isValid, setIsValid] = useState(true);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [stringifiedValue, setStringifiedValue] = useState(
    JSON.stringify(value),
  );
  const [editableValue, setEditableValue] = useState(stringifiedValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => {
      setStringifiedValue(JSON.stringify(value));
    },
    [value],
  );

  if (hasPendingChanges && editableValue === stringifiedValue) {
    setHasPendingChanges(false);
  }

  const handleChange = useCallback(
    ({target}) => {
      if (dataType === 'boolean') {
        setEditableValue(JSON.stringify(target.checked));
        overrideValueFn(path, target.checked);
      } else {
        let isValidJSON = false;
        try {
          JSON.parse(sanitizeForParse(target.value));
          isValidJSON = true;
        } catch (error) {}

        setIsValid(isValidJSON);
        setEditableValue(target.value);
      }
      setHasPendingChanges(true);
    },
    [dataType, overrideValueFn, path],
  );

  const handleReset = useCallback(
    () => {
      setEditableValue(stringifiedValue);
      setHasPendingChanges(false);
      setIsValid(true);

      if (inputRef.current !== null) {
        inputRef.current.focus();
      }
    },
    [stringifiedValue],
  );

  const handleKeyDown = useCallback(
    event => {
      // Prevent keydown events from e.g. change selected element in the tree
      event.stopPropagation();

      const {key} = event;

      if (key === 'Enter' && isValid) {
        const parsedEditableValue = JSON.parse(sanitizeForParse(editableValue));

        if (value !== parsedEditableValue) {
          overrideValueFn(path, parsedEditableValue);
        }

        // Don't reset the pending change flag here.
        // The inspected fiber won't be updated until after the next "inspectElement" message.
        // We'll reset that flag during a subsequent render.
      } else if (key === 'Escape') {
        setEditableValue(stringifiedValue);
        setHasPendingChanges(false);
        setIsValid(true);
      }
    },
    [editableValue, isValid, dataType, overrideValueFn, path, value],
  );

  let inputValue = value === undefined ? '' : stringifiedValue;
  if (hasPendingChanges) {
    inputValue = editableValue;
  }

  let placeholder = '';
  if (value === undefined) {
    placeholder = '(undefined)';
  } else {
    placeholder = 'Enter valid JSON';
  }

  return (
    <Fragment>
      {dataType === 'boolean' && (
        <label className={styles.CheckboxLabel}>
          <input
            checked={inputValue === 'true'}
            className={styles.Checkbox}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            type="checkbox"
          />
        </label>
      )}
      {dataType !== 'boolean' && (
        <input
          className={isValid ? styles.Input : styles.Invalid}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          type="text"
          value={inputValue}
        />
      )}
      {hasPendingChanges &&
        dataType !== 'boolean' && (
          <Button
            className={styles.ResetButton}
            onClick={handleReset}
            title="Reset value">
            <ButtonIcon type="undo" />
          </Button>
        )}
    </Fragment>
  );
}

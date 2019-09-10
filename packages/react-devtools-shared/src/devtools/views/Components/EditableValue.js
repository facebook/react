/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Fragment, useCallback, useRef, useState} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import styles from './EditableValue.css';
import {sanitizeForParse} from '../../utils';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type EditableValueProps = {|
  dataType: string,
  overrideValueFn: OverrideValueFn,
  path: Array<string | number>,
  initialValue: any,
|};

export default function EditableValue({
  dataType,
  overrideValueFn,
  path,
  initialValue,
}: EditableValueProps) {
  const [isValid, setIsValid] = useState(true);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [editableValue, setEditableValue] = useEditableValue(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (hasPendingChanges && editableValue === JSON.stringify(initialValue)) {
    setHasPendingChanges(false);
  }

  const handleChange = useCallback(
    ({target}) => {
      if (dataType === 'boolean') {
        setEditableValue(target.checked, {shouldStringify: true});
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
      setEditableValue(initialValue, {shouldStringify: true});
      setHasPendingChanges(false);
      setIsValid(true);

      if (inputRef.current !== null) {
        inputRef.current.focus();
      }
    },
    [initialValue],
  );

  const handleKeyDown = useCallback(
    event => {
      // Prevent keydown events from e.g. change selected element in the tree
      event.stopPropagation();

      const {key} = event;

      if (key === 'Enter' && isValid) {
        const parsedEditableValue = JSON.parse(sanitizeForParse(editableValue));

        if (initialValue !== parsedEditableValue) {
          overrideValueFn(path, parsedEditableValue);
        }

        // Don't reset the pending change flag here.
        // The inspected fiber won't be updated until after the next "inspectElement" message.
        // We'll reset that flag during a subsequent render.
      } else if (key === 'Escape') {
        setEditableValue(initialValue, {shouldStringify: true});
        setHasPendingChanges(false);
        setIsValid(true);
      }
    },
    [editableValue, isValid, dataType, overrideValueFn, path, initialValue],
  );

  let inputValue =
    initialValue === undefined ? '' : JSON.stringify(initialValue);
  if (hasPendingChanges) {
    inputValue = editableValue;
  }

  let placeholder = '';
  if (initialValue === undefined) {
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

function useEditableValue(initialValue: any): [any, Function] {
  const [editableValue, setEditableValue] = useState(
    JSON.stringify(initialValue),
  );

  function setEditableValueWithStringify(
    value: any,
    {shouldStringify}: Object = {},
  ) {
    if (shouldStringify) {
      setEditableValue(JSON.stringify(value));
    } else {
      setEditableValue(value);
    }
  }

  return [editableValue, setEditableValueWithStringify];
}

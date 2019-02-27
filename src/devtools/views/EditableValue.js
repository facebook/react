// @flow

import React, { Fragment, useCallback, useRef, useState } from 'react';
import Button from './Button';
import ButtonIcon from './ButtonIcon';
import styles from './EditableValue.css';

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
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [editableValue, setEditableValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (hasPendingChanges && editableValue === value) {
    setHasPendingChanges(false);
  }

  const handleChange = useCallback(
    ({ target }) => {
      if (dataType === 'boolean') {
        setEditableValue(target.checked);
        overrideValueFn(path, target.checked);
      } else if (dataType === 'number') {
        setEditableValue(parseFloat(target.value));
      } else {
        setEditableValue(target.value);
      }
      setHasPendingChanges(true);
    },
    [dataType, overrideValueFn, path]
  );

  const handleReset = useCallback(() => {
    setEditableValue(value);
    setHasPendingChanges(false);

    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [value]);

  const handleKeyDown = useCallback(
    event => {
      // Prevent keydown events from e.g. change selected element in the tree
      event.stopPropagation();

      const { key } = event;

      if (key === 'Enter') {
        overrideValueFn(path, editableValue);

        // Don't reset the pending change flag here.
        // The inspected fiber won't be updated until after the next "inspectElement" message.
        // We'll reset that flag during a subsequent render.
      } else if (key === 'Escape') {
        setEditableValue(value);
        setHasPendingChanges(false);
      }
    },
    [path, editableValue, overrideValueFn, value]
  );

  // Render different input types based on the dataType
  let type = 'text';
  if (dataType === 'boolean') {
    type = 'checkbox';
  } else if (dataType === 'number') {
    type = 'number';
  }

  let inputValue = value == null ? '' : value;
  if (hasPendingChanges) {
    inputValue = editableValue == null ? '' : editableValue;
  }

  return (
    <Fragment>
      {dataType === 'boolean' && (
        <label className={styles.CheckboxLabel}>
          <input
            checked={inputValue}
            className={styles.Checkbox}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            type={type}
          />
        </label>
      )}
      {dataType !== 'boolean' && (
        <input
          className={styles.Input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          type={type}
          value={inputValue}
        />
      )}
      {hasPendingChanges && dataType !== 'boolean' && (
        <Button
          className={styles.ResetButton}
          onClick={handleReset}
          title="Reset value"
        >
          <ButtonIcon type="undo" />
        </Button>
      )}
    </Fragment>
  );
}

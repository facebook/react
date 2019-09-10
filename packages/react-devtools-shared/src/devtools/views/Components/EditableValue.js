/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Fragment, useCallback, useRef} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import styles from './EditableValue.css';
import {useEditableValue} from '../hooks';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type EditableValueProps = {|
  className?: string,
  dataType: string,
  initialValue: any,
  overrideValueFn: OverrideValueFn,
  path: Array<string | number>,
|};

export default function EditableValue({
  className = '',
  dataType,
  initialValue,
  overrideValueFn,
  path,
}: EditableValueProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    editableValue,
    hasPendingChanges,
    isValid,
    parsedValue,
    reset,
    update,
  } = useEditableValue(initialValue);

  const handleChange = useCallback(({target}) => update(target.value), [
    update,
  ]);

  const handleKeyDown = useCallback(
    event => {
      // Prevent keydown events from e.g. change selected element in the tree
      event.stopPropagation();

      switch (event.key) {
        case 'Enter':
          if (isValid && hasPendingChanges) {
            overrideValueFn(path, parsedValue);
          }
          break;
        case 'Escape':
          reset();
          break;
        default:
          break;
      }
    },
    [hasPendingChanges, isValid, overrideValueFn, parsedValue, reset],
  );

  let placeholder = '';
  if (editableValue === undefined) {
    placeholder = '(undefined)';
  } else {
    placeholder = 'Enter valid JSON';
  }

  return (
    <Fragment>
      <input
        autoComplete="new-password"
        className={`${isValid ? styles.Input : styles.Invalid} ${className}`}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        type="text"
        value={editableValue}
      />
      {hasPendingChanges && (
        <Button
          className={styles.ResetButton}
          onClick={reset}
          title="Reset value">
          <ButtonIcon type="undo" />
        </Button>
      )}
    </Fragment>
  );
}

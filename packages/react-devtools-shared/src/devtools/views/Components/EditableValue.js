/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useRef} from 'react';
import styles from './EditableValue.css';
import {useEditableValue} from '../hooks';

type OverrideValueFn = (path: Array<string | number>, value: any) => void;

type EditableValueProps = {|
  className?: string,
  overrideValueFn: OverrideValueFn,
  path: Array<string | number>,
  value: any,
|};

export default function EditableValue({
  className = '',
  overrideValueFn,
  path,
  value,
}: EditableValueProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, dispatch] = useEditableValue(value);
  const {editableValue, hasPendingChanges, isValid, parsedValue} = state;

  const reset = () =>
    dispatch({
      type: 'RESET',
      externalValue: value,
    });

  const handleChange = ({target}) =>
    dispatch({
      type: 'UPDATE',
      editableValue: target.value,
      externalValue: value,
    });

  const handleKeyDown = event => {
    // Prevent keydown events from e.g. change selected element in the tree
    event.stopPropagation();

    switch (event.key) {
      case 'Enter':
        applyChanges();
        break;
      case 'Escape':
        reset();
        break;
      default:
        break;
    }
  };

  const applyChanges = () => {
    if (isValid && hasPendingChanges) {
      overrideValueFn(path, parsedValue);
    }
  };

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
        onBlur={applyChanges}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        type="text"
        value={editableValue}
      />
    </Fragment>
  );
}

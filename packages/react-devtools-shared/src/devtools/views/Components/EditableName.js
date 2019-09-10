/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useCallback, useState} from 'react';
import AutoSizeInput from './NativeStyleEditor/AutoSizeInput';
import styles from './EditableName.css';

type OverrideNameFn = (path: Array<string | number>, value: any) => void;

type EditableNameProps = {|
  autoFocus?: boolean,
  initialValue?: string,
  overrideNameFn: OverrideNameFn,
|};

export default function EditableName({
  autoFocus = false,
  initialValue = '',
  overrideNameFn,
}: EditableNameProps) {
  const [editableName, setEditableName] = useState(initialValue);
  const [isValid, setIsValid] = useState(false);

  const handleChange = useCallback(
    ({target}) => {
      const value = target.value.trim();

      if (value) {
        setIsValid(true);
      } else {
        setIsValid(false);
      }

      setEditableName(value);
    },
    [overrideNameFn],
  );

  const handleKeyDown = useCallback(
    event => {
      // Prevent keydown events from e.g. change selected element in the tree
      event.stopPropagation();

      switch (event.key) {
        case 'Enter':
        case 'Tab':
          if (isValid) {
            overrideNameFn(editableName);
          }
          break;
        case 'Escape':
          setEditableName(initialValue);
          break;
        default:
          break;
      }
    },
    [editableName, setEditableName, isValid, initialValue, overrideNameFn],
  );

  return (
    <AutoSizeInput
      autoFocus={autoFocus}
      className={styles.Input}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="new prop"
      type="text"
      value={editableName}
    />
  );
}

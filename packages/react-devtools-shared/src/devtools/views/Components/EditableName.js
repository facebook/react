/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useRef, useCallback, useEffect, useState} from 'react';
import styles from './EditableName.css';

type OverrideNameFn = (path: Array<string | number>, value: any) => void;

type EditableNameProps = {|
  key?: string,
  overrideNameFn: OverrideNameFn,
|};

export default function EditableName({
  name = '',
  overrideNameFn,
}: EditableNameProps) {
  const [editableName, setEditableName] = useState(name);
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => {
      if (inputRef.current !== null) {
        inputRef.current.focus();
      }
    },
    [],
  );

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

      const eventKey = event.key;

      if ((eventKey === 'Enter' || eventKey === 'Tab') && isValid) {
        overrideNameFn(editableName);
      } else if (eventKey === 'Escape') {
        setEditableName(name);
      }
    },
    [editableName, setEditableName, isValid, name, overrideNameFn],
  );

  return (
    <input
      className={styles.Input}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      ref={inputRef}
      type="text"
      value={editableName}
    />
  );
}

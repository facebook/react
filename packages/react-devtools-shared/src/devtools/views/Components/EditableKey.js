/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useRef, useCallback, useEffect, useState} from 'react';
import styles from './EditableKey.css';

type OverrideKeyFn = (path: Array<string | number>, value: any) => void;

type EditableKeyProps = {|
  key?: string,
  overrideKeyFn: OverrideKeyFn,
|};

export default function EditableKey({
  key = '',
  overrideKeyFn,
}: EditableKeyProps) {
  const [editableKey, setEditableKey] = useState(key);
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => {
      if (inputRef.current !== null) {
        inputRef.current.focus();
      }
    },
    [inputRef],
  );

  const handleChange = useCallback(
    ({target}) => {
      const value = target.value.trim();

      if (value) {
        setIsValid(true);
      } else {
        setIsValid(false);
      }

      setEditableKey(value);
    },
    [overrideKeyFn],
  );

  const handleKeyDown = useCallback(
    event => {
      // Prevent keydown events from e.g. change selected element in the tree
      event.stopPropagation();

      const eventKey = event.key;

      if ((eventKey === 'Enter' || eventKey === 'Tab') && isValid) {
        overrideKeyFn(editableKey);
      } else if (eventKey === 'Escape') {
        setEditableKey(key);
      }
    },
    [editableKey, setEditableKey, isValid, key, overrideKeyFn],
  );

  return (
    <input
      className={styles.Input}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      ref={inputRef}
      type="text"
      value={editableKey}
    />
  );
}

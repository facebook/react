/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useCallback, useRef} from 'react';

import Button from 'react-devtools-shared/src/devtools/views/Button';
import ButtonIcon from 'react-devtools-shared/src/devtools/views/ButtonIcon';

import styles from './ImportButton.css';

type Props = {|
  onFileSelect: (file: File) => void,
|};

export default function ImportButton({onFileSelect}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(() => {
    const input = inputRef.current;
    if (input === null) {
      return;
    }
    if (input.files.length > 0) {
      onFileSelect(input.files[0]);
    }
    // Reset input element to allow the same file to be re-imported
    input.value = '';
  }, [onFileSelect]);

  const uploadData = useCallback(() => {
    if (inputRef.current !== null) {
      inputRef.current.click();
    }
  }, []);

  return (
    <>
      <input
        ref={inputRef}
        className={styles.Input}
        type="file"
        onChange={handleFiles}
        tabIndex={-1}
      />
      <Button onClick={uploadData} title="Load profile...">
        <ButtonIcon type="import" />
      </Button>
    </>
  );
}

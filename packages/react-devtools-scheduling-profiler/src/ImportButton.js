/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TimelineEvent} from '@elg/speedscope';
import type {ReactProfilerData} from './types';

import * as React from 'react';
import {useCallback, useContext, useRef} from 'react';

import Button from 'react-devtools-shared/src/devtools/views/Button';
import ButtonIcon from 'react-devtools-shared/src/devtools/views/ButtonIcon';
import {ModalDialogContext} from 'react-devtools-shared/src/devtools/views/ModalDialog';

import preprocessData from './utils/preprocessData';
import {readInputData} from './utils/readInputData';

import styles from './ImportButton.css';

type Props = {|
  onDataImported: (profilerData: ReactProfilerData) => void,
|};

export default function ImportButton({onDataImported}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {dispatch: modalDialogDispatch} = useContext(ModalDialogContext);

  const handleFiles = useCallback(async () => {
    const input = inputRef.current;
    if (input === null) {
      return;
    }

    if (input.files.length > 0) {
      try {
        const readFile = await readInputData(input.files[0]);
        const events: TimelineEvent[] = JSON.parse(readFile);
        if (events.length > 0) {
          onDataImported(preprocessData(events));
        }
      } catch (error) {
        modalDialogDispatch({
          type: 'SHOW',
          title: 'Import failed',
          content: (
            <>
              <div>The profiling data you selected cannot be imported.</div>
              {error !== null && (
                <div className={styles.ErrorMessage}>{error.message}</div>
              )}
            </>
          ),
        });
      }
    }

    // Reset input element to allow the same file to be re-imported
    input.value = '';
  }, [onDataImported, modalDialogDispatch]);

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

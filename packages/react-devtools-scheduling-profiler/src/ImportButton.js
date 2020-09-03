/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactProfilerData} from './types';
import type {ImportWorkerOutputData} from './import-worker/import.worker';

import * as React from 'react';
import {useCallback, useContext, useRef} from 'react';

import Button from 'react-devtools-shared/src/devtools/views/Button';
import ButtonIcon from 'react-devtools-shared/src/devtools/views/ButtonIcon';
import {ModalDialogContext} from 'react-devtools-shared/src/devtools/views/ModalDialog';

import styles from './ImportButton.css';
import ImportWorker from './import-worker/import.worker';

type Props = {|
  onDataImported: (profilerData: ReactProfilerData) => void,
|};

export default function ImportButton({onDataImported}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {dispatch: modalDialogDispatch} = useContext(ModalDialogContext);

  const handleFiles = useCallback(() => {
    const input = inputRef.current;
    if (input === null) {
      return;
    }

    if (input.files.length > 0) {
      const worker: Worker = new (ImportWorker: any)();
      worker.onmessage = function(event) {
        const data = ((event.data: any): ImportWorkerOutputData);
        switch (data.status) {
          case 'SUCCESS':
            onDataImported(data.processedData);
            break;
          case 'ERROR':
            modalDialogDispatch({
              type: 'SHOW',
              title: 'Import failed',
              content: (
                <>
                  <div>The profiling data you selected cannot be imported.</div>
                  {data.error !== null && (
                    <div className={styles.ErrorMessage}>
                      {data.error.message}
                    </div>
                  )}
                </>
              ),
            });
            break;
        }
      };
      worker.postMessage({file: input.files[0]});
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

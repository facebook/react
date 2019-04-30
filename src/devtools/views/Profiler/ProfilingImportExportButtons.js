// @flow

import React, { Fragment, useContext, useCallback, useRef } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { ModalDialogContext } from '../ModalDialog';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { BridgeContext, StoreContext } from '../context';
import {
  prepareExportedProfilingSummary,
  prepareImportedProfilingData,
} from './utils';

import styles from './ProfilingImportExportButtons.css';

export default function ProfilingImportExportButtons() {
  const bridge = useContext(BridgeContext);
  const { isProfiling, rendererID, rootHasProfilingData, rootID } = useContext(
    ProfilerContext
  );
  const store = useContext(StoreContext);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const { dispatch: modalDialogDispatch } = useContext(ModalDialogContext);

  const downloadData = useCallback(() => {
    if (rendererID === null || rootID === null) {
      return;
    }

    const exportedProfilingSummary = prepareExportedProfilingSummary(
      store.profilingOperations,
      store.profilingSnapshots,
      rootID,
      rendererID
    );
    bridge.send('exportProfilingSummary', exportedProfilingSummary);
  }, [
    bridge,
    rendererID,
    rootID,
    store.profilingOperations,
    store.profilingSnapshots,
  ]);

  const uploadData = useCallback(() => {
    if (inputRef.current !== null) {
      inputRef.current.click();
    }
  }, []);

  const handleFiles = useCallback(() => {
    const input = inputRef.current;
    if (input !== null && input.files.length > 0) {
      const fileReader = new FileReader();
      fileReader.addEventListener('load', () => {
        try {
          const raw = ((fileReader.result: any): string);
          store.importedProfilingData = prepareImportedProfilingData(raw);
        } catch (error) {
          modalDialogDispatch({
            type: 'SHOW',
            title: 'Import failed',
            content: (
              <Fragment>
                <div>The profiling data you selected cannot be imported.</div>
                {error !== null && (
                  <div className={styles.ErrorMessage}>{error.message}</div>
                )}
              </Fragment>
            ),
          });
        }
      });
      // TODO (profiling) Handle fileReader errors.
      fileReader.readAsText(input.files[0]);
    }
  }, [modalDialogDispatch, store]);

  return (
    <Fragment>
      <div className={styles.VRule} />
      <input
        ref={inputRef}
        className={styles.Input}
        type="file"
        onChange={handleFiles}
        tabIndex={-1}
      />
      <Button
        disabled={isProfiling}
        onClick={uploadData}
        title="Load profile..."
      >
        <ButtonIcon type="import" />
      </Button>
      {store.supportsFileDownloads && (
        <Button
          disabled={isProfiling || !rootHasProfilingData}
          onClick={downloadData}
          title="Save profile..."
        >
          <ButtonIcon type="export" />
        </Button>
      )}
    </Fragment>
  );
}

// @flow

import React, { Fragment, useContext, useCallback, useRef } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { ModalDialogContext } from '../ModalDialog';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { StoreContext } from '../context';
import {
  prepareProfilingDataExport,
  prepareProfilingDataFrontendFromExport,
} from './utils';

import styles from './ProfilingImportExportButtons.css';

import type { ProfilingDataExport } from './types';

export default function ProfilingImportExportButtons() {
  const { isProfiling, rootID } = useContext(ProfilerContext);
  const store = useContext(StoreContext);
  const { profilerStore } = store;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const { dispatch: modalDialogDispatch } = useContext(ModalDialogContext);

  const downloadData = useCallback(() => {
    if (rootID === null) {
      return;
    }

    if (profilerStore.profilingData !== null) {
      const profilingDataExport = prepareProfilingDataExport(
        profilerStore.profilingData
      );

      // TODO (profarc) Generate anchor "download" tag and click it
      console.log('profilingDataExport:', profilingDataExport);
    }
  }, [rootID, profilerStore.profilingData]);

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
          const profilingDataExport = ((JSON.parse(
            raw
          ): any): ProfilingDataExport);
          store.profilingData = prepareProfilingDataFrontendFromExport(
            profilingDataExport
          );
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
          disabled={isProfiling || !profilerStore.hasProfilingData}
          onClick={downloadData}
          title="Save profile..."
        >
          <ButtonIcon type="export" />
        </Button>
      )}
    </Fragment>
  );
}

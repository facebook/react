// @flow

import React, { Fragment, useContext, useCallback, useRef } from 'react';
import { ProfilerContext } from './ProfilerContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { BridgeContext, StoreContext } from '../context';

import styles from './ProfilingImportExportButtons.css';

import type { ImportedProfilingData } from './types';

export default function ProfilingImportExportButtons() {
  const bridge = useContext(BridgeContext);
  const { isProfiling, rendererID, rootHasProfilingData, rootID } = useContext(
    ProfilerContext
  );
  const store = useContext(StoreContext);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const downloadData = useCallback(() => {
    if (rootID === null) {
      return;
    }

    const profilingOperationsForRoot = [];
    const operations = store.profilingOperations.get(rootID);
    if (operations != null) {
      operations.forEach(operations => {
        // Convert typed Array before JSON serialization, or it will be converted to an Object.
        profilingOperationsForRoot.push(Array.from(operations));
      });
    }

    const profilingSnapshotForRoot = [];
    const queue = [rootID];
    while (queue.length) {
      const id = queue.pop();
      profilingSnapshotForRoot.push([id, store.profilingSnapshots.get(id)]);
    }

    bridge.send('exportProfilingSummary', {
      profilingOperations: [[rootID, profilingOperationsForRoot]],
      profilingSnapshot: profilingSnapshotForRoot,
      rendererID,
      rootID,
    });
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
        const data = JSON.parse((fileReader.result: any));
        data.profilingOperations = new Map(data.profilingOperations);
        data.profilingSnapshot = new Map(data.profilingSnapshot);

        // TODO (profiling) Version check; warn if older version.

        store.importedProfilingData = ((data: any): ImportedProfilingData);
      });
      fileReader.readAsText(input.files[0]);
    }
  }, [store]);

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

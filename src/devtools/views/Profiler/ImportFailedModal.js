// @flow

import React, { useCallback, useContext, useRef } from 'react';
import { ImportFailedModalContext } from './ImportFailedModalContext';
import Button from '../Button';
import { useModalDismissSignal } from '../hooks';

import styles from './ImportFailedModal.css';

export default function ImportFailedModal(_: {||}) {
  const { importError, setImportError } = useContext(ImportFailedModalContext);
  const dismissModal = useCallback(() => setImportError(null), [
    setImportError,
  ]);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useModalDismissSignal(modalRef, dismissModal);

  return (
    <div className={styles.Background}>
      <div className={styles.Dialog} ref={modalRef}>
        <div className={styles.Header}>Import failed</div>
        <div>The profiling data you selected cannot be imported.</div>
        {importError !== null && (
          <div className={styles.ErrorMessage}>{importError.message}</div>
        )}
        <div className={styles.Buttons}>
          <Button autoFocus onClick={dismissModal}>
            Okay
          </Button>
        </div>
      </div>
    </div>
  );
}

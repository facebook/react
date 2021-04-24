/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useContext, useEffect, useState} from 'react';
import {unstable_batchedUpdates as batchedUpdates} from 'react-dom';
import {ModalDialogContext} from './ModalDialog';
import {StoreContext} from './context';
import Button from './Button';
import ButtonIcon from './ButtonIcon';
import {copy} from 'clipboard-js';
import styles from './UnsupportedBridgeProtocolDialog.css';

import type {BridgeProtocol} from 'react-devtools-shared/src/bridge';

type DAILOG_STATE = 'dialog-not-shown' | 'show-dialog' | 'dialog-shown';

const DEVTOOLS_VERSION = process.env.DEVTOOLS_VERSION;
const INSTRUCTIONS_FB_URL = 'https://fburl.com/devtools-bridge-protocol';

export default function UnsupportedBridgeProtocolDialog(_: {||}) {
  const {dispatch} = useContext(ModalDialogContext);
  const store = useContext(StoreContext);
  const [state, setState] = useState<DAILOG_STATE>('dialog-not-shown');

  useEffect(() => {
    if (state === 'dialog-not-shown') {
      const showDialog = () => {
        batchedUpdates(() => {
          setState('show-dialog');
          dispatch({
            canBeDismissed: false,
            type: 'SHOW',
            content: (
              <DialogContent
                unsupportedBridgeProtocol={store.unsupportedBridgeProtocol}
              />
            ),
          });
        });
      };

      if (store.unsupportedBridgeProtocol !== null) {
        showDialog();
      } else {
        store.addListener('unsupportedBridgeProtocolDetected', showDialog);
        return () => {
          store.removeListener('unsupportedBridgeProtocolDetected', showDialog);
        };
      }
    }
  }, [state, store]);

  return null;
}

function DialogContent({
  unsupportedBridgeProtocol,
}: {|
  unsupportedBridgeProtocol: BridgeProtocol,
|}) {
  const {version, minNpmVersion} = unsupportedBridgeProtocol;
  const upgradeInstructions = `npm i -g react-devtools@^${minNpmVersion}`;
  return (
    <Fragment>
      <div className={styles.Column}>
        <div className={styles.Title}>Unsupported DevTools backend version</div>
        <p className={styles.Paragraph}>
          You are running <code>react-devtools</code> version{' '}
          <span className={styles.Version}>{DEVTOOLS_VERSION}</span>.
        </p>
        <p className={styles.Paragraph}>
          This requires bridge protocol{' '}
          <span className={styles.Version}>version 0</span>. However the current
          backend version uses bridge protocol{' '}
          <span className={styles.Version}>version {version}</span>.
        </p>
        <p className={styles.Paragraph}>
          To fix this, upgrade the DevTools NPM package:
        </p>
        <pre className={styles.NpmCommand}>
          {upgradeInstructions}
          <Button
            onClick={() => copy(upgradeInstructions)}
            title="Copy upgrade command to clipboard">
            <ButtonIcon type="copy" />
          </Button>
        </pre>
        <p className={styles.Paragraph}>
          Or{' '}
          <a
            data-electron-external-link="true"
            className={styles.Link}
            href={INSTRUCTIONS_FB_URL}
            target="_blank">
            click here
          </a>{' '}
          for more information.
        </p>
      </div>
    </Fragment>
  );
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Fragment, useContext, useEffect} from 'react';
import {unstable_batchedUpdates as batchedUpdates} from 'react-dom';
import {useLocalStorage} from './hooks';
import {ModalDialogContext} from './ModalDialog';
import ReactLogo from './ReactLogo';
import {CHANGE_LOG_URL} from 'react-devtools-shared/src/constants';

import styles from './ShowWelcomeToTheNewDevToolsDialog.css';

const LOCAL_STORAGE_KEY =
  'React::DevTools::hasShownWelcomeToTheNewDevToolsDialog';

export default function ShowWelcomeToTheNewDevToolsDialog(_: {||}) {
  const {dispatch} = useContext(ModalDialogContext);
  const [
    hasShownWelcomeToTheNewDevToolsDialog,
    setHasShownWelcomeToTheNewDevToolsDialog,
  ] = useLocalStorage<boolean>(LOCAL_STORAGE_KEY, false);

  useEffect(
    () => {
      if (!hasShownWelcomeToTheNewDevToolsDialog) {
        batchedUpdates(() => {
          setHasShownWelcomeToTheNewDevToolsDialog(true);
          dispatch({
            canBeDismissed: true,
            type: 'SHOW',
            content: <DialogContent />,
          });
        });
      }
    },
    [
      dispatch,
      hasShownWelcomeToTheNewDevToolsDialog,
      setHasShownWelcomeToTheNewDevToolsDialog,
    ],
  );

  return null;
}

function DialogContent(_: {||}) {
  return (
    <Fragment>
      <div className={styles.Row}>
        <ReactLogo className={styles.Logo} />
        <div>
          <div className={styles.Title}>Welcome to the new React DevTools!</div>
          <div>
            <a
              className={styles.ReleaseNotesLink}
              target="_blank"
              rel="noopener noreferrer"
              href={CHANGE_LOG_URL}>
              Learn more
            </a>{' '}
            about changes in this version.
          </div>
        </div>
      </div>
    </Fragment>
  );
}

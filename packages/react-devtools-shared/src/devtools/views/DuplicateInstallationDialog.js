/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import * as React from 'react';
import {Fragment, useContext, useEffect} from 'react';
import {isInternalFacebookBuild} from 'react-devtools-feature-flags';
import {ModalDialogContext} from './ModalDialog';

export default function DuplicateInstallationDialog(_: {||}) {
  const {dispatch} = useContext(ModalDialogContext);

  useEffect(() => {
    dispatch({
      canBeDismissed: false,
      id: 'DuplicateInstallationDialog',
      type: 'SHOW',
      title: 'Duplicate Installations of DevTools Detected',
      content: <DialogContent />,
    });
  }, []);
  return null;
}

function DialogContent(_: {||}) {
  return (
    <Fragment>
      <p>
        We detected that there are multiple versions of React Developer Tools
        installed and enabled in your browser at the same time, which will cause
        issues while using the extension.
      </p>
      {isInternalFacebookBuild ? (
        <p>
          Before proceeding, please ensure that the only enabled version of
          React Developer Tools is the internal (Chef-installed) version. To
          manage your extensions, visit the <code>about://extensions</code> page
          in your browser.
        </p>
      ) : (
        <p>
          Please ensure that you have installed and enabled only a single
          version of React Developer Tools before proceeding. To manage your
          extensions, visit the <code>about://extensions</code> page in your
          browser.
        </p>
      )}
    </Fragment>
  );
}

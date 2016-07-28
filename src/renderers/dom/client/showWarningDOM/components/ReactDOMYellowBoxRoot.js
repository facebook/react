/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMYellowBoxRoot
 * @flow
 */
'use strict';

const React = require('React');

const ReactDOMYellowBoxDialogHeader = require('ReactDOMYellowBoxDialogHeader');
const ReactDOMYellowBoxDialogBody = require('ReactDOMYellowBoxDialogBody');

import type {Format, Instance, Milliseconds, InstanceInfo} from 'reactShowWarningDOM';

const styles = {
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
    zIndex: 2147483647,
  },
  dialogRoot: {
    position: 'absolute',
    height: '45%',
    width: '75%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    MozTransform: 'translate(-50%, -50%)',
    msTransform: 'translate(-50%, -50%)',
    WebkitTransform: 'translate(-50%, -50%)',
    padding: '15px 30px',
    pointerEvents: 'auto',
    overflowY: 'hidden',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.10)',
    borderRadius: '2px',
    boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.10)',
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: '15px',
  },
};

const ReactDOMYellowBoxRoot = ({data, onIgnoreAll, onSnoozeByType, onSnoozeByInstance}: {
  data: Array<InstanceInfo>,
  onIgnoreAll: () => void,
  onSnoozeByType: (format: Format) => (snoozeDuration: Milliseconds) => void,
  onSnoozeByInstance: (instance: Instance) => (snoozeDuration: Milliseconds) => void,
}) => (
  <div style={styles.root}>
    <div style={styles.dialogRoot}>
      <ReactDOMYellowBoxDialogHeader onIgnoreAll={onIgnoreAll} />
      <ReactDOMYellowBoxDialogBody
        data={data}
        onSnoozeByType={onSnoozeByType}
        onSnoozeByInstance={onSnoozeByInstance}
      />
    </div>
  </div>
);

module.exports = ReactDOMYellowBoxRoot;

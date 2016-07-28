/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMYellowBoxDialogBody
 * @flow
 */
'use strict';

const React = require('React');

const ReactDOMYellowBoxMessage = require('ReactDOMYellowBoxMessage');

import type {Format, Instance, Milliseconds, InstanceInfo} from 'reactShowWarningDOM';

const styles = {
  root: {
    height: '90%',
    overflowY: 'auto',
  },
};

const ReactDOMYellowBoxDialogBody = ({data, onSnoozeByType, onSnoozeByInstance}: {
  data: Array<InstanceInfo>,
  onSnoozeByType: (format: Format) => (snoozeDuration: Milliseconds) => void,
  onSnoozeByInstance: (instance: Instance) => (snoozeDuration: Milliseconds) => void,
}) => (
  <div style={styles.root}>
    {data.map(({instance, format}) =>
      <ReactDOMYellowBoxMessage
        key={instance}
        onSnoozeByType={onSnoozeByType(format)}
        onSnoozeByInstance={onSnoozeByInstance(instance)}
        instance={instance}
      />
    )}
  </div>
);

module.exports = ReactDOMYellowBoxDialogBody;

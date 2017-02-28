/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMYellowBoxMessage
 * @flow
 */
'use strict';

const React = require('React');

import type {Instance, Milliseconds} from 'reactShowWarningDOM';

const MS_FOR_10_MINS: Milliseconds = 10 * 60 * 1000;
const MS_FOR_24_HOURS: Milliseconds = 24 * 3600 * 1000;

const styles = {
  root: {
    fontSize: '13px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    padding: '20px 0px',
  },
  snoozeButtonContainer: {
    float: 'right',
  },
  snoozeSelect: {
    width: '70px',
  },
  messageContainer: {
    fontFamily: 'Menlo, Consolas, monospace',
    whiteSpace: 'pre-wrap',
  },
};

const ReactDOMYellowBoxMessage = ({onSnoozeByType, onSnoozeByInstance, instance}: {
  onSnoozeByType: (snoozeDuration: Milliseconds) => void,
  onSnoozeByInstance: (snoozeDuration: Milliseconds) => void,
  instance: Instance,
}) => {
  const onSelectChange = (evt: SyntheticEvent): void => {
    evt.preventDefault();

    if (!(evt.target instanceof HTMLSelectElement)) { // make flow happy
      return;
    }

    switch (evt.target.value) {
      case 'type-10-mins':
        onSnoozeByType(MS_FOR_10_MINS);
        break;
      case 'type-24-hrs':
        onSnoozeByType(MS_FOR_24_HOURS);
        break;
      case 'instance-10-mins':
        onSnoozeByInstance(MS_FOR_10_MINS);
        break;
      case 'instance-24-hrs':
        onSnoozeByInstance(MS_FOR_24_HOURS);
        break;
      default:
        break;
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.snoozeButtonContainer}>
        <select defaultValue="noop"
          style={styles.snoozeSelect}
          onChange={onSelectChange}
        >
          <option value="noop" disabled={true}>Snooze</option>
          <optgroup label="Snooze this warning instance for...">
            <option value="instance-10-mins">10 mins</option>
            <option value="instance-24-hrs">24 hours</option>
          </optgroup>
          <optgroup label="Snooze this type of warning for...">
            <option value="type-10-mins">10 minutes</option>
            <option value="type-24-hrs">24 hours</option>
          </optgroup>
        </select>
      </div>
      <div style={styles.messageContainer}>
        {instance}
      </div>
    </div>
  );
};

module.exports = ReactDOMYellowBoxMessage;

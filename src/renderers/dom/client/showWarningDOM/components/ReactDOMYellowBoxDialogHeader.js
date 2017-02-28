/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMYellowBoxDialogHeader
 * @flow
 */
'use strict';

const React = require('React');

const styles = {
  root: {
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.10)',
  },
  closeButton: {
    color: 'inherit',
    textDecoration: 'none',
  },
  closeButtonContainer: {
    float: 'right',
  },
};

const ReactDOMYellowBoxDialogHeader = ({onIgnoreAll}: {
  onIgnoreAll: () => void,
}) => {
  const onClick = (evt) => {
    evt.preventDefault();
    onIgnoreAll();
  };

  return (
    <div style={styles.root}>
      <div style={styles.closeButtonContainer}>
        <a
          style={styles.closeButton}
          href="#"
          onClick={onClick}
        >
          &#10005;
        </a>
      </div>
      React Warnings
    </div>
  );
};

module.exports = ReactDOMYellowBoxDialogHeader;

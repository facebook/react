/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule checkReact
 * @flow
 */

var React = require('react');
var invariant = require('fbjs/lib/invariant');

invariant(
  React,
  'ReactDOM was loaded before React. Make sure you load ' +
    'the React package before loading ReactDOM.',
);

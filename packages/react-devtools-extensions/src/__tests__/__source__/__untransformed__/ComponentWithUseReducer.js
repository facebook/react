/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const React = require('react');
const {useReducer} = React;

function Component(props) {
  const [foo] = useReducer(true);
  const [bar] = useReducer(true);
  const [baz] = React.useReducer(true);
  return `${foo}-${bar}-${baz}`;
}

module.exports = {Component};
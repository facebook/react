/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const {useDebugValue} = require('react');

function Component(props) {
  useCustomHookOne();
  const [bar] = useCustomHookTwo();
  return bar;
}

function useCustomHookOne() {
  // DebugValue hook should not appear in log.
  useDebugValue('example');
}

function useCustomHookTwo() {
  // DebugValue hook should not appear in log.
  useDebugValue('example');
  return [true];
}

module.exports = {Component};
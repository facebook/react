/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const {useDebugValue, useState} = require('react');

function Component(props) {
  const foo = useCustomHookOne();
  // This cae is ignored;
  // the meaning of a tuple assignment for a custom hook is unclear.
  const [bar] = useCustomHookTwo();
  return `${foo}-${bar}`;
}

function useCustomHookOne() {
  // DebugValue hook should not appear in log.
  useDebugValue('example');
  return true;
}

function useCustomHookTwo() {
  const [baz, setBaz] = useState(true);
  return [baz, setBaz];
}

module.exports = {Component};
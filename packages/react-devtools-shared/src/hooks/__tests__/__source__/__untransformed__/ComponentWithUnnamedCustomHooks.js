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
  const {foo} = useCustomHookThree();
  return `${bar}-${foo}`;
}

function useCustomHookOne() {
  // DebugValue hook should not appear in log.
  useDebugValue('example1');
}

function useCustomHookTwo() {
  // DebugValue hook should not appear in log.
  useDebugValue('example2');
  return [true];
}

function useCustomHookThree() {
  useDebugValue('example3');
  return {foo: true};
}

module.exports = {Component};

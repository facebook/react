/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const {useEffect} = require('react');

function useCustom() {
  useEffect(() => {
    // ...
  }, []);
}

module.exports = {useCustom};
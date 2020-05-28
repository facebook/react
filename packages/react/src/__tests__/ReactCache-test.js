/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactCache', () => {
  let ReactCache;

  beforeEach(() => {
    if (__EXPERIMENTAL__) {
      ReactCache = require('react/unstable-cache');
    }
  });

  // TODO: test something useful.
  // @gate experimental
  it('exports something', () => {
    expect(ReactCache.readCache).not.toBe(undefined);
  });
});

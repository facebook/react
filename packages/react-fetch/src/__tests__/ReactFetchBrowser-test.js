/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactFetchBrowser', () => {
  let ReactFetchBrowser;

  beforeEach(() => {
    if (__EXPERIMENTAL__) {
      ReactFetchBrowser = require('react-fetch');
    }
  });

  // TODO: test something useful.
  // @gate experimental
  it('exports something', () => {
    expect(ReactFetchBrowser.fetch).not.toBe(undefined);
  });
});

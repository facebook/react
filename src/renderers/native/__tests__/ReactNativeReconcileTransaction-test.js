/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

var ReactNativeReconcileTransaction;

describe('ReactNativeReconcileTransaction', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactNativeReconcileTransaction = require('ReactNativeReconcileTransaction');
  });

  it.only('instantiate correctly', () => {
    const transaction = new ReactNativeReconcileTransaction();

    expect(transaction.getTransactionWrappers().length).toEqual(2);
    expect(transaction.getReactMountReady()).toEqual({
      _callbacks: null,
      _contexts: null,
      _arg: undefined,
    });
  });
});

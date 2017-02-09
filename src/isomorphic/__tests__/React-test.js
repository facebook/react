/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('React', () => {

  var React;

  beforeEach(() => {
    React = require('React');
  });

  it('should log a deprecation warning once when using React.__spread', () => {
    spyOn(console, 'error');
    React.__spread({});
    React.__spread({});
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.__spread is deprecated and should not be used'
    );
  });

  it('should log a deprecation warning once when using React.createMixin', () => {
    spyOn(console, 'error');
    React.createMixin();
    React.createMixin();
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.createMixin is deprecated and should not be used'
    );
  });

});

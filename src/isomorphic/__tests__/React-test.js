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
    spyOn(console, 'warn');
    React.__spread({});
    React.__spread({});
    expect(console.warn.calls.count()).toBe(1);
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      'React.__spread is deprecated and should not be used',
    );
  });

  it('should log a deprecation warning once when using React.createMixin', () => {
    spyOn(console, 'warn');
    React.createMixin();
    React.createMixin();
    expect(console.warn.calls.count()).toBe(1);
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      'React.createMixin is deprecated and should not be used',
    );
  });
});

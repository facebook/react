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

  it('should warn once when attempting to access React.createClass', () => {
    spyOn(console, 'warn');
    let createClass = React.createClass;
    createClass = React.createClass;
    expect(createClass).not.toBe(undefined);
    expect(console.warn.calls.count()).toBe(1);
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      'Warning: Accessing createClass via the main React package is ' +
        'deprecated, and will be removed in React v16.0. ' +
        "Use a plain JavaScript class instead. If you're not yet ready " +
        'to migrate, create-react-class v15.* is available on npm as ' +
        'a temporary, drop-in replacement. ' +
        'For more info see https://fb.me/react-create-class',
    );
  });

  it('should warn once when attempting to access React.PropTypes', () => {
    spyOn(console, 'warn');
    let PropTypes = React.PropTypes;
    PropTypes = React.PropTypes;
    expect(PropTypes).not.toBe(undefined);
    expect(console.warn.calls.count()).toBe(1);
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      'Warning: Accessing PropTypes via the main React package is ' +
        'deprecated, and will be removed in  React v16.0. ' +
        'Use the latest available v15.* prop-types package from ' +
        'npm instead. For info on usage, compatibility, migration ' +
        'and more, see https://fb.me/prop-types-docs',
    );
  });
});

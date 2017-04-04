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


describe('prop-types', () => {
  it('index', () => {
    var PropTypes = require('./');
    var checkPropTypes = PropTypes.checkPropTypes;

    spyOn(console, 'error');
    checkPropTypes({ foo: PropTypes.string }, { foo: '123' }, 'prop', 'Test1');
    expect(console.error.calls.count()).toBe(0);
    checkPropTypes({ foo: PropTypes.string }, { foo: 123 }, 'prop', 'Test1');
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Failed prop type: Invalid prop `foo` of type `number` ' +
      'supplied to `Test1`, expected `string`.'
    );
  });

  it('factory', () => {
    var React = require('react');
    var factory = require('./factory');
    var PropTypes = factory(React.isValidElement);
    var checkPropTypes = PropTypes.checkPropTypes;

    spyOn(console, 'error');
    checkPropTypes({ foo: PropTypes.string }, { foo: '123' }, 'prop', 'Test2');
    expect(console.error.calls.count()).toBe(0);
    checkPropTypes({ foo: PropTypes.string }, { foo: 123 }, 'prop', 'Test2');
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Failed prop type: Invalid prop `foo` of type `number` ' +
      'supplied to `Test2`, expected `string`.'
    );
  });
});

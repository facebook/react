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

describe('ReactTestUtils', function() {
  let React;

  beforeEach(function() {
    spyOn(console, 'error');
    React = require('react');
  });

  it('should warn on include', function() {
    expect(console.error).toHaveBeenCalledWith(
      'Warning: ReactTestUtils has been moved to react-dom/test-utils. ' +
        'Update references to remove this warning.'
    );
  });

  it('should pass a basic smoke test', function() {
    const ReactTestUtils = require('./index');
    const onClick = jest.fn();

    class MyComponent extends React.Component {
      constructor(props, context) {
        super(props, context);
        this.state = {bar: 123};
      }
      render() {
        return <div onClick={onClick}>{this.props.baz}</div>;
      }
    }

    const instance = ReactTestUtils.renderIntoDocument(
      <MyComponent baz="abc" />
    );

    expect(instance.state.bar).toBe(123);
    expect(instance.props.baz).toBe('abc');

    const div = ReactTestUtils.findRenderedDOMComponentWithTag(instance, 'div');
    expect(div.textContent).toBe('abc');

    expect(onClick).not.toHaveBeenCalled();
    ReactTestUtils.Simulate.click(div);
    expect(onClick).toHaveBeenCalled();
  });
});

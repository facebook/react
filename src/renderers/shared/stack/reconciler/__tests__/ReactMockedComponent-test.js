/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactTestUtils;

var AutoMockedComponent;
var MockedComponent;

describe('ReactMockedComponent', () => {
  beforeEach(() => {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    AutoMockedComponent = jest.genMockFromModule(
      'ReactMockedComponentTestComponent',
    );
    MockedComponent = jest.genMockFromModule(
      'ReactMockedComponentTestComponent',
    );

    ReactTestUtils.mockComponent(MockedComponent);
  });

  it('should allow an implicitly mocked component to be rendered without warnings', () => {
    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(<AutoMockedComponent />);
    expect(console.error.calls.count()).toBe(0);
  });

  it('should allow an implicitly mocked component to be updated', () => {
    class Wrapper extends React.Component {
      state = {foo: 1};

      update = () => {
        this.setState({foo: 2});
      };

      render() {
        return <div><AutoMockedComponent prop={this.state.foo} /></div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);

    var found = ReactTestUtils.findRenderedComponentWithType(
      instance,
      AutoMockedComponent,
    );
    expect(typeof found).toBe('object');

    instance.update();
  });

  it('has custom methods on the implicitly mocked component', () => {
    var instance = ReactTestUtils.renderIntoDocument(<AutoMockedComponent />);
    expect(typeof instance.hasCustomMethod).toBe('function');
  });

  it('should allow an explicitly mocked component to be rendered', () => {
    ReactTestUtils.renderIntoDocument(<MockedComponent />);
  });

  it('should allow an explicitly mocked component to be updated', () => {
    class Wrapper extends React.Component {
      state = {foo: 1};

      update = () => {
        this.setState({foo: 2});
      };

      render() {
        return <div><MockedComponent prop={this.state.foo} /></div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);

    var found = ReactTestUtils.findRenderedComponentWithType(
      instance,
      MockedComponent,
    );
    expect(typeof found).toBe('object');

    instance.update();
  });

  it('has custom methods on the explicitly mocked component', () => {
    var instance = ReactTestUtils.renderIntoDocument(<MockedComponent />);
    expect(typeof instance.hasCustomMethod).toBe('function');
  });
});

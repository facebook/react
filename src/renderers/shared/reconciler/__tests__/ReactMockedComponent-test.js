/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactTestUtils;

var mocks;

var OriginalComponent;
var AutoMockedComponent;
var MockedComponent;

describe('ReactMockedComponent', function() {

  beforeEach(function() {
    mocks = require('mocks');

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    OriginalComponent = React.createClass({
      getDefaultProps: function() {
        return {bar: 'baz'};
      },

      getInitialState: function() {
        return {foo: 'bar'};
      },

      hasCustomMethod: function() {
        return true;
      },

      render: function() {
        return <span />;
      },

    });

    var metaData = mocks.getMetadata(OriginalComponent);

    AutoMockedComponent = mocks.generateFromMetadata(metaData);
    MockedComponent = mocks.generateFromMetadata(metaData);

    ReactTestUtils.mockComponent(MockedComponent);
  });

  it('should allow an implicitly mocked component to be rendered without warnings', () => {
    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(<AutoMockedComponent />);
    expect(console.error.calls.length).toBe(0);
  });

  it('should allow an implicitly mocked component to be updated', () => {
    var Wrapper = React.createClass({

      getInitialState: function() {
        return {foo: 1};
      },

      update: function() {
        this.setState({foo: 2});
      },

      render: function() {
        return <div><AutoMockedComponent prop={this.state.foo} /></div>;
      },

    });

    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);

    var found = ReactTestUtils.findRenderedComponentWithType(
      instance,
      AutoMockedComponent
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
    var Wrapper = React.createClass({

      getInitialState: function() {
        return {foo: 1};
      },

      update: function() {
        this.setState({foo: 2});
      },

      render: function() {
        return <div><MockedComponent prop={this.state.foo} /></div>;
      },

    });
    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);

    var found = ReactTestUtils.findRenderedComponentWithType(
      instance,
      MockedComponent
    );
    expect(typeof found).toBe('object');

    instance.update();
  });

  it('has custom methods on the explicitly mocked component', () => {
    var instance = ReactTestUtils.renderIntoDocument(<MockedComponent />);
    expect(typeof instance.hasCustomMethod).toBe('function');
  });

});

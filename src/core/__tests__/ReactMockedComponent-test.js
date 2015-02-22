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
      }

    });

    var metaData = mocks.getMetadata(OriginalComponent);

    AutoMockedComponent = mocks.generateFromMetadata(metaData);
    MockedComponent = mocks.generateFromMetadata(metaData);

    ReactTestUtils.mockComponent(MockedComponent);
  });

  it('should allow an implicitly mocked component to be rendered without warnings', () => {
    spyOn(console, 'warn');
    ReactTestUtils.renderIntoDocument(<AutoMockedComponent />);
    expect(console.warn.calls.length).toBe(0);
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
        return <AutoMockedComponent prop={this.state.foo} />;
      }

    });
    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);
    instance.update();
  });

  it('should find an implicitly mocked component in the tree', function() {
    var instance = ReactTestUtils.renderIntoDocument(
      <div><span><AutoMockedComponent prop="1" /></span></div>
    );
    var found = ReactTestUtils.findRenderedComponentWithType(
      instance,
      AutoMockedComponent
    );
    expect(typeof found).toBe('object');
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
        return <MockedComponent prop={this.state.foo} />;
      }

    });
    var instance = ReactTestUtils.renderIntoDocument(<Wrapper />);
    instance.update();
  });

  it('should find an explicitly mocked component in the tree', function() {
    var instance = ReactTestUtils.renderIntoDocument(
      <div><span><MockedComponent prop="1" /></span></div>
    );
    var found = ReactTestUtils.findRenderedComponentWithType(
      instance,
      MockedComponent
    );
    expect(typeof found).toBe('object');
  });

  it('has custom methods on the explicitly mocked component', () => {
    var instance = ReactTestUtils.renderIntoDocument(<MockedComponent />);
    expect(typeof instance.hasCustomMethod).toBe('function');
  });

});

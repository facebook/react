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

var mocks = require('mocks');

describe('ReactMultiChild', function() {
  var React;

  var ReactDOM;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    React = require('React');
    ReactDOM = require('ReactDOM');
  });

  describe('reconciliation', function() {
    it('should update children when possible', function() {
      var container = document.createElement('div');

      var mockMount = mocks.getMockFunction();
      var mockUpdate = mocks.getMockFunction();
      var mockUnmount = mocks.getMockFunction();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentDidUpdate: mockUpdate,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUpdate.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUpdate.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUpdate.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);
    });

    it('should replace children with different constructors', function() {
      var container = document.createElement('div');

      var mockMount = mocks.getMockFunction();
      var mockUnmount = mocks.getMockFunction();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><span /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(1);
    });

    it('should NOT replace children with different owners', function() {
      var container = document.createElement('div');

      var mockMount = mocks.getMockFunction();
      var mockUnmount = mocks.getMockFunction();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      var WrapperComponent = React.createClass({
        render: function() {
          return this.props.children || <MockComponent />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<WrapperComponent />, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(
        <WrapperComponent><MockComponent /></WrapperComponent>,
        container
      );

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);
    });

    it('should replace children with different keys', function() {
      var container = document.createElement('div');

      var mockMount = mocks.getMockFunction();
      var mockUnmount = mocks.getMockFunction();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent key="A" /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent key="B" /></div>, container);

      expect(mockMount.mock.calls.length).toBe(2);
      expect(mockUnmount.mock.calls.length).toBe(1);
    });
  });

  describe('innerHTML', function() {
    var setInnerHTML;

    // Only run this suite if `Element.prototype.innerHTML` can be spied on.
    var innerHTMLDescriptor = Object.getOwnPropertyDescriptor(
      Element.prototype,
      'innerHTML'
    );
    if (!innerHTMLDescriptor) {
      return;
    }

    beforeEach(function() {
      var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
      ReactDOMFeatureFlags.useCreateElement = false;

      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: setInnerHTML = jasmine.createSpy().andCallFake(
          innerHTMLDescriptor.set
        ),
      });
    });

    it('should only set `innerHTML` once on update', function() {
      var container = document.createElement('div');

      ReactDOM.render(
        <div>
          <p><span /></p>
          <p><span /></p>
          <p><span /></p>
        </div>,
        container
      );
      // Warm the cache used by `getMarkupWrap`.
      ReactDOM.render(
        <div>
          <p><span /><span /></p>
          <p><span /><span /></p>
          <p><span /><span /></p>
        </div>,
        container
      );
      expect(setInnerHTML).toHaveBeenCalled();
      var callCountOnMount = setInnerHTML.calls.length;

      ReactDOM.render(
        <div>
          <p><span /><span /><span /></p>
          <p><span /><span /><span /></p>
          <p><span /><span /><span /></p>
        </div>,
        container
      );
      expect(setInnerHTML.calls.length).toBe(callCountOnMount + 1);
    });
  });
});

/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

var mocks = require('mocks');

describe('ReactDOMComponent', function() {

  describe('updateDOM', function() {
    var React;
    var ReactTestUtils;
    var transaction;

    beforeEach(function() {
      React = require('React');
      ReactTestUtils = require('ReactTestUtils');

      var ReactReconcileTransaction = require('ReactReconcileTransaction');
      transaction = new ReactReconcileTransaction();
    });

    it("should handle className", function() {
      var stub = ReactTestUtils.renderIntoDocument(<div style={{}} />);

      stub.receiveComponent({props: { className: 'foo' }}, transaction);
      expect(stub.getDOMNode().className).toEqual('foo');
      stub.receiveComponent({props: { className: 'bar' }}, transaction);
      expect(stub.getDOMNode().className).toEqual('bar');
      stub.receiveComponent({props: { className: null }}, transaction);
      expect(stub.getDOMNode().className).toEqual('');
    });

    it("should gracefully handle various style value types", function() {
      var stub = ReactTestUtils.renderIntoDocument(<div style={{}} />);
      var stubStyle = stub.getDOMNode().style;

      // set initial style
      var setup = { display: 'block', left: '1', top: 2, fontFamily: 'Arial' };
      stub.receiveComponent({props: { style: setup }}, transaction);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.left).toEqual('1px');
      expect(stubStyle.fontFamily).toEqual('Arial');

      // reset the style to their default state
      var reset = { display: '', left: null, top: false, fontFamily: true };
      stub.receiveComponent({props: { style: reset }}, transaction);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.left).toEqual('');
      expect(stubStyle.top).toEqual('');
      expect(stubStyle.fontFamily).toEqual('');
    });

    it("should update styles when mutating style object", function() {
      var styles = { display: 'none', fontFamily: 'Arial', lineHeight: 1.2 };
      var stub = ReactTestUtils.renderIntoDocument(<div style={styles} />);

      var stubStyle = stub.getDOMNode().style;
      stubStyle.display = styles.display;
      stubStyle.fontFamily = styles.fontFamily;

      styles.display = 'block';

      stub.receiveComponent({props: { style: styles }}, transaction);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.fontFamily).toEqual('Arial');
      expect(stubStyle.lineHeight).toEqual('1.2');

      styles.fontFamily = 'Helvetica';

      stub.receiveComponent({props: { style: styles }}, transaction);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.fontFamily).toEqual('Helvetica');
      expect(stubStyle.lineHeight).toEqual('1.2');

      styles.lineHeight = 0.5;

      stub.receiveComponent({props: { style: styles }}, transaction);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.fontFamily).toEqual('Helvetica');
      expect(stubStyle.lineHeight).toEqual('0.5');

      stub.receiveComponent({props: { style: undefined }}, transaction);
      expect(stubStyle.display).toBe('');
      expect(stubStyle.fontFamily).toBe('');
      expect(stubStyle.lineHeight).toBe('');
    });

    it("should update styles if initially null", function() {
      var styles = null;
      var stub = ReactTestUtils.renderIntoDocument(<div style={styles} />);

      var stubStyle = stub.getDOMNode().style;

      styles = {display: 'block'};

      stub.receiveComponent({props: { style: styles }}, transaction);
      expect(stubStyle.display).toEqual('block');
    });

    it("should remove attributes", function() {
      var stub = ReactTestUtils.renderIntoDocument(<img height='17' />);

      expect(stub.getDOMNode().hasAttribute('height')).toBe(true);
      stub.receiveComponent({props: {}}, transaction);
      expect(stub.getDOMNode().hasAttribute('height')).toBe(false);
    });

    it("should remove properties", function() {
      var stub = ReactTestUtils.renderIntoDocument(<div className='monkey' />);

      expect(stub.getDOMNode().className).toEqual('monkey');
      stub.receiveComponent({props: {}}, transaction);
      expect(stub.getDOMNode().className).toEqual('');
    });

    it("should clear a single style prop when changing 'style'", function() {
      var styles = {display: 'none', color: 'red'};
      var stub = ReactTestUtils.renderIntoDocument(<div style={styles} />);

      var stubStyle = stub.getDOMNode().style;

      styles = {color: 'green'};
      stub.receiveComponent({props: { style: styles }}, transaction);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('green');
    });

    it("should clear all the styles when removing 'style'", function() {
      var styles = {display: 'none', color: 'red'};
      var stub = ReactTestUtils.renderIntoDocument(<div style={styles} />);

      var stubStyle = stub.getDOMNode().style;

      stub.receiveComponent({props: {}}, transaction);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('');
    });

    it("should empty element when removing innerHTML", function() {
      var stub = ReactTestUtils.renderIntoDocument(
        <div dangerouslySetInnerHTML={{__html: ':)'}} />
      );

      expect(stub.getDOMNode().innerHTML).toEqual(':)');
      stub.receiveComponent({props: {}}, transaction);
      expect(stub.getDOMNode().innerHTML).toEqual('');
    });

    it("should transition from string content to innerHTML", function() {
      var stub = ReactTestUtils.renderIntoDocument(
        <div>hello</div>
      );

      expect(stub.getDOMNode().innerHTML).toEqual('hello');
      stub.receiveComponent(
        {props: {dangerouslySetInnerHTML: {__html: 'goodbye'}}},
        transaction
      );
      expect(stub.getDOMNode().innerHTML).toEqual('goodbye');
    });

    it("should transition from innerHTML to string content", function() {
      var stub = ReactTestUtils.renderIntoDocument(
        <div dangerouslySetInnerHTML={{__html: 'bonjour'}} />
      );

      expect(stub.getDOMNode().innerHTML).toEqual('bonjour');
      stub.receiveComponent({props: {children: 'adieu'}}, transaction);
      expect(stub.getDOMNode().innerHTML).toEqual('adieu');
    });

    it("should not incur unnecessary DOM mutations", function() {
      var stub = ReactTestUtils.renderIntoDocument(<div value="" />);

      var node = stub.getDOMNode();
      var nodeValue = ''; // node.value always returns undefined
      var nodeValueSetter = mocks.getMockFunction();
      Object.defineProperty(node, 'value', {
        get: function() {
          return nodeValue;
        },
        set: nodeValueSetter.mockImplementation(function(newValue) {
          nodeValue = newValue;
        })
      });

      stub.receiveComponent({props: {value: ''}}, transaction);
      expect(nodeValueSetter.mock.calls.length).toBe(0);

      stub.receiveComponent({props: {}}, transaction);
      expect(nodeValueSetter.mock.calls.length).toBe(1);
    });
  });

  describe('createOpenTagMarkup', function() {
    var genMarkup;

    function quoteRegexp(str) {
      return (str+'').replace(/([.?*+\^$\[\]\\(){}|-])/g, "\\$1");
    }

    beforeEach(function() {
      require('mock-modules').dumpCache();

      var ReactDefaultInjection = require('ReactDefaultInjection');
      ReactDefaultInjection.inject();

      var mixInto = require('mixInto');
      var ReactDOMComponent = require('ReactDOMComponent');
      var ReactReconcileTransaction = require('ReactReconcileTransaction');

      var NodeStub = function(initialProps) {
        this.props = initialProps || {};
        this._rootNodeID = 'test';
      };
      mixInto(NodeStub, ReactDOMComponent.Mixin);

      genMarkup = function(props) {
        var transaction = new ReactReconcileTransaction();
        return (new NodeStub(props))._createOpenTagMarkupAndPutListeners(
          transaction
        );
      };

      this.addMatchers({
        toHaveAttribute: function(attr, value) {
          var expected = '(?:^|\\s)' + attr + '=[\\\'"]';
          if (typeof value != 'undefined') {
            expected += quoteRegexp(value) + '[\\\'"]';
          }
          return this.actual.match(new RegExp(expected));
        }
      });
    });

    it("should generate the correct markup with className", function() {
      expect(genMarkup({ className: 'a' })).toHaveAttribute('class', 'a');
      expect(genMarkup({ className: 'a b' })).toHaveAttribute('class', 'a b');
      expect(genMarkup({ className: '' })).toHaveAttribute('class', '');
    });

    it("should escape style names and values", function() {
      expect(genMarkup({
        style: {'b&ckground': '<3'}
      })).toHaveAttribute('style', 'b&amp;ckground:&lt;3;');
    });
  });

  describe('createContentMarkup', function() {
    var genMarkup;

    function quoteRegexp(str) {
      return (str+'').replace(/([.?*+\^$\[\]\\(){}|-])/g, "\\$1");
    }

    beforeEach(function() {
      require('mock-modules').dumpCache();

      var mixInto = require('mixInto');
      var ReactDOMComponent = require('ReactDOMComponent');
      var ReactReconcileTransaction = require('ReactReconcileTransaction');

      var NodeStub = function(initialProps) {
        this.props = initialProps || {};
        this._rootNodeID = 'test';
      };
      mixInto(NodeStub, ReactDOMComponent.Mixin);

      genMarkup = function(props) {
        var transaction = new ReactReconcileTransaction();
        return (new NodeStub(props))._createContentMarkup(transaction);
      };

      this.addMatchers({
        toHaveInnerhtml: function(html) {
          var expected = '^' + quoteRegexp(html) + '$';
          return this.actual.match(new RegExp(expected));
        }
      });
    });

    it("should handle dangerouslySetInnerHTML", function() {
      var innerHTML = {__html: 'testContent'};
      expect(
        genMarkup({ dangerouslySetInnerHTML: innerHTML })
      ).toHaveInnerhtml('testContent');
    });
  });

  describe('mountComponent', function() {
    var mountComponent;

    beforeEach(function() {
      require('mock-modules').dumpCache();

      var mixInto = require('mixInto');
      var ReactComponent = require('ReactComponent');
      var ReactMultiChild = require('ReactMultiChild');
      var ReactDOMComponent = require('ReactDOMComponent');
      var ReactReconcileTransaction = require('ReactReconcileTransaction');

      var StubNativeComponent = function(descriptor) {
        ReactComponent.Mixin.construct.call(this, descriptor);
      };
      mixInto(StubNativeComponent, ReactComponent.Mixin);
      mixInto(StubNativeComponent, ReactDOMComponent.Mixin);
      mixInto(StubNativeComponent, ReactMultiChild.Mixin);

      mountComponent = function(props) {
        var transaction = new ReactReconcileTransaction();
        var stubComponent = new StubNativeComponent({
          type: StubNativeComponent,
          props: props,
          _owner: null,
          _context: null
        });
        return stubComponent.mountComponent('test', transaction, 0);
      };
    });

    it("should validate against multiple children props", function() {
      expect(function() {
        mountComponent({ children: '', dangerouslySetInnerHTML: '' });
      }).toThrow(
        'Invariant Violation: Can only set one of `children` or ' +
        '`props.dangerouslySetInnerHTML`.'
      );
    });

    it("should validate against invalid styles", function() {
      expect(function() {
        mountComponent({ style: 'display: none' });
      }).toThrow(
        'Invariant Violation: The `style` prop expects a mapping from style ' +
        'properties to values, not a string.'
      );
    });
  });

  describe('updateComponent', function() {
    var React;
    var container;

    beforeEach(function() {
      React = require('React');
      container = document.createElement('div');
    });

    it("should validate against multiple children props", function() {
      React.renderComponent(<div></div>, container);

      expect(function() {
        React.renderComponent(
          <div children="" dangerouslySetInnerHTML={{__html: ''}}></div>,
          container
        );
      }).toThrow(
        'Invariant Violation: Can only set one of `children` or ' +
        '`props.dangerouslySetInnerHTML`.'
      );
    });

    it("should validate against invalid styles", function() {
      React.renderComponent(<div></div>, container);

      expect(function() {
        React.renderComponent(<div style={1}></div>, container);
      }).toThrow(
        'Invariant Violation: The `style` prop expects a mapping from style ' +
        'properties to values, not a string.'
      );
    });
  });

  describe('unmountComponent', function() {
    it("should clean up listeners", function() {
      var React = require('React');
      var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
      var ReactMount = require('ReactMount');

      var container = document.createElement('div');
      document.documentElement.appendChild(container);

      var callback = function() {};
      var instance = <div onClick={callback} />;
      instance = React.renderComponent(instance, container);

      var rootNode = instance.getDOMNode();
      var rootNodeID = ReactMount.getID(rootNode);
      expect(
        ReactBrowserEventEmitter.getListener(rootNodeID, 'onClick')
      ).toBe(callback);

      React.unmountComponentAtNode(container);

      expect(
        ReactBrowserEventEmitter.getListener(rootNodeID, 'onClick')
      ).toBe(undefined);
    });
  });

});

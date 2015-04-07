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

/*jslint evil: true */

'use strict';

var assign = require('Object.assign');
var mocks = require('mocks');

describe('ReactDOMComponent', function() {

  describe('updateDOM', function() {
    var React;
    var ReactTestUtils;

    beforeEach(function() {
      React = require('React');
      ReactTestUtils = require('ReactTestUtils');
    });

    it("should handle className", function() {
      var container = document.createElement('div');
      React.render(<div style={{}} />, container);

      React.render(<div className={'foo'} />, container);
      expect(container.firstChild.className).toEqual('foo');
      React.render(<div className={'bar'} />, container);
      expect(container.firstChild.className).toEqual('bar');
      React.render(<div className={null} />, container);
      expect(container.firstChild.className).toEqual('');
    });

    it("should gracefully handle various style value types", function() {
      var container = document.createElement('div');
      React.render(<div style={{}} />, container);
      var stubStyle = container.firstChild.style;

      // set initial style
      var setup = {display: 'block', left: '1', top: 2, fontFamily: 'Arial'};
      React.render(<div style={setup} />, container);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.left).toEqual('1px');
      expect(stubStyle.fontFamily).toEqual('Arial');

      // reset the style to their default state
      var reset = {display: '', left: null, top: false, fontFamily: true};
      React.render(<div style={reset} />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.left).toEqual('');
      expect(stubStyle.top).toEqual('');
      expect(stubStyle.fontFamily).toEqual('');
    });

    it("should update styles when mutating style object", function() {
      var styles = {display: 'none', fontFamily: 'Arial', lineHeight: 1.2};
      var container = document.createElement('div');
      React.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;
      stubStyle.display = styles.display;
      stubStyle.fontFamily = styles.fontFamily;

      styles.display = 'block';

      React.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.fontFamily).toEqual('Arial');
      expect(stubStyle.lineHeight).toEqual('1.2');

      styles.fontFamily = 'Helvetica';

      React.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.fontFamily).toEqual('Helvetica');
      expect(stubStyle.lineHeight).toEqual('1.2');

      styles.lineHeight = 0.5;

      React.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.fontFamily).toEqual('Helvetica');
      expect(stubStyle.lineHeight).toEqual('0.5');

      React.render(<div style={undefined} />, container);
      expect(stubStyle.display).toBe('');
      expect(stubStyle.fontFamily).toBe('');
      expect(stubStyle.lineHeight).toBe('');
    });

    it("should update styles if initially null", function() {
      var styles = null;
      var container = document.createElement('div');
      React.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;

      styles = {display: 'block'};

      React.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
    });

    it("should update styles if updated to null multiple times", function() {
      var styles = null;
      var container = document.createElement('div');
      React.render(<div style={styles} />, container);

      styles = {display: 'block'};
      var stubStyle = container.firstChild.style;

      React.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');

      React.render(<div style={null} />, container);
      expect(stubStyle.display).toEqual('');

      React.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');

      React.render(<div style={null} />, container);
      expect(stubStyle.display).toEqual('');
    });

    it("should remove attributes", function() {
      var container = document.createElement('div');
      React.render(<img height='17' />, container);

      expect(container.firstChild.hasAttribute('height')).toBe(true);
      React.render(<img />, container);
      expect(container.firstChild.hasAttribute('height')).toBe(false);
    });

    it("should remove properties", function() {
      var container = document.createElement('div');
      React.render(<div className='monkey' />, container);

      expect(container.firstChild.className).toEqual('monkey');
      React.render(<div />, container);
      expect(container.firstChild.className).toEqual('');
    });

    it("should clear a single style prop when changing 'style'", function() {
      var styles = {display: 'none', color: 'red'};
      var container = document.createElement('div');
      React.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;

      styles = {color: 'green'};
      React.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('green');
    });

    it("should clear all the styles when removing 'style'", function() {
      var styles = {display: 'none', color: 'red'};
      var container = document.createElement('div');
      React.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;

      React.render(<div />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('');
    });

    it("should update styles when 'style' changes from null to object", function() {
      var container = document.createElement('div');
      var styles = {color: 'red'};
      React.render(<div style={styles} />, container);
      React.render(<div />, container);
      React.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;
      expect(stubStyle.color).toEqual('red');
    });

    it("should empty element when removing innerHTML", function() {
      var container = document.createElement('div');
      React.render(<div dangerouslySetInnerHTML={{__html: ':)'}} />, container);

      expect(container.firstChild.innerHTML).toEqual(':)');
      React.render(<div />, container);
      expect(container.firstChild.innerHTML).toEqual('');
    });

    it("should transition from string content to innerHTML", function() {
      var container = document.createElement('div');
      React.render(<div>hello</div>, container);

      expect(container.firstChild.innerHTML).toEqual('hello');
      React.render(
        <div dangerouslySetInnerHTML={{__html: 'goodbye'}} />,
        container
      );
      expect(container.firstChild.innerHTML).toEqual('goodbye');
    });

    it("should transition from innerHTML to string content", function() {
      var container = document.createElement('div');
      React.render(
        <div dangerouslySetInnerHTML={{__html: 'bonjour'}} />,
        container
      );

      expect(container.firstChild.innerHTML).toEqual('bonjour');
      React.render(<div>adieu</div>, container);
      expect(container.firstChild.innerHTML).toEqual('adieu');
    });

    it("should not incur unnecessary DOM mutations", function() {
      var container = document.createElement('div');
      React.render(<div value="" />, container);

      var node = container.firstChild;
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

      React.render(<div value="" />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(0);

      React.render(<div />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(1);
    });
  });

  describe('createOpenTagMarkup', function() {
    var genMarkup;

    function quoteRegexp(str) {
      return (str + '').replace(/([.?*+\^$\[\]\\(){}|-])/g, "\\$1");
    }

    beforeEach(function() {
      require('mock-modules').dumpCache();

      var ReactDefaultInjection = require('ReactDefaultInjection');
      ReactDefaultInjection.inject();

      var ReactDOMComponent = require('ReactDOMComponent');
      var ReactReconcileTransaction = require('ReactReconcileTransaction');

      var NodeStub = function(initialProps) {
        this._currentElement = {props: initialProps};
        this._rootNodeID = 'test';
      };
      assign(NodeStub.prototype, ReactDOMComponent.Mixin);

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
      expect(genMarkup({className: 'a'})).toHaveAttribute('class', 'a');
      expect(genMarkup({className: 'a b'})).toHaveAttribute('class', 'a b');
      expect(genMarkup({className: ''})).toHaveAttribute('class', '');
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
      return (str + '').replace(/([.?*+\^$\[\]\\(){}|-])/g, "\\$1");
    }

    beforeEach(function() {
      require('mock-modules').dumpCache();

      var ReactDOMComponent = require('ReactDOMComponent');
      var ReactReconcileTransaction = require('ReactReconcileTransaction');

      var NodeStub = function(initialProps) {
        this._currentElement = {props: initialProps};
        this._rootNodeID = 'test';
      };
      assign(NodeStub.prototype, ReactDOMComponent.Mixin);

      genMarkup = function(props) {
        var transaction = new ReactReconcileTransaction();
        return (new NodeStub(props))._createContentMarkup(transaction, {});
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
        genMarkup({dangerouslySetInnerHTML: innerHTML})
      ).toHaveInnerhtml('testContent');
    });
  });

  describe('mountComponent', function() {
    var mountComponent;

    beforeEach(function() {
      require('mock-modules').dumpCache();

      var ReactMultiChild = require('ReactMultiChild');
      var ReactDOMComponent = require('ReactDOMComponent');
      var ReactReconcileTransaction = require('ReactReconcileTransaction');

      var StubNativeComponent = function(element) {
        this._currentElement = element;
      };
      assign(StubNativeComponent.prototype, ReactDOMComponent.Mixin);
      assign(StubNativeComponent.prototype, ReactMultiChild.Mixin);

      mountComponent = function(props) {
        var transaction = new ReactReconcileTransaction();
        var stubComponent = new StubNativeComponent({
          type: StubNativeComponent,
          props: props,
          _owner: null,
          _context: null
        });
        return stubComponent.mountComponent('test', transaction, {});
      };
    });

    it("should validate against multiple children props", function() {
      expect(function() {
        mountComponent({children: '', dangerouslySetInnerHTML: ''});
      }).toThrow(
        'Invariant Violation: Can only set one of `children` or ' +
        '`props.dangerouslySetInnerHTML`.'
      );
    });

    it('should validate against use of innerHTML', function() {

      spyOn(console, 'warn');
      mountComponent({innerHTML: '<span>Hi Jim!</span>'});
      expect(console.warn.argsForCall.length).toBe(1);
      expect(console.warn.argsForCall[0][0]).toContain(
        'Directly setting property `innerHTML` is not permitted. '
      );
    });

    it('should validate use of dangerouslySetInnerHTML', function() {
      expect(function() {
        mountComponent({dangerouslySetInnerHTML: '<span>Hi Jim!</span>'});
      }).toThrow(
        'Invariant Violation: ' +
        '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
        'Please visit http://fb.me/react-invariant-dangerously-set-inner-html for more information.'
      );
    });

    it('should validate use of dangerouslySetInnerHTML', function() {
      expect(function() {
        mountComponent({dangerouslySetInnerHTML: {foo: 'bar'} });
      }).toThrow(
        'Invariant Violation: ' +
        '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
        'Please visit http://fb.me/react-invariant-dangerously-set-inner-html for more information.'
      );
    });

    it("should warn about contentEditable and children", function() {
      spyOn(console, 'warn');
      mountComponent({contentEditable: true, children: ''});
      expect(console.warn.argsForCall.length).toBe(1);
      expect(console.warn.argsForCall[0][0]).toContain('contentEditable');
    });

    it("should validate against invalid styles", function() {
      expect(function() {
        mountComponent({style: 'display: none'});
      }).toThrow(
        'Invariant Violation: The `style` prop expects a mapping from style ' +
        'properties to values, not a string. For example, ' +
        'style={{marginRight: spacing + \'em\'}} when using JSX.'
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
      React.render(<div></div>, container);

      expect(function() {
        React.render(
          <div children="" dangerouslySetInnerHTML={{__html: ''}}></div>,
          container
        );
      }).toThrow(
        'Invariant Violation: Can only set one of `children` or ' +
        '`props.dangerouslySetInnerHTML`.'
      );
    });

    it("should warn about contentEditable and children", function() {
      spyOn(console, 'warn');
      React.render(
        <div contentEditable><div /></div>,
        container
      );
      expect(console.warn.argsForCall.length).toBe(1);
      expect(console.warn.argsForCall[0][0]).toContain('contentEditable');
    });

    it("should validate against invalid styles", function() {
      React.render(<div></div>, container);

      expect(function() {
        React.render(<div style={1}></div>, container);
      }).toThrow(
        'Invariant Violation: The `style` prop expects a mapping from style ' +
        'properties to values, not a string. For example, ' +
        'style={{marginRight: spacing + \'em\'}} when using JSX.'
      );
    });

    it("should properly escape text content and attributes values", function() {
      expect(
        React.renderToStaticMarkup(
          React.DOM.div({
            title: '\'"<>&',
            style: {
              textAlign: '\'"<>&'
            }
          }, '\'"<>&')
        )
      ).toBe(
        '<div title="&#x27;&quot;&lt;&gt;&amp;" style="text-align:&#x27;&quot;&lt;&gt;&amp;;">' +
          '&#x27;&quot;&lt;&gt;&amp;' +
        '</div>'
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
      instance = React.render(instance, container);

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

  describe('onScroll warning', function() {
    it('should warn about the `onScroll` issue when unsupported (IE8)', () => {
      // Mock this here so we can mimic IE8 support. We require isEventSupported
      // before React so it's pre-mocked before React qould require it.
      require('mock-modules')
        .dumpCache()
        .mock('isEventSupported');
      var isEventSupported = require('isEventSupported');
      isEventSupported.mockReturnValueOnce(false);

      var React = require('React');
      var ReactTestUtils = require('ReactTestUtils');

      spyOn(console, 'warn');
      ReactTestUtils.renderIntoDocument(<div onScroll={function() {}} />);
      expect(console.warn.calls.length).toBe(1);
      expect(console.warn.mostRecentCall.args[0]).toBe(
        'Warning: This browser doesn\'t support the `onScroll` event'
      );
    });
  });

  describe('tag sanitization', function() {
    it('should throw when an invalid tag name is used', () => {
      var React = require('React');
      var ReactTestUtils = require('ReactTestUtils');
      var hackzor = React.createElement('script tag');
      expect(
        () => ReactTestUtils.renderIntoDocument(hackzor)
      ).toThrow(
        'Invariant Violation: Invalid tag: script tag'
      );
    });

    it('should throw when an attack vector is used', () => {
      var React = require('React');
      var ReactTestUtils = require('ReactTestUtils');
      var hackzor = React.createElement('div><img /><div');
      expect(
        () => ReactTestUtils.renderIntoDocument(hackzor)
      ).toThrow(
        'Invariant Violation: Invalid tag: div><img /><div'
      );
    });

  });
});

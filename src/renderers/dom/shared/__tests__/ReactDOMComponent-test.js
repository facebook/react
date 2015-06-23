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

var assign = require('Object.assign');
var mocks = require('mocks');

describe('ReactDOMComponent', function() {

  describe('updateDOM', function() {
    var React;
    var ReactTestUtils;

    beforeEach(function() {
      require('mock-modules').dumpCache();
      React = require('React');
      ReactTestUtils = require('ReactTestUtils');
    });

    it('should handle className', function() {
      var container = document.createElement('div');
      React.render(<div style={{}} />, container);

      React.render(<div className={'foo'} />, container);
      expect(container.firstChild.className).toEqual('foo');
      React.render(<div className={'bar'} />, container);
      expect(container.firstChild.className).toEqual('bar');
      React.render(<div className={null} />, container);
      expect(container.firstChild.className).toEqual('');
    });

    it('should gracefully handle various style value types', function() {
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

    // TODO: (poshannessy) deprecate this pattern.
    it('should update styles when mutating style object', function() {
      // not actually used. Just to suppress the style mutation warning
      spyOn(console, 'error');

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

    it('should warn when mutating style', function() {
      spyOn(console, 'error');

      var style = {border: '1px solid black'};
      var App = React.createClass({
        getInitialState: function() {
          return {style: style};
        },
        render: function() {
          return <div style={this.state.style}>asd</div>;
        },
      });

      var stub = ReactTestUtils.renderIntoDocument(<App />);
      style.position = 'absolute';
      stub.setState({style: style});
      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toEqual(
        'Warning: `div` was passed a style object that has previously been ' +
        'mutated. Mutating `style` is deprecated. Consider cloning it ' +
        'beforehand. Check the `render` of `App`. Previous style: ' +
        '{"border":"1px solid black"}. Mutated style: ' +
        '{"border":"1px solid black","position":"absolute"}.'
      );

      style = {background: 'red'};
      stub = ReactTestUtils.renderIntoDocument(<App />);
      style.background = 'green';
      stub.setState({style: {background: 'green'}});
      // already warned once for the same component and owner
      expect(console.error.argsForCall.length).toBe(1);

      style = {background: 'red'};
      var div = document.createElement('div');
      React.render(<span style={style}></span>, div);
      style.background = 'blue';
      React.render(<span style={style}></span>, div);
      expect(console.error.argsForCall.length).toBe(2);
    });

    it('should update styles if initially null', function() {
      var styles = null;
      var container = document.createElement('div');
      React.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;

      styles = {display: 'block'};

      React.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
    });

    it('should update styles if updated to null multiple times', function() {
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

    it('should remove attributes', function() {
      var container = document.createElement('div');
      React.render(<img height="17" />, container);

      expect(container.firstChild.hasAttribute('height')).toBe(true);
      React.render(<img />, container);
      expect(container.firstChild.hasAttribute('height')).toBe(false);
    });

    it('should remove properties', function() {
      var container = document.createElement('div');
      React.render(<div className="monkey" />, container);

      expect(container.firstChild.className).toEqual('monkey');
      React.render(<div />, container);
      expect(container.firstChild.className).toEqual('');
    });

    it('should clear a single style prop when changing `style`', function() {
      var styles = {display: 'none', color: 'red'};
      var container = document.createElement('div');
      React.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;

      styles = {color: 'green'};
      React.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('green');
    });

    it('should reject attribute key injection attack on markup', function() {
      spyOn(console, 'error');
      for (var i = 0; i < 3; i++) {
        var container = document.createElement('div');
        var element = React.createElement(
          'x-foo-component',
          {'blah" onclick="beevil" noise="hi': 'selected'},
          null
        );
        React.render(element, container);
      }
      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toEqual(
        'Warning: Invalid attribute name: `blah" onclick="beevil" noise="hi`'
      );
    });

    it('should reject attribute key injection attack on update', function() {
      spyOn(console, 'error');
      for (var i = 0; i < 3; i++) {
        var container = document.createElement('div');
        var beforeUpdate = React.createElement('x-foo-component', {}, null);
        React.render(beforeUpdate, container);

        var afterUpdate = React.createElement(
          'x-foo-component',
          {'blah" onclick="beevil" noise="hi': 'selected'},
          null
        );
        React.render(afterUpdate, container);
      }
      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toEqual(
        'Warning: Invalid attribute name: `blah" onclick="beevil" noise="hi`'
      );
    });

    it('should update arbitrary attributes for tags containing dashes', function() {
      var container = document.createElement('div');

      var beforeUpdate = React.createElement('x-foo-component', {}, null);
      React.render(beforeUpdate, container);

      var afterUpdate = <x-foo-component myattr="myval" />;
      React.render(afterUpdate, container);

      expect(container.childNodes[0].getAttribute('myattr')).toBe('myval');
    });

    it('should clear all the styles when removing `style`', function() {
      var styles = {display: 'none', color: 'red'};
      var container = document.createElement('div');
      React.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;

      React.render(<div />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('');
    });

    it('should update styles when `style` changes from null to object', function() {
      var container = document.createElement('div');
      var styles = {color: 'red'};
      React.render(<div style={styles} />, container);
      React.render(<div />, container);
      React.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;
      expect(stubStyle.color).toEqual('red');
    });

    it('should empty element when removing innerHTML', function() {
      var container = document.createElement('div');
      React.render(<div dangerouslySetInnerHTML={{__html: ':)'}} />, container);

      expect(container.firstChild.innerHTML).toEqual(':)');
      React.render(<div />, container);
      expect(container.firstChild.innerHTML).toEqual('');
    });

    it('should transition from string content to innerHTML', function() {
      var container = document.createElement('div');
      React.render(<div>hello</div>, container);

      expect(container.firstChild.innerHTML).toEqual('hello');
      React.render(
        <div dangerouslySetInnerHTML={{__html: 'goodbye'}} />,
        container
      );
      expect(container.firstChild.innerHTML).toEqual('goodbye');
    });

    it('should transition from innerHTML to string content', function() {
      var container = document.createElement('div');
      React.render(
        <div dangerouslySetInnerHTML={{__html: 'bonjour'}} />,
        container
      );

      expect(container.firstChild.innerHTML).toEqual('bonjour');
      React.render(<div>adieu</div>, container);
      expect(container.firstChild.innerHTML).toEqual('adieu');
    });

    it('should not incur unnecessary DOM mutations', function() {
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
        }),
      });

      React.render(<div value="" />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(0);

      React.render(<div />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(1);
    });

    it('should ignore attribute whitelist for elements with the "is: attribute', function() {
      var container = document.createElement('div');
      React.render(<button is="test" cowabunga="chevynova"/>, container);
      expect(container.firstChild.hasAttribute('cowabunga')).toBe(true);
    });
  });

  describe('createOpenTagMarkup', function() {
    var genMarkup;

    function quoteRegexp(str) {
      return (str + '').replace(/([.?*+\^$\[\]\\(){}|-])/g, '\\$1');
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
          transaction,
          props
        );
      };

      this.addMatchers({
        toHaveAttribute: function(attr, value) {
          var expected = '(?:^|\\s)' + attr + '=[\\\'"]';
          if (typeof value !== 'undefined') {
            expected += quoteRegexp(value) + '[\\\'"]';
          }
          return this.actual.match(new RegExp(expected));
        },
      });
    });

    it('should generate the correct markup with className', function() {
      expect(genMarkup({className: 'a'})).toHaveAttribute('class', 'a');
      expect(genMarkup({className: 'a b'})).toHaveAttribute('class', 'a b');
      expect(genMarkup({className: ''})).toHaveAttribute('class', '');
    });

    it('should escape style names and values', function() {
      expect(genMarkup({
        style: {'b&ckground': '<3'},
      })).toHaveAttribute('style', 'b&amp;ckground:&lt;3;');
    });
  });

  describe('createContentMarkup', function() {
    var genMarkup;

    function quoteRegexp(str) {
      return (str + '').replace(/([.?*+\^$\[\]\\(){}|-])/g, '\\$1');
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
        return (new NodeStub(props))._createContentMarkup(
          transaction,
          props,
          {}
        );
      };

      this.addMatchers({
        toHaveInnerhtml: function(html) {
          var expected = '^' + quoteRegexp(html) + '$';
          return this.actual.match(new RegExp(expected));
        },
      });
    });

    it('should handle dangerouslySetInnerHTML', function() {
      var innerHTML = {__html: 'testContent'};
      expect(
        genMarkup({dangerouslySetInnerHTML: innerHTML})
      ).toHaveInnerhtml('testContent');
    });
  });

  describe('mountComponent', function() {
    var React;
    var mountComponent;

    beforeEach(function() {
      require('mock-modules').dumpCache();

      React = require('React');

      mountComponent = function(props) {
        var container = document.createElement('div');
        React.render(<div {...props} />, container);
      };
    });

    it('should not duplicate uppercased selfclosing tags', function() {
      var Container = React.createClass({
          render: function() {
            return React.createElement('BR', null);
          },
      });
      var returnedValue = React.renderToString(<Container/>);
      expect(returnedValue).not.toContain('</BR>');
    });

    it('should warn against children for void elements', function() {
      spyOn(console, 'error');

      var container = document.createElement('div');

      React.render(<input>children</input>, container);

      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toContain('void element');
    });

    it('should warn against dangerouslySetInnerHTML for void elements', function() {
      spyOn(console, 'error');

      var container = document.createElement('div');

      React.render(
        <input dangerouslySetInnerHTML={{__html: 'content'}} />,
        container
      );

      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toContain('void element');
    });

    it('should treat menuitem as a void element but still create the closing tag', function() {
      spyOn(console, 'error');

      var container = document.createElement('div');

      var returnedValue = React.renderToString(<menu><menuitem /></menu>);

      expect(returnedValue).toContain('</menuitem>');

      React.render(<menu><menuitem>children</menuitem></menu>, container);

      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toContain('void element');
    });

    it('should validate against multiple children props', function() {
      expect(function() {
        mountComponent({children: '', dangerouslySetInnerHTML: ''});
      }).toThrow(
        'Invariant Violation: Can only set one of `children` or ' +
        '`props.dangerouslySetInnerHTML`.'
      );
    });

    it('should validate against use of innerHTML', function() {

      spyOn(console, 'error');
      mountComponent({innerHTML: '<span>Hi Jim!</span>'});
      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toContain(
        'Directly setting property `innerHTML` is not permitted. '
      );
    });

    it('should validate use of dangerouslySetInnerHTML', function() {
      expect(function() {
        mountComponent({dangerouslySetInnerHTML: '<span>Hi Jim!</span>'});
      }).toThrow(
        'Invariant Violation: ' +
        '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
        'Please visit https://fb.me/react-invariant-dangerously-set-inner-html for more information.'
      );
    });

    it('should validate use of dangerouslySetInnerHTML', function() {
      expect(function() {
        mountComponent({dangerouslySetInnerHTML: {foo: 'bar'} });
      }).toThrow(
        'Invariant Violation: ' +
        '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
        'Please visit https://fb.me/react-invariant-dangerously-set-inner-html for more information.'
      );
    });

    it('should allow {__html: null}', function() {
      expect(function() {
        mountComponent({dangerouslySetInnerHTML: {__html: null} });
      }).not.toThrow();
    });

    it('should warn about contentEditable and children', function() {
      spyOn(console, 'error');
      mountComponent({contentEditable: true, children: ''});
      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toContain('contentEditable');
    });

    it('should validate against invalid styles', function() {
      expect(function() {
        mountComponent({style: 'display: none'});
      }).toThrow(
        'Invariant Violation: The `style` prop expects a mapping from style ' +
        'properties to values, not a string. For example, ' +
        'style={{marginRight: spacing + \'em\'}} when using JSX.'
      );
    });

    it('should execute custom event plugin listening behavior', function() {
      var SimpleEventPlugin = require('SimpleEventPlugin');

      SimpleEventPlugin.didPutListener = mocks.getMockFunction();
      SimpleEventPlugin.willDeleteListener = mocks.getMockFunction();

      var container = document.createElement('div');
      React.render(
        <div onClick={() => true} />,
        container
      );

      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(1);

      React.unmountComponentAtNode(container);

      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(1);
    });

    it('should handle null and missing properly with event hooks', function() {
      var SimpleEventPlugin = require('SimpleEventPlugin');

      SimpleEventPlugin.didPutListener = mocks.getMockFunction();
      SimpleEventPlugin.willDeleteListener = mocks.getMockFunction();
      var container = document.createElement('div');

      React.render(<div onClick={null} />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(0);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(0);

      React.render(<div onClick={() => 'apple'} />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(1);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(0);

      React.render(<div onClick={() => 'banana'} />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(2);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(0);

      React.render(<div onClick={null} />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(2);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(1);

      React.render(<div />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(2);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(1);

      React.unmountComponentAtNode(container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(2);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(1);
    });

    it('should warn for children on void elements', function() {
      spyOn(console, 'error');
      var X = React.createClass({
        render: function() {
          return <input>moo</input>;
        },
      });
      var container = document.createElement('div');
      React.render(<X />, container);
      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toBe(
        'Warning: input is a void element tag and must not have `children` ' +
        'or use `props.dangerouslySetInnerHTML`. Check the render method of X.'
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

    it('should warn against children for void elements', function() {
      spyOn(console, 'error');

      React.render(<input />, container);
      React.render(<input>children</input>, container);

      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toContain('void element');
    });

    it('should warn against dangerouslySetInnerHTML for void elements', function() {
      spyOn(console, 'error');

      React.render(<input />, container);
      React.render(
        <input dangerouslySetInnerHTML={{__html: 'content'}} />,
        container
      );

      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toContain('void element');
    });

    it('should validate against multiple children props', function() {
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

    it('should warn about contentEditable and children', function() {
      spyOn(console, 'error');
      React.render(
        <div contentEditable={true}><div /></div>,
        container
      );
      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toContain('contentEditable');
    });

    it('should validate against invalid styles', function() {
      React.render(<div></div>, container);

      expect(function() {
        React.render(<div style={1}></div>, container);
      }).toThrow(
        'Invariant Violation: The `style` prop expects a mapping from style ' +
        'properties to values, not a string. For example, ' +
        'style={{marginRight: spacing + \'em\'}} when using JSX.'
      );
    });

    it('should properly escape text content and attributes values', function() {
      expect(
        React.renderToStaticMarkup(
          React.DOM.div({
            title: '\'"<>&',
            style: {
              textAlign: '\'"<>&',
            },
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
    it('should clean up listeners', function() {
      var React = require('React');
      var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
      var ReactMount = require('ReactMount');

      var container = document.createElement('div');
      document.body.appendChild(container);

      var callback = function() {};
      var instance = <div onClick={callback} />;
      instance = React.render(instance, container);

      var rootNode = React.findDOMNode(instance);
      var rootNodeID = ReactMount.getID(rootNode);
      expect(
        ReactBrowserEventEmitter.getListener(rootNodeID, 'onClick')
      ).toBe(callback);
      expect(rootNode).toBe(React.findDOMNode(instance));

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

      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(<div onScroll={function() {}} />);
      expect(console.error.calls.length).toBe(1);
      expect(console.error.mostRecentCall.args[0]).toBe(
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

  describe('nesting validation', function() {
    var React;
    var ReactTestUtils;

    beforeEach(function() {
      React = require('React');
      ReactTestUtils = require('ReactTestUtils');
    });

    it('warns on invalid nesting', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(<div><tr /><tr /></div>);

      expect(console.error.calls.length).toBe(1);
      expect(console.error.calls[0].args[0]).toBe(
        'Warning: validateDOMNesting(...): <tr> cannot appear as a child of ' +
        '<div>. See div > tr.'
      );
    });

    it('warns on invalid nesting at root', () => {
      spyOn(console, 'error');
      var p = document.createElement('p');
      React.render(<span><p /></span>, p);

      expect(console.error.calls.length).toBe(1);
      expect(console.error.calls[0].args[0]).toBe(
        'Warning: validateDOMNesting(...): <p> cannot appear as a descendant ' +
        'of <p>. See p > ... > p.'
      );
    });

    it('warns nicely for table rows', () => {
      spyOn(console, 'error');
      var Row = React.createClass({
        render: function() {
          return <tr />;
        },
      });
      var Foo = React.createClass({
        render: function() {
          return <table><Row /></table>;
        },
      });
      ReactTestUtils.renderIntoDocument(<Foo />);

      expect(console.error.calls.length).toBe(1);
      expect(console.error.calls[0].args[0]).toBe(
        'Warning: validateDOMNesting(...): <tr> cannot appear as a child of ' +
        '<table>. See Foo > table > Row > tr. Add a <tbody> to your code to ' +
        'match the DOM tree generated by the browser.'
      );
    });

    it('gives useful context in warnings', () => {
      spyOn(console, 'error');
      var Row = React.createClass({
        render: () => <tr />,
      });
      var FancyRow = React.createClass({
        render: () => <Row />,
      });
      var Table = React.createClass({
        render: function() {
          return <table>{this.props.children}</table>;
        },
      });
      var FancyTable = React.createClass({
        render: function() {
          return <Table>{this.props.children}</Table>;
        },
      });

      var Viz1 = React.createClass({
        render: () => <table><FancyRow /></table>,
      });
      var App1 = React.createClass({
        render: () => <Viz1 />,
      });
      ReactTestUtils.renderIntoDocument(<App1 />);
      expect(console.error.calls.length).toBe(1);
      expect(console.error.calls[0].args[0]).toContain(
        'See Viz1 > table > FancyRow > Row > tr.'
      );

      var Viz2 = React.createClass({
        render: () => <FancyTable><FancyRow /></FancyTable>,
      });
      var App2 = React.createClass({
        render: () => <Viz2 />,
      });
      ReactTestUtils.renderIntoDocument(<App2 />);
      expect(console.error.calls.length).toBe(2);
      expect(console.error.calls[1].args[0]).toContain(
        'See Viz2 > FancyTable > Table > table > FancyRow > Row > tr.'
      );

      ReactTestUtils.renderIntoDocument(<FancyTable><FancyRow /></FancyTable>);
      expect(console.error.calls.length).toBe(3);
      expect(console.error.calls[2].args[0]).toContain(
        'See FancyTable > Table > table > FancyRow > Row > tr.'
      );

      ReactTestUtils.renderIntoDocument(<table><FancyRow /></table>);
      expect(console.error.calls.length).toBe(4);
      expect(console.error.calls[3].args[0]).toContain(
        'See table > FancyRow > Row > tr.'
      );

      ReactTestUtils.renderIntoDocument(<FancyTable><tr /></FancyTable>);
      expect(console.error.calls.length).toBe(5);
      expect(console.error.calls[4].args[0]).toContain(
        'See FancyTable > Table > table > tr.'
      );

      var Link = React.createClass({
        render: function() {
          return <a>{this.props.children}</a>;
        },
      });
      ReactTestUtils.renderIntoDocument(<Link><div><Link /></div></Link>);
      expect(console.error.calls.length).toBe(6);
      expect(console.error.calls[5].args[0]).toContain(
        'See Link > a > ... > Link > a.'
      );
    });
  });

  describe('DOM nodes as refs', function() {
    var React;
    var ReactTestUtils;

    beforeEach(function() {
      React = require('React');
      ReactTestUtils = require('ReactTestUtils');
    });

    it('warns when accessing properties on DOM components', function() {
      spyOn(console, 'error');
      var innerDiv;
      var Animal = React.createClass({
        render: function() {
          return <div ref="div">iguana</div>;
        },
        componentDidMount: function() {
          innerDiv = this.refs.div;

          void this.refs.div.props;
          this.refs.div.setState();
          expect(this.refs.div.getDOMNode()).toBe(this.refs.div);
          expect(this.refs.div.isMounted()).toBe(true);
        },
      });
      var container = document.createElement('div');
      React.render(<Animal />, container);
      React.unmountComponentAtNode(container);
      expect(innerDiv.isMounted()).toBe(false);

      expect(console.error.calls.length).toBe(5);
      expect(console.error.calls[0].args[0]).toBe(
        'Warning: ReactDOMComponent: Do not access .props of a DOM ' +
        'node; instead, recreate the props as `render` did originally or ' +
        'read the DOM properties/attributes directly from this node (e.g., ' +
        'this.refs.box.className). This DOM node was rendered by `Animal`.'
      );
      expect(console.error.calls[1].args[0]).toBe(
        'Warning: ReactDOMComponent: Do not access .setState(), ' +
        '.replaceState(), or .forceUpdate() of a DOM node. This is a no-op. ' +
        'This DOM node was rendered by `Animal`.'
      );
      expect(console.error.calls[2].args[0]).toBe(
        'Warning: ReactDOMComponent: Do not access .getDOMNode() of a DOM ' +
        'node; instead, use the node directly. This DOM node was ' +
        'rendered by `Animal`.'
      );
      expect(console.error.calls[3].args[0]).toBe(
        'Warning: ReactDOMComponent: Do not access .isMounted() of a DOM ' +
        'node. This DOM node was rendered by `Animal`.'
      );
      expect(console.error.calls[4].args[0]).toContain('isMounted');
    });

    it('handles legacy setProps and replaceProps', function() {
      spyOn(console, 'error');
      var node = ReactTestUtils.renderIntoDocument(<div>rhinoceros</div>);

      node.setProps({className: 'herbiverous'});
      expect(node.className).toBe('herbiverous');
      expect(node.textContent).toBe('rhinoceros');

      node.replaceProps({className: 'invisible rhino'});
      expect(node.className).toBe('invisible rhino');
      expect(node.textContent).toBe('');

      expect(console.error.calls.length).toBe(2);
      expect(console.error.calls[0].args[0]).toBe(
        'Warning: ReactDOMComponent: Do not access .setProps() of a DOM node. ' +
        'Instead, call React.render again at the top level.'
      );
      expect(console.error.calls[1].args[0]).toBe(
        'Warning: ReactDOMComponent: Do not access .replaceProps() of a DOM ' +
        'node. Instead, call React.render again at the top level.'
      );
    });

    it('does not touch ref-less nodes', function() {
      var node = ReactTestUtils.renderIntoDocument(<div><span /></div>);
      expect(typeof node.getDOMNode).toBe('function');
      expect(typeof node.firstChild.getDOMNode).toBe('undefined');
    });
  });

});

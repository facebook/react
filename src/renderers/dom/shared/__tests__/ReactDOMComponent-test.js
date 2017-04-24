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

describe('ReactDOMComponent', () => {
  var React;
  var ReactDOM;
  var ReactDOMFeatureFlags;
  var ReactDOMServer;

  function normalizeCodeLocInfo(str) {
    return str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
    ReactDOMServer = require('ReactDOMServer');
  });

  describe('updateDOM', () => {
    var ReactTestUtils;

    beforeEach(() => {
      ReactTestUtils = require('ReactTestUtils');
    });

    it('should handle className', () => {
      var container = document.createElement('div');
      ReactDOM.render(<div style={{}} />, container);

      ReactDOM.render(<div className={'foo'} />, container);
      expect(container.firstChild.className).toEqual('foo');
      ReactDOM.render(<div className={'bar'} />, container);
      expect(container.firstChild.className).toEqual('bar');
      ReactDOM.render(<div className={null} />, container);
      expect(container.firstChild.className).toEqual('');
    });

    it('should gracefully handle various style value types', () => {
      var container = document.createElement('div');
      ReactDOM.render(<div style={{}} />, container);
      var stubStyle = container.firstChild.style;

      // set initial style
      var setup = {display: 'block', left: '1px', top: 2, fontFamily: 'Arial'};
      ReactDOM.render(<div style={setup} />, container);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.left).toEqual('1px');
      expect(stubStyle.fontFamily).toEqual('Arial');

      // reset the style to their default state
      var reset = {display: '', left: null, top: false, fontFamily: true};
      ReactDOM.render(<div style={reset} />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.left).toEqual('');
      expect(stubStyle.top).toEqual('');
      expect(stubStyle.fontFamily).toEqual('');
    });

    // TODO: (poshannessy) deprecate this pattern.
    it('should update styles when mutating style object', () => {
      // not actually used. Just to suppress the style mutation warning
      spyOn(console, 'error');

      var styles = {display: 'none', fontFamily: 'Arial', lineHeight: 1.2};
      var container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;
      stubStyle.display = styles.display;
      stubStyle.fontFamily = styles.fontFamily;

      styles.display = 'block';

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.fontFamily).toEqual('Arial');
      expect(stubStyle.lineHeight).toEqual('1.2');

      styles.fontFamily = 'Helvetica';

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.fontFamily).toEqual('Helvetica');
      expect(stubStyle.lineHeight).toEqual('1.2');

      styles.lineHeight = 0.5;

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.fontFamily).toEqual('Helvetica');
      expect(stubStyle.lineHeight).toEqual('0.5');

      ReactDOM.render(<div style={undefined} />, container);
      expect(stubStyle.display).toBe('');
      expect(stubStyle.fontFamily).toBe('');
      expect(stubStyle.lineHeight).toBe('');
    });

    it('should warn when mutating style', () => {
      spyOn(console, 'error');

      var style = {border: '1px solid black'};

      class App extends React.Component {
        state = {style: style};

        render() {
          return <div style={this.state.style}>asd</div>;
        }
      }

      var stub = ReactTestUtils.renderIntoDocument(<App />);
      style.position = 'absolute';
      stub.setState({style: style});
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toEqual(
        'Warning: `div` was passed a style object that has previously been ' +
          'mutated. Mutating `style` is deprecated. Consider cloning it ' +
          'beforehand. Check the `render` of `App`. Previous style: ' +
          '{border: "1px solid black"}. Mutated style: ' +
          '{border: "1px solid black", position: "absolute"}.',
      );

      style = {background: 'red'};
      stub = ReactTestUtils.renderIntoDocument(<App />);
      style.background = 'green';
      stub.setState({style: {background: 'green'}});
      // already warned once for the same component and owner
      expect(console.error.calls.count()).toBe(1);

      style = {background: 'red'};
      var div = document.createElement('div');
      ReactDOM.render(<span style={style} />, div);
      style.background = 'blue';
      ReactDOM.render(<span style={style} />, div);
      expect(console.error.calls.count()).toBe(2);
    });

    it('should warn for unknown prop', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');
      ReactDOM.render(<div foo="bar" />, container);
      expect(console.error.calls.count(0)).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown prop `foo` on <div> tag. Remove this prop from the element. ' +
          'For details, see https://fb.me/react-unknown-prop\n    in div (at **)',
      );
    });

    it('should group multiple unknown prop warnings together', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');
      ReactDOM.render(<div foo="bar" baz="qux" />, container);
      expect(console.error.calls.count(0)).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown props `foo`, `baz` on <div> tag. Remove these props from the element. ' +
          'For details, see https://fb.me/react-unknown-prop\n    in div (at **)',
      );
    });

    it('should warn for onDblClick prop', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');
      ReactDOM.render(<div onDblClick={() => {}} />, container);
      expect(console.error.calls.count(0)).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown event handler property onDblClick. Did you mean `onDoubleClick`?\n    in div (at **)',
      );
    });

    it('should warn about styles with numeric string values for non-unitless properties', function() {
      spyOn(console, 'error');

      var div = document.createElement('div');
      function One(props) {
        return props.inline
          ? <span style={{fontSize: '1'}} />
          : <div style={{fontSize: '1'}} />;
      }
      function Two() {
        return <div style={{fontSize: '1'}} />;
      }
      ReactDOM.render(<One inline={false} />, div);
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: a `div` tag (owner: `One`) was passed a numeric string value ' +
          'for CSS property `fontSize` (value: `1`) which will be treated ' +
          'as a unitless number in a future version of React.',
      );

      // Don't warn again for the same component
      ReactDOM.render(<One inline={true} />, div);
      expect(console.error.calls.count()).toBe(1);

      // Do warn for different components
      ReactDOM.render(<Two />, div);
      expect(console.error.calls.count()).toBe(2);
      expect(console.error.calls.argsFor(1)[0]).toBe(
        'Warning: a `div` tag (owner: `Two`) was passed a numeric string value ' +
          'for CSS property `fontSize` (value: `1`) which will be treated ' +
          'as a unitless number in a future version of React.',
      );

      // Really don't warn again for the same component
      ReactDOM.render(<One inline={true} />, div);
      expect(console.error.calls.count()).toBe(2);
    });

    it('should not warn for "0" as a unitless style value', () => {
      spyOn(console, 'error');

      class Component extends React.Component {
        render() {
          return <div style={{margin: '0'}} />;
        }
      }

      ReactTestUtils.renderIntoDocument(<Component />);
      expect(console.error.calls.count()).toBe(0);
    });

    it('should warn nicely about NaN in style', () => {
      spyOn(console, 'error');

      var style = {fontSize: NaN};
      var div = document.createElement('div');
      ReactDOM.render(<span style={style} />, div);
      ReactDOM.render(<span style={style} />, div);

      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toEqual(
        'Warning: `NaN` is an invalid value for the `fontSize` css style property.',
      );
    });

    it('should update styles if initially null', () => {
      var styles = null;
      var container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;

      styles = {display: 'block'};

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
    });

    it('should update styles if updated to null multiple times', () => {
      var styles = null;
      var container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      styles = {display: 'block'};
      var stubStyle = container.firstChild.style;

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');

      ReactDOM.render(<div style={null} />, container);
      expect(stubStyle.display).toEqual('');

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');

      ReactDOM.render(<div style={null} />, container);
      expect(stubStyle.display).toEqual('');
    });

    it('should skip reserved props on web components', () => {
      var container = document.createElement('div');

      ReactDOM.render(
        <my-component
          children={['foo']}
          suppressContentEditableWarning={true}
        />,
        container,
      );
      expect(container.firstChild.hasAttribute('children')).toBe(false);
      expect(
        container.firstChild.hasAttribute('suppressContentEditableWarning'),
      ).toBe(false);

      ReactDOM.render(
        <my-component
          children={['bar']}
          suppressContentEditableWarning={false}
        />,
        container,
      );
      expect(container.firstChild.hasAttribute('children')).toBe(false);
      expect(
        container.firstChild.hasAttribute('suppressContentEditableWarning'),
      ).toBe(false);
    });

    it('should skip dangerouslySetInnerHTML on web components', () => {
      var container = document.createElement('div');

      ReactDOM.render(
        <my-component dangerouslySetInnerHTML={{__html: 'hi'}} />,
        container,
      );
      expect(container.firstChild.hasAttribute('dangerouslySetInnerHTML')).toBe(
        false,
      );

      ReactDOM.render(
        <my-component dangerouslySetInnerHTML={{__html: 'bye'}} />,
        container,
      );
      expect(container.firstChild.hasAttribute('dangerouslySetInnerHTML')).toBe(
        false,
      );
    });

    it('should remove attributes', () => {
      var container = document.createElement('div');
      ReactDOM.render(<img height="17" />, container);

      expect(container.firstChild.hasAttribute('height')).toBe(true);
      ReactDOM.render(<img />, container);
      expect(container.firstChild.hasAttribute('height')).toBe(false);
    });

    it('should remove properties', () => {
      var container = document.createElement('div');
      ReactDOM.render(<div className="monkey" />, container);

      expect(container.firstChild.className).toEqual('monkey');
      ReactDOM.render(<div />, container);
      expect(container.firstChild.className).toEqual('');
    });

    it('should properly update custom attributes on custom elements', () => {
      var container = document.createElement('div');
      ReactDOM.render(<some-custom-element foo="bar" />, container);
      ReactDOM.render(<some-custom-element bar="buzz" />, container);
      var node = container.firstChild;
      expect(node.hasAttribute('foo')).toBe(false);
      expect(node.getAttribute('bar')).toBe('buzz');
    });

    it('should clear a single style prop when changing `style`', () => {
      var styles = {display: 'none', color: 'red'};
      var container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;

      styles = {color: 'green'};
      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('green');
    });

    it('should reject attribute key injection attack on markup', () => {
      spyOn(console, 'error');
      for (var i = 0; i < 3; i++) {
        var container = document.createElement('div');
        var element = React.createElement(
          'x-foo-component',
          {'blah" onclick="beevil" noise="hi': 'selected'},
          null,
        );
        ReactDOM.render(element, container);
      }
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toEqual(
        'Warning: Invalid attribute name: `blah" onclick="beevil" noise="hi`',
      );
    });

    it('should reject attribute key injection attack on update', () => {
      spyOn(console, 'error');
      for (var i = 0; i < 3; i++) {
        var container = document.createElement('div');
        var beforeUpdate = React.createElement('x-foo-component', {}, null);
        ReactDOM.render(beforeUpdate, container);

        var afterUpdate = React.createElement(
          'x-foo-component',
          {'blah" onclick="beevil" noise="hi': 'selected'},
          null,
        );
        ReactDOM.render(afterUpdate, container);
      }
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toEqual(
        'Warning: Invalid attribute name: `blah" onclick="beevil" noise="hi`',
      );
    });

    it('should update arbitrary attributes for tags containing dashes', () => {
      var container = document.createElement('div');

      var beforeUpdate = React.createElement('x-foo-component', {}, null);
      ReactDOM.render(beforeUpdate, container);

      var afterUpdate = <x-foo-component myattr="myval" />;
      ReactDOM.render(afterUpdate, container);

      expect(container.childNodes[0].getAttribute('myattr')).toBe('myval');
    });

    it('should clear all the styles when removing `style`', () => {
      var styles = {display: 'none', color: 'red'};
      var container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;

      ReactDOM.render(<div />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('');
    });

    it('should update styles when `style` changes from null to object', () => {
      var container = document.createElement('div');
      var styles = {color: 'red'};
      ReactDOM.render(<div style={styles} />, container);
      ReactDOM.render(<div />, container);
      ReactDOM.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;
      expect(stubStyle.color).toEqual('red');
    });

    it('should empty element when removing innerHTML', () => {
      var container = document.createElement('div');
      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: ':)'}} />,
        container,
      );

      expect(container.firstChild.innerHTML).toEqual(':)');
      ReactDOM.render(<div />, container);
      expect(container.firstChild.innerHTML).toEqual('');
    });

    it('should transition from string content to innerHTML', () => {
      var container = document.createElement('div');
      ReactDOM.render(<div>hello</div>, container);

      expect(container.firstChild.innerHTML).toEqual('hello');
      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: 'goodbye'}} />,
        container,
      );
      expect(container.firstChild.innerHTML).toEqual('goodbye');
    });

    it('should transition from innerHTML to string content', () => {
      var container = document.createElement('div');
      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: 'bonjour'}} />,
        container,
      );

      expect(container.firstChild.innerHTML).toEqual('bonjour');
      ReactDOM.render(<div>adieu</div>, container);
      expect(container.firstChild.innerHTML).toEqual('adieu');
    });

    it('should transition from innerHTML to children in nested el', () => {
      var container = document.createElement('div');
      ReactDOM.render(
        <div><div dangerouslySetInnerHTML={{__html: 'bonjour'}} /></div>,
        container,
      );

      expect(container.textContent).toEqual('bonjour');
      ReactDOM.render(<div><div><span>adieu</span></div></div>, container);
      expect(container.textContent).toEqual('adieu');
    });

    it('should transition from children to innerHTML in nested el', () => {
      var container = document.createElement('div');
      ReactDOM.render(<div><div><span>adieu</span></div></div>, container);

      expect(container.textContent).toEqual('adieu');
      ReactDOM.render(
        <div><div dangerouslySetInnerHTML={{__html: 'bonjour'}} /></div>,
        container,
      );
      expect(container.textContent).toEqual('bonjour');
    });

    it('should not incur unnecessary DOM mutations for attributes', () => {
      var container = document.createElement('div');
      ReactDOM.render(<div id="" />, container);

      var node = container.firstChild;
      var nodeSetAttribute = node.setAttribute;
      node.setAttribute = jest.fn();
      node.setAttribute.mockImplementation(nodeSetAttribute);

      var nodeRemoveAttribute = node.removeAttribute;
      node.removeAttribute = jest.fn();
      node.removeAttribute.mockImplementation(nodeRemoveAttribute);

      ReactDOM.render(<div id="" />, container);
      expect(node.setAttribute.mock.calls.length).toBe(0);
      expect(node.removeAttribute.mock.calls.length).toBe(0);

      ReactDOM.render(<div id="foo" />, container);
      expect(node.setAttribute.mock.calls.length).toBe(1);
      expect(node.removeAttribute.mock.calls.length).toBe(0);

      ReactDOM.render(<div id="foo" />, container);
      expect(node.setAttribute.mock.calls.length).toBe(1);
      expect(node.removeAttribute.mock.calls.length).toBe(0);

      ReactDOM.render(<div />, container);
      expect(node.setAttribute.mock.calls.length).toBe(1);
      expect(node.removeAttribute.mock.calls.length).toBe(1);

      ReactDOM.render(<div id="" />, container);
      expect(node.setAttribute.mock.calls.length).toBe(2);
      expect(node.removeAttribute.mock.calls.length).toBe(1);

      ReactDOM.render(<div />, container);
      expect(node.setAttribute.mock.calls.length).toBe(2);
      expect(node.removeAttribute.mock.calls.length).toBe(2);
    });

    it('should not incur unnecessary DOM mutations for string properties', () => {
      var container = document.createElement('div');
      ReactDOM.render(<div value="" />, container);

      var node = container.firstChild;

      var nodeValueSetter = jest.genMockFn();

      var oldSetAttribute = node.setAttribute.bind(node);
      node.setAttribute = function(key, value) {
        oldSetAttribute(key, value);
        nodeValueSetter(key, value);
      };

      ReactDOM.render(<div value="foo" />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(1);

      ReactDOM.render(<div value="foo" />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(1);

      ReactDOM.render(<div />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(1);

      ReactDOM.render(<div value={null} />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(1);

      ReactDOM.render(<div value="" />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(2);

      ReactDOM.render(<div />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(2);
    });

    it('should not incur unnecessary DOM mutations for boolean properties', () => {
      var container = document.createElement('div');
      ReactDOM.render(<div checked={true} />, container);

      var node = container.firstChild;
      var nodeValue = true;
      var nodeValueSetter = jest.fn();
      Object.defineProperty(node, 'checked', {
        get: function() {
          return nodeValue;
        },
        set: nodeValueSetter.mockImplementation(function(newValue) {
          nodeValue = newValue;
        }),
      });

      ReactDOM.render(<div checked={true} />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(0);

      ReactDOM.render(<div />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(1);

      ReactDOM.render(<div checked={false} />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(2);

      ReactDOM.render(<div checked={true} />, container);
      expect(nodeValueSetter.mock.calls.length).toBe(3);
    });

    it('should ignore attribute whitelist for elements with the "is: attribute', () => {
      var container = document.createElement('div');
      ReactDOM.render(<button is="test" cowabunga="chevynova" />, container);
      expect(container.firstChild.hasAttribute('cowabunga')).toBe(true);
    });

    it('should not update when switching between null/undefined', () => {
      var container = document.createElement('div');
      var node = ReactDOM.render(<div />, container);

      var setter = jest.fn();
      node.setAttribute = setter;

      ReactDOM.render(<div dir={null} />, container);
      ReactDOM.render(<div dir={undefined} />, container);
      ReactDOM.render(<div />, container);
      expect(setter.mock.calls.length).toBe(0);
      ReactDOM.render(<div dir="ltr" />, container);
      expect(setter.mock.calls.length).toBe(1);
    });

    it('handles multiple child updates without interference', () => {
      // This test might look like it's just testing ReactMultiChild but the
      // last bug in this was actually in DOMChildrenOperations so this test
      // needs to be in some DOM-specific test file.
      var container = document.createElement('div');

      // ABCD
      ReactDOM.render(
        <div>
          <div key="one">
            <div key="A">A</div><div key="B">B</div>
          </div>
          <div key="two">
            <div key="C">C</div><div key="D">D</div>
          </div>
        </div>,
        container,
      );
      // BADC
      ReactDOM.render(
        <div>
          <div key="one">
            <div key="B">B</div><div key="A">A</div>
          </div>
          <div key="two">
            <div key="D">D</div><div key="C">C</div>
          </div>
        </div>,
        container,
      );

      expect(container.textContent).toBe('BADC');
    });
  });

  describe('createOpenTagMarkup', () => {
    var genMarkup;

    function quoteRegexp(str) {
      return (str + '').replace(/([.?*+\^$\[\]\\(){}|-])/g, '\\$1');
    }

    beforeEach(() => {
      var ReactDefaultInjection = require('ReactDefaultInjection');
      ReactDefaultInjection.inject();

      var ReactDOMComponent = require('ReactDOMComponent');
      var ReactReconcileTransaction = require('ReactReconcileTransaction');

      var NodeStub = function(initialProps) {
        this._currentElement = {props: initialProps};
        this._rootNodeID = 1;
      };
      Object.assign(NodeStub.prototype, ReactDOMComponent.Mixin);

      genMarkup = function(props) {
        var transaction = new ReactReconcileTransaction();
        return new NodeStub(props)._createOpenTagMarkupAndPutListeners(
          transaction,
          props,
        );
      };

      jasmine.addMatchers({
        toHaveAttribute() {
          return {
            compare(actual, expected) {
              var [attr, value] = expected;
              var re = '(?:^|\\s)' + attr + '=[\\\'"]';
              if (typeof value !== 'undefined') {
                re += quoteRegexp(value) + '[\\\'"]';
              }
              return {
                pass: new RegExp(re).test(actual),
              };
            },
          };
        },
      });
    });

    it('should generate the correct markup with className', () => {
      expect(genMarkup({className: 'a'})).toHaveAttribute(['class', 'a']);
      expect(genMarkup({className: 'a b'})).toHaveAttribute(['class', 'a b']);
      expect(genMarkup({className: ''})).toHaveAttribute(['class', '']);
    });

    it('should escape style names and values', () => {
      expect(
        genMarkup({
          style: {'b&ckground': '<3'},
        }),
      ).toHaveAttribute(['style', 'b&amp;ckground:&lt;3;']);
    });
  });

  describe('createContentMarkup', () => {
    var genMarkup;

    function quoteRegexp(str) {
      return (str + '').replace(/([.?*+\^$\[\]\\(){}|-])/g, '\\$1');
    }

    beforeEach(() => {
      var ReactDOMComponent = require('ReactDOMComponent');
      var ReactReconcileTransaction = require('ReactReconcileTransaction');

      var NodeStub = function(initialProps) {
        this._currentElement = {props: initialProps};
        this._rootNodeID = 1;
      };
      Object.assign(NodeStub.prototype, ReactDOMComponent.Mixin);

      genMarkup = function(props) {
        var transaction = new ReactReconcileTransaction();
        return new NodeStub(props)._createContentMarkup(transaction, props, {});
      };

      jasmine.addMatchers({
        toHaveInnerhtml() {
          return {
            compare(actual, expected) {
              var re = '^' + quoteRegexp(expected) + '$';
              return {
                pass: new RegExp(re).test(actual),
              };
            },
          };
        },
      });
    });

    it('should handle dangerouslySetInnerHTML', () => {
      var innerHTML = {__html: 'testContent'};
      expect(genMarkup({dangerouslySetInnerHTML: innerHTML})).toHaveInnerhtml(
        'testContent',
      );
    });
  });

  describe('mountComponent', () => {
    var mountComponent;

    beforeEach(() => {
      mountComponent = function(props) {
        var container = document.createElement('div');
        ReactDOM.render(<div {...props} />, container);
      };
    });

    it('should work error event on <source> element', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');
      ReactDOM.render(
        <video>
          <source
            src="http://example.org/video"
            type="video/mp4"
            onError={e => console.error('onError called')}
          />
        </video>,
        container,
      );

      var errorEvent = document.createEvent('Event');
      errorEvent.initEvent('error', false, false);
      container.getElementsByTagName('source')[0].dispatchEvent(errorEvent);

      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain('onError called');
    });

    it('should not duplicate uppercased selfclosing tags', () => {
      class Container extends React.Component {
        render() {
          return React.createElement('BR', null);
        }
      }

      var returnedValue = ReactDOMServer.renderToString(<Container />);
      expect(returnedValue).not.toContain('</BR>');
    });

    it('should warn against children for void elements', () => {
      var container = document.createElement('div');

      expect(function() {
        ReactDOM.render(<input>children</input>, container);
      }).toThrowError(
        'input is a void element tag and must neither have `children` nor ' +
          'use `dangerouslySetInnerHTML`.',
      );
    });

    it('should warn against dangerouslySetInnerHTML for void elements', () => {
      var container = document.createElement('div');

      expect(function() {
        ReactDOM.render(
          <input dangerouslySetInnerHTML={{__html: 'content'}} />,
          container,
        );
      }).toThrowError(
        'input is a void element tag and must neither have `children` nor use ' +
          '`dangerouslySetInnerHTML`.',
      );
    });

    it('should treat menuitem as a void element but still create the closing tag', () => {
      var container = document.createElement('div');

      var returnedValue = ReactDOMServer.renderToString(
        <menu><menuitem /></menu>,
      );

      expect(returnedValue).toContain('</menuitem>');

      expect(function() {
        ReactDOM.render(<menu><menuitem>children</menuitem></menu>, container);
      }).toThrowError(
        'menuitem is a void element tag and must neither have `children` nor use ' +
          '`dangerouslySetInnerHTML`.',
      );
    });

    it('should validate against multiple children props', () => {
      expect(function() {
        mountComponent({children: '', dangerouslySetInnerHTML: ''});
      }).toThrowError(
        'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
      );
    });

    it('should validate against use of innerHTML', () => {
      spyOn(console, 'error');
      mountComponent({innerHTML: '<span>Hi Jim!</span>'});
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Directly setting property `innerHTML` is not permitted. ',
      );
    });

    it('should validate use of dangerouslySetInnerHTML', () => {
      expect(function() {
        mountComponent({dangerouslySetInnerHTML: '<span>Hi Jim!</span>'});
      }).toThrowError(
        '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
          'Please visit https://fb.me/react-invariant-dangerously-set-inner-html for more information.',
      );
    });

    it('should validate use of dangerouslySetInnerHTML', () => {
      expect(function() {
        mountComponent({dangerouslySetInnerHTML: {foo: 'bar'}});
      }).toThrowError(
        '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
          'Please visit https://fb.me/react-invariant-dangerously-set-inner-html for more information.',
      );
    });

    it('should allow {__html: null}', () => {
      expect(function() {
        mountComponent({dangerouslySetInnerHTML: {__html: null}});
      }).not.toThrow();
    });

    it('should warn about contentEditable and children', () => {
      spyOn(console, 'error');
      mountComponent({contentEditable: true, children: ''});
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain('contentEditable');
    });

    it('should respect suppressContentEditableWarning', () => {
      spyOn(console, 'error');
      mountComponent({
        contentEditable: true,
        children: '',
        suppressContentEditableWarning: true,
      });
      expect(console.error.calls.count()).toBe(0);
    });

    it('should validate against invalid styles', () => {
      expect(function() {
        mountComponent({style: 'display: none'});
      }).toThrowError(
        'The `style` prop expects a mapping from style properties to values, ' +
          "not a string. For example, style={{marginRight: spacing + 'em'}} " +
          'when using JSX.',
      );
    });

    it('should execute custom event plugin listening behavior', () => {
      var SimpleEventPlugin = require('SimpleEventPlugin');

      SimpleEventPlugin.didPutListener = jest.fn();
      SimpleEventPlugin.willDeleteListener = jest.fn();

      var container = document.createElement('div');
      ReactDOM.render(<div onClick={() => true} />, container);

      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(1);

      ReactDOM.unmountComponentAtNode(container);

      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(1);
    });

    it('should handle null and missing properly with event hooks', () => {
      var SimpleEventPlugin = require('SimpleEventPlugin');

      SimpleEventPlugin.didPutListener = jest.fn();
      SimpleEventPlugin.willDeleteListener = jest.fn();
      var container = document.createElement('div');

      ReactDOM.render(<div onClick={false} />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(0);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(0);

      ReactDOM.render(<div onClick={null} />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(0);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(0);

      ReactDOM.render(<div onClick={() => 'apple'} />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(1);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(0);

      ReactDOM.render(<div onClick={() => 'banana'} />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(2);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(0);

      ReactDOM.render(<div onClick={null} />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(2);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(1);

      ReactDOM.render(<div />, container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(2);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(1);

      ReactDOM.unmountComponentAtNode(container);
      expect(SimpleEventPlugin.didPutListener.mock.calls.length).toBe(2);
      expect(SimpleEventPlugin.willDeleteListener.mock.calls.length).toBe(1);
    });

    it('should warn for children on void elements', () => {
      class X extends React.Component {
        render() {
          return <input>moo</input>;
        }
      }

      var container = document.createElement('div');
      expect(function() {
        ReactDOM.render(<X />, container);
      }).toThrowError(
        'input is a void element tag and must neither have `children` ' +
          'nor use `dangerouslySetInnerHTML`. Check the render method of X.',
      );
    });

    it('should support custom elements which extend native elements', () => {
      if (ReactDOMFeatureFlags.useCreateElement) {
        var container = document.createElement('div');
        spyOn(document, 'createElement').and.callThrough();
        ReactDOM.render(<div is="custom-div" />, container);
        expect(document.createElement).toHaveBeenCalledWith(
          'div',
          'custom-div',
        );
      } else {
        expect(
          ReactDOMServer.renderToString(<div is="custom-div" />),
        ).toContain('is="custom-div"');
      }
    });
  });

  describe('updateComponent', () => {
    var container;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('should warn against children for void elements', () => {
      ReactDOM.render(<input />, container);

      expect(function() {
        ReactDOM.render(<input>children</input>, container);
      }).toThrowError(
        'input is a void element tag and must neither have `children` nor use ' +
          '`dangerouslySetInnerHTML`.',
      );
    });

    it('should warn against dangerouslySetInnerHTML for void elements', () => {
      ReactDOM.render(<input />, container);

      expect(function() {
        ReactDOM.render(
          <input dangerouslySetInnerHTML={{__html: 'content'}} />,
          container,
        );
      }).toThrowError(
        'input is a void element tag and must neither have `children` nor use ' +
          '`dangerouslySetInnerHTML`.',
      );
    });

    it('should validate against multiple children props', () => {
      ReactDOM.render(<div />, container);

      expect(function() {
        ReactDOM.render(
          <div children="" dangerouslySetInnerHTML={{__html: ''}} />,
          container,
        );
      }).toThrowError(
        'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
      );
    });

    it('should warn about contentEditable and children', () => {
      spyOn(console, 'error');
      ReactDOM.render(<div contentEditable={true}><div /></div>, container);
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain('contentEditable');
    });

    it('should validate against invalid styles', () => {
      ReactDOM.render(<div />, container);

      expect(function() {
        ReactDOM.render(<div style={1} />, container);
      }).toThrowError(
        'The `style` prop expects a mapping from style properties to values, ' +
          "not a string. For example, style={{marginRight: spacing + 'em'}} " +
          'when using JSX.',
      );
    });

    it('should report component containing invalid styles', () => {
      class Animal extends React.Component {
        render() {
          return <div style={1} />;
        }
      }

      expect(function() {
        ReactDOM.render(<Animal />, container);
      }).toThrowError(
        'The `style` prop expects a mapping from style properties to values, ' +
          "not a string. For example, style={{marginRight: spacing + 'em'}} " +
          'when using JSX. This DOM node was rendered by `Animal`.',
      );
    });

    it('should properly escape text content and attributes values', () => {
      expect(
        ReactDOMServer.renderToStaticMarkup(
          React.createElement(
            'div',
            {
              title: '\'"<>&',
              style: {
                textAlign: '\'"<>&',
              },
            },
            '\'"<>&',
          ),
        ),
      ).toBe(
        '<div title="&#x27;&quot;&lt;&gt;&amp;" style="text-align:&#x27;&quot;&lt;&gt;&amp;;">' +
          '&#x27;&quot;&lt;&gt;&amp;' +
          '</div>',
      );
    });
  });

  describe('unmountComponent', () => {
    it('should clean up listeners', () => {
      var EventPluginHub = require('EventPluginHub');
      var ReactDOMComponentTree = require('ReactDOMComponentTree');

      var container = document.createElement('div');
      document.body.appendChild(container);

      var callback = function() {};
      var instance = <div onClick={callback} />;
      instance = ReactDOM.render(instance, container);

      var rootNode = ReactDOM.findDOMNode(instance);
      var inst = ReactDOMComponentTree.getInstanceFromNode(rootNode);
      expect(EventPluginHub.getListener(inst, 'onClick')).toBe(callback);
      expect(rootNode).toBe(ReactDOM.findDOMNode(instance));

      ReactDOM.unmountComponentAtNode(container);

      expect(EventPluginHub.getListener(inst, 'onClick')).toBe(undefined);
    });

    it('unmounts children before unsetting DOM node info', () => {
      class Inner extends React.Component {
        render() {
          return <span />;
        }

        componentWillUnmount() {
          // Should not throw
          expect(ReactDOM.findDOMNode(this).nodeName).toBe('SPAN');
        }
      }

      var container = document.createElement('div');
      ReactDOM.render(<div><Inner /></div>, container);
      ReactDOM.unmountComponentAtNode(container);
    });
  });

  describe('onScroll warning', () => {
    it('should warn about the `onScroll` issue when unsupported (IE8)', () => {
      // Mock this here so we can mimic IE8 support. We require isEventSupported
      // before React so it's pre-mocked before React would require it.
      jest.resetModuleRegistry().mock('isEventSupported');
      var isEventSupported = require('isEventSupported');
      isEventSupported.mockReturnValueOnce(false);

      var ReactTestUtils = require('ReactTestUtils');

      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(<div onScroll={function() {}} />);
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        "Warning: This browser doesn't support the `onScroll` event",
      );
    });

    it('should not warn when server-side rendering `onScroll`', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(<div onScroll={() => {}} />);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('tag sanitization', () => {
    it('should throw when an invalid tag name is used', () => {
      var ReactTestUtils = require('ReactTestUtils');
      var hackzor = React.createElement('script tag');
      expect(() => ReactTestUtils.renderIntoDocument(hackzor)).toThrowError(
        'Invalid tag: script tag',
      );
    });

    it('should throw when an attack vector is used', () => {
      var ReactTestUtils = require('ReactTestUtils');
      var hackzor = React.createElement('div><img /><div');
      expect(() => ReactTestUtils.renderIntoDocument(hackzor)).toThrowError(
        'Invalid tag: div><img /><div',
      );
    });
  });

  describe('nesting validation', () => {
    var ReactTestUtils;

    beforeEach(() => {
      ReactTestUtils = require('ReactTestUtils');
    });

    it('warns on invalid nesting', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(<div><tr /><tr /></div>);

      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: validateDOMNesting(...): <tr> cannot appear as a child of ' +
          '<div>. See div > tr.',
      );
    });

    it('warns on invalid nesting at root', () => {
      spyOn(console, 'error');
      var p = document.createElement('p');
      ReactDOM.render(<span><p /></span>, p);

      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: validateDOMNesting(...): <p> cannot appear as a descendant ' +
          'of <p>. See p > ... > p.',
      );
    });

    it('warns nicely for table rows', () => {
      spyOn(console, 'error');

      class Row extends React.Component {
        render() {
          return <tr>x</tr>;
        }
      }

      class Foo extends React.Component {
        render() {
          return <table><Row /> </table>;
        }
      }

      ReactTestUtils.renderIntoDocument(<Foo />);

      expect(console.error.calls.count()).toBe(3);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: validateDOMNesting(...): <tr> cannot appear as a child of ' +
          '<table>. See Foo > table > Row > tr. Add a <tbody> to your code to ' +
          'match the DOM tree generated by the browser.',
      );
      expect(console.error.calls.argsFor(1)[0]).toBe(
        'Warning: validateDOMNesting(...): Text nodes cannot appear as a ' +
          'child of <tr>. See Row > tr > #text.',
      );
      expect(console.error.calls.argsFor(2)[0]).toBe(
        'Warning: validateDOMNesting(...): Whitespace text nodes cannot ' +
          "appear as a child of <table>. Make sure you don't have any extra " +
          'whitespace between tags on each line of your source code. See Foo > ' +
          'table > #text.',
      );
    });

    it('gives useful context in warnings', () => {
      spyOn(console, 'error');
      function Row() {
        return <tr />;
      }
      function FancyRow() {
        return <Row />;
      }

      class Table extends React.Component {
        render() {
          return <table>{this.props.children}</table>;
        }
      }

      class FancyTable extends React.Component {
        render() {
          return <Table>{this.props.children}</Table>;
        }
      }

      function Viz1() {
        return <table><FancyRow /></table>;
      }
      function App1() {
        return <Viz1 />;
      }
      ReactTestUtils.renderIntoDocument(<App1 />);
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'See Viz1 > table > FancyRow > Row > tr.',
      );

      function Viz2() {
        return <FancyTable><FancyRow /></FancyTable>;
      }
      function App2() {
        return <Viz2 />;
      }
      ReactTestUtils.renderIntoDocument(<App2 />);
      expect(console.error.calls.count()).toBe(2);
      expect(console.error.calls.argsFor(1)[0]).toContain(
        'See Viz2 > FancyTable > Table > table > FancyRow > Row > tr.',
      );

      ReactTestUtils.renderIntoDocument(<FancyTable><FancyRow /></FancyTable>);
      expect(console.error.calls.count()).toBe(3);
      expect(console.error.calls.argsFor(2)[0]).toContain(
        'See FancyTable > Table > table > FancyRow > Row > tr.',
      );

      ReactTestUtils.renderIntoDocument(<table><FancyRow /></table>);
      expect(console.error.calls.count()).toBe(4);
      expect(console.error.calls.argsFor(3)[0]).toContain(
        'See table > FancyRow > Row > tr.',
      );

      ReactTestUtils.renderIntoDocument(<FancyTable><tr /></FancyTable>);
      expect(console.error.calls.count()).toBe(5);
      expect(console.error.calls.argsFor(4)[0]).toContain(
        'See FancyTable > Table > table > tr.',
      );

      class Link extends React.Component {
        render() {
          return <a>{this.props.children}</a>;
        }
      }

      ReactTestUtils.renderIntoDocument(<Link><div><Link /></div></Link>);
      expect(console.error.calls.count()).toBe(6);
      expect(console.error.calls.argsFor(5)[0]).toContain(
        'See Link > a > ... > Link > a.',
      );
    });

    it('should warn about incorrect casing on properties (ssr)', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(
        React.createElement('input', {type: 'text', tabindex: '1'}),
      );
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain('tabIndex');
    });

    it('should warn about incorrect casing on event handlers (ssr)', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(
        React.createElement('input', {type: 'text', onclick: '1'}),
      );
      ReactDOMServer.renderToString(
        React.createElement('input', {type: 'text', onKeydown: '1'}),
      );
      expect(console.error.calls.count()).toBe(2);
      expect(console.error.calls.argsFor(0)[0]).toContain('onClick');
      expect(console.error.calls.argsFor(1)[0]).toContain('onKeyDown');
    });

    it('should warn about incorrect casing on properties', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(
        React.createElement('input', {type: 'text', tabindex: '1'}),
      );
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain('tabIndex');
    });

    it('should warn about incorrect casing on event handlers', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(
        React.createElement('input', {type: 'text', onclick: '1'}),
      );
      ReactTestUtils.renderIntoDocument(
        React.createElement('input', {type: 'text', onKeydown: '1'}),
      );
      expect(console.error.calls.count()).toBe(2);
      expect(console.error.calls.argsFor(0)[0]).toContain('onClick');
      expect(console.error.calls.argsFor(1)[0]).toContain('onKeyDown');
    });

    it('should warn about class', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(
        React.createElement('div', {class: 'muffins'}),
      );
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain('className');
    });

    it('should warn about props that are no longer supported', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(<div />);
      expect(console.error.calls.count()).toBe(0);

      ReactTestUtils.renderIntoDocument(<div onFocusIn={() => {}} />);
      expect(console.error.calls.count()).toBe(1);

      ReactTestUtils.renderIntoDocument(<div onFocusOut={() => {}} />);
      expect(console.error.calls.count()).toBe(2);
    });

    it('gives source code refs for unknown prop warning', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(<div class="paladin" />);
      ReactDOMServer.renderToString(<input type="text" onclick="1" />);
      expect(console.error.calls.count()).toBe(2);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown DOM property class. Did you mean className?\n    in div (at **)',
      );
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
        'Warning: Unknown event handler property onclick. Did you mean ' +
          '`onClick`?\n    in input (at **)',
      );
    });

    it('gives source code refs for unknown prop warning for update render', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');

      ReactDOMServer.renderToString(<div className="paladin" />, container);
      expect(console.error.calls.count()).toBe(0);

      ReactDOMServer.renderToString(<div class="paladin" />, container);
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown DOM property class. Did you mean className?\n    in div (at **)',
      );
    });

    it('gives source code refs for unknown prop warning for exact elements ', () => {
      spyOn(console, 'error');

      ReactDOMServer.renderToString(
        <div className="foo1">
          <div class="foo2" />
          <div onClick="foo3" />
          <div onclick="foo4" />
          <div className="foo5" />
          <div className="foo6" />
        </div>,
      );

      expect(console.error.calls.count()).toBe(2);

      expect(console.error.calls.argsFor(0)[0]).toContain('className');
      var matches = console.error.calls.argsFor(0)[0].match(/.*\(.*:(\d+)\).*/);
      var previousLine = matches[1];

      expect(console.error.calls.argsFor(1)[0]).toContain('onClick');
      matches = console.error.calls.argsFor(1)[0].match(/.*\(.*:(\d+)\).*/);
      var currentLine = matches[1];

      //verify line number has a proper relative difference,
      //since hard coding the line number would make test too brittle
      expect(parseInt(previousLine, 10) + 2).toBe(parseInt(currentLine, 10));
    });

    it('gives source code refs for unknown prop warning for exact elements in composition ', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');

      class Parent extends React.Component {
        render() {
          return <div><Child1 /><Child2 /><Child3 /><Child4 /></div>;
        }
      }

      class Child1 extends React.Component {
        render() {
          return <div class="paladin">Child1</div>;
        }
      }

      class Child2 extends React.Component {
        render() {
          return <div>Child2</div>;
        }
      }

      class Child3 extends React.Component {
        render() {
          return <div onclick="1">Child3</div>;
        }
      }

      class Child4 extends React.Component {
        render() {
          return <div>Child4</div>;
        }
      }

      ReactDOMServer.renderToString(<Parent />, container);

      expect(console.error.calls.count()).toBe(2);

      expect(console.error.calls.argsFor(0)[0]).toContain('className');
      var matches = console.error.calls.argsFor(0)[0].match(/.*\(.*:(\d+)\).*/);
      var previousLine = matches[1];

      expect(console.error.calls.argsFor(1)[0]).toContain('onClick');
      matches = console.error.calls.argsFor(1)[0].match(/.*\(.*:(\d+)\).*/);
      var currentLine = matches[1];

      //verify line number has a proper relative difference,
      //since hard coding the line number would make test too brittle
      expect(parseInt(previousLine, 10) + 12).toBe(parseInt(currentLine, 10));
    });

    it('should suggest property name if available', () => {
      spyOn(console, 'error');

      ReactTestUtils.renderIntoDocument(
        React.createElement('label', {for: 'test'}),
      );
      ReactTestUtils.renderIntoDocument(
        React.createElement('input', {type: 'text', autofocus: true}),
      );

      expect(console.error.calls.count()).toBe(2);

      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Unknown DOM property for. Did you mean htmlFor?\n    in label',
      );

      expect(console.error.calls.argsFor(1)[0]).toBe(
        'Warning: Unknown DOM property autofocus. Did you mean autoFocus?\n    in input',
      );
    });
  });
});

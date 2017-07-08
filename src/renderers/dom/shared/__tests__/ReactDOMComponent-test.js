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
  var ReactTestUtils;
  var ReactDOM;
  var ReactDOMServer;
  var inputValueTracking;
  var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');
    // TODO: can we express this test with only public API?
    inputValueTracking = require('inputValueTracking');
  });

  describe('updateDOM', () => {
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

    it('should not update styles when mutating a proxy style object', () => {
      var styleStore = {display: 'none', fontFamily: 'Arial', lineHeight: 1.2};
      // We use a proxy style object so that we can mutate it even if it is
      // frozen in DEV.
      var styles = {
        get display() {
          return styleStore.display;
        },
        set display(v) {
          styleStore.display = v;
        },
        get fontFamily() {
          return styleStore.fontFamily;
        },
        set fontFamily(v) {
          styleStore.fontFamily = v;
        },
        get lineHeight() {
          return styleStore.lineHeight;
        },
        set lineHeight(v) {
          styleStore.lineHeight = v;
        },
      };
      var container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      var stubStyle = container.firstChild.style;
      stubStyle.display = styles.display;
      stubStyle.fontFamily = styles.fontFamily;

      styles.display = 'block';

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('none');
      expect(stubStyle.fontFamily).toEqual('Arial');
      expect(stubStyle.lineHeight).toEqual('1.2');

      styles.fontFamily = 'Helvetica';

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('none');
      expect(stubStyle.fontFamily).toEqual('Arial');
      expect(stubStyle.lineHeight).toEqual('1.2');

      styles.lineHeight = 0.5;

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('none');
      expect(stubStyle.fontFamily).toEqual('Arial');
      expect(stubStyle.lineHeight).toEqual('1.2');

      ReactDOM.render(<div style={undefined} />, container);
      expect(stubStyle.display).toBe('');
      expect(stubStyle.fontFamily).toBe('');
      expect(stubStyle.lineHeight).toBe('');
    });

    it('should throw when mutating style objectsd', () => {
      var style = {border: '1px solid black'};

      class App extends React.Component {
        state = {style: style};

        render() {
          return <div style={this.state.style}>asd</div>;
        }
      }

      ReactTestUtils.renderIntoDocument(<App />);
      expectDev(() => (style.position = 'absolute')).toThrow();
    });

    it('should warn for unknown prop', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');
      ReactDOM.render(<div foo="bar" />, container);
      expectDev(console.error.calls.count(0)).toBe(1);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown prop `foo` on <div> tag. Remove this prop from the element. ' +
          'For details, see https://fb.me/react-unknown-prop\n    in div (at **)',
      );
    });

    it('should group multiple unknown prop warnings together', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');
      ReactDOM.render(<div foo="bar" baz="qux" />, container);
      expectDev(console.error.calls.count(0)).toBe(1);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown props `foo`, `baz` on <div> tag. Remove these props from the element. ' +
          'For details, see https://fb.me/react-unknown-prop\n    in div (at **)',
      );
    });

    it('should warn for onDblClick prop', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');
      ReactDOM.render(<div onDblClick={() => {}} />, container);
      expectDev(console.error.calls.count(0)).toBe(1);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown event handler property onDblClick. Did you mean `onDoubleClick`?\n    in div (at **)',
      );
    });

    it('should not warn for "0" as a unitless style value', () => {
      spyOn(console, 'error');

      class Component extends React.Component {
        render() {
          return <div style={{margin: '0'}} />;
        }
      }

      ReactTestUtils.renderIntoDocument(<Component />);
      expectDev(console.error.calls.count()).toBe(0);
    });

    it('should warn nicely about NaN in style', () => {
      spyOn(console, 'error');

      var style = {fontSize: NaN};
      var div = document.createElement('div');
      ReactDOM.render(<span style={style} />, div);
      ReactDOM.render(<span style={style} />, div);

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toEqual(
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

    it('should allow named slot projection on both web components and regular DOM elements', () => {
      var container = document.createElement('div');

      ReactDOM.render(
        <my-component>
          <my-second-component slot="first" />
          <button slot="second">Hello</button>
        </my-component>,
        container,
      );

      var lightDOM = container.firstChild.childNodes;

      expect(lightDOM[0].getAttribute('slot')).toBe('first');
      expect(lightDOM[1].getAttribute('slot')).toBe('second');
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

    it('should render null and undefined as empty but print other falsy values', () => {
      var container = document.createElement('div');

      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: 'textContent'}} />,
        container,
      );
      expect(container.textContent).toEqual('textContent');

      ReactDOM.render(<div dangerouslySetInnerHTML={{__html: 0}} />, container);
      expect(container.textContent).toEqual('0');

      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: false}} />,
        container,
      );
      expect(container.textContent).toEqual('false');

      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: ''}} />,
        container,
      );
      expect(container.textContent).toEqual('');

      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: null}} />,
        container,
      );
      expect(container.textContent).toEqual('');

      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: undefined}} />,
        container,
      );
      expect(container.textContent).toEqual('');
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
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toEqual(
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
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toEqual(
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

    it('should not reset innerHTML for when children is null', () => {
      var container = document.createElement('div');
      ReactDOM.render(<div />, container);
      container.firstChild.innerHTML = 'bonjour';
      expect(container.firstChild.innerHTML).toEqual('bonjour');

      ReactDOM.render(<div />, container);
      expect(container.firstChild.innerHTML).toEqual('bonjour');
    });

    it('should reset innerHTML when switching from a direct text child to an empty child', () => {
      const transitionToValues = [null, undefined, false];
      transitionToValues.forEach(transitionToValue => {
        var container = document.createElement('div');
        ReactDOM.render(<div>bonjour</div>, container);
        expect(container.firstChild.innerHTML).toEqual('bonjour');

        ReactDOM.render(<div>{transitionToValue}</div>, container);
        expect(container.firstChild.innerHTML).toEqual('');
      });
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
    function quoteRegexp(str) {
      return (str + '').replace(/([.?*+\^$\[\]\\(){}|-])/g, '\\$1');
    }

    function toHaveAttribute(actual, expected) {
      var [attr, value] = expected;
      var re = '(?:^|\\s)' + attr + '=[\\\'"]';
      if (typeof value !== 'undefined') {
        re += quoteRegexp(value) + '[\\\'"]';
      }
      return new RegExp(re).test(actual);
    }

    function genMarkup(props) {
      return ReactDOMServer.renderToString(<div {...props} />);
    }

    it('should generate the correct markup with className', () => {
      expect(toHaveAttribute(genMarkup({className: 'a'}), ['class', 'a']));
      expect(toHaveAttribute(genMarkup({className: 'a b'}), ['class', 'a b']));
      expect(toHaveAttribute(genMarkup({className: ''}), ['class', '']));
    });

    it('should escape style names and values', () => {
      expect(
        toHaveAttribute(
          genMarkup({
            style: {'b&ckground': '<3'},
          }),
          ['style', 'b&amp;ckground:&lt;3;'],
        ),
      );
    });
  });

  describe('createContentMarkup', () => {
    function quoteRegexp(str) {
      return (str + '').replace(/([.?*+\^$\[\]\\(){}|-])/g, '\\$1');
    }

    function genMarkup(props) {
      return ReactDOMServer.renderToString(<div {...props} />);
    }

    function toHaveInnerhtml(actual, expected) {
      var re = '^' + quoteRegexp(expected) + '$';
      return new RegExp(re).test(actual);
    }

    it('should handle dangerouslySetInnerHTML', () => {
      var innerHTML = {__html: 'testContent'};
      expect(
        toHaveInnerhtml(
          genMarkup({dangerouslySetInnerHTML: innerHTML}),
          'testContent',
        ),
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

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain('onError called');
    });

    it('should not duplicate uppercased selfclosing tags', () => {
      spyOn(console, 'error');
      class Container extends React.Component {
        render() {
          return React.createElement('BR', null);
        }
      }

      var returnedValue = ReactDOMServer.renderToString(<Container />);
      expect(returnedValue).not.toContain('</BR>');
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        '<BR /> is using uppercase HTML.',
      );
    });

    it('should warn on upper case HTML tags, not SVG nor custom tags', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(
        React.createElement('svg', null, React.createElement('PATH')),
      );
      expectDev(console.error.calls.count()).toBe(0);
      ReactTestUtils.renderIntoDocument(React.createElement('CUSTOM-TAG'));
      expectDev(console.error.calls.count()).toBe(0);
      ReactTestUtils.renderIntoDocument(React.createElement('IMG'));
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        '<IMG /> is using uppercase HTML.',
      );
    });

    it('should warn if the tag is unrecognized', () => {
      spyOn(console, 'error');

      let realToString;
      try {
        realToString = Object.prototype.toString;
        let wrappedToString = function() {
          // Emulate browser behavior which is missing in jsdom
          if (this instanceof window.HTMLUnknownElement) {
            return '[object HTMLUnknownElement]';
          }
          return realToString.apply(this, arguments);
        };
        Object.prototype.toString = wrappedToString; // eslint-disable-line no-extend-native
        ReactTestUtils.renderIntoDocument(<mycustomcomponent />);
      } finally {
        Object.prototype.toString = realToString; // eslint-disable-line no-extend-native
      }

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'The tag <mycustomcomponent> is unrecognized in this browser',
      );
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

    it('should include owner rather than parent in warnings', () => {
      var container = document.createElement('div');

      function Parent(props) {
        return props.children;
      }
      function Owner() {
        // We're using the input dangerouslySetInnerHTML invariant but the
        // exact error doesn't matter as long as we have a way to verify
        // that warnings and invariants contain owner rather than parent name.
        return (
          <Parent>
            <input dangerouslySetInnerHTML={{__html: 'content'}} />
          </Parent>
        );
      }

      expect(function() {
        ReactDOM.render(<Owner />, container);
      }).toThrowError('\n\nThis DOM node was rendered by `Owner`.');
    });

    it('should emit a warning once for a named custom component using shady DOM', () => {
      spyOn(console, 'error');

      var defaultCreateElement = document.createElement.bind(document);

      try {
        document.createElement = element => {
          var container = defaultCreateElement(element);
          container.shadyRoot = {};
          return container;
        };
        class ShadyComponent extends React.Component {
          render() {
            return <polymer-component />;
          }
        }
        var node = document.createElement('div');
        ReactDOM.render(<ShadyComponent />, node);
        expectDev(console.error.calls.count()).toBe(1);
        expectDev(console.error.calls.argsFor(0)[0]).toContain(
          'ShadyComponent is using shady DOM. Using shady DOM with React can ' +
            'cause things to break subtly.',
        );
        mountComponent({is: 'custom-shady-div2'});
        expectDev(console.error.calls.count()).toBe(1);
      } finally {
        document.createElement = defaultCreateElement;
      }
    });

    it('should emit a warning once for an unnamed custom component using shady DOM', () => {
      spyOn(console, 'error');

      var defaultCreateElement = document.createElement.bind(document);

      try {
        document.createElement = element => {
          var container = defaultCreateElement(element);
          container.shadyRoot = {};
          return container;
        };

        mountComponent({is: 'custom-shady-div'});
        expectDev(console.error.calls.count()).toBe(1);
        expectDev(console.error.calls.argsFor(0)[0]).toContain(
          'A component is using shady DOM. Using shady DOM with React can ' +
            'cause things to break subtly.',
        );

        mountComponent({is: 'custom-shady-div2'});
        expectDev(console.error.calls.count()).toBe(1);
      } finally {
        document.createElement = defaultCreateElement;
      }
    });

    it('should treat menuitem as a void element but still create the closing tag', () => {
      // menuitem is not implemented in jsdom, so this triggers the unknown warning error
      spyOn(console, 'error');
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
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
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
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain('contentEditable');
    });

    it('should respect suppressContentEditableWarning', () => {
      spyOn(console, 'error');
      mountComponent({
        contentEditable: true,
        children: '',
        suppressContentEditableWarning: true,
      });
      expectDev(console.error.calls.count()).toBe(0);
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

    it('should track input values', () => {
      var container = document.createElement('div');
      var inst = ReactDOM.render(
        <input type="text" defaultValue="foo" />,
        container,
      );

      var tracker = inputValueTracking._getTrackerFromNode(inst);

      expect(tracker.getValue()).toEqual('foo');
    });

    it('should track textarea values', () => {
      var container = document.createElement('div');
      var inst = ReactDOM.render(<textarea defaultValue="foo" />, container);

      var tracker = inputValueTracking._getTrackerFromNode(inst);

      expect(tracker.getValue()).toEqual('foo');
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
          'nor use `dangerouslySetInnerHTML`.\n\nThis DOM node was rendered by `X`.',
      );
    });

    it('should support custom elements which extend native elements', () => {
      var container = document.createElement('div');
      spyOn(document, 'createElement').and.callThrough();
      ReactDOM.render(<div is="custom-div" />, container);
      expect(document.createElement).toHaveBeenCalledWith('div', {
        is: 'custom-div',
      });
    });

    it('should work load and error events on <image> element in SVG', () => {
      spyOn(console, 'log');
      var container = document.createElement('div');
      ReactDOM.render(
        <svg>
          <image
            xlinkHref="http://example.org/image"
            onError={e => console.log('onError called')}
            onLoad={e => console.log('onLoad called')}
          />
        </svg>,
        container,
      );

      var loadEvent = document.createEvent('Event');
      var errorEvent = document.createEvent('Event');

      loadEvent.initEvent('load', false, false);
      errorEvent.initEvent('error', false, false);

      container.getElementsByTagName('image')[0].dispatchEvent(errorEvent);
      container.getElementsByTagName('image')[0].dispatchEvent(loadEvent);

      expectDev(console.log.calls.count()).toBe(2);
      expectDev(console.log.calls.argsFor(0)[0]).toContain('onError called');
      expectDev(console.log.calls.argsFor(1)[0]).toContain('onLoad called');
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
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain('contentEditable');
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
          'when using JSX.\n\nThis DOM node was rendered by `Animal`.',
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
        '<div title="&#x27;&quot;&lt;&gt;&amp;" style="text-align:&#x27;&quot;&lt;&gt;&amp;">' +
          '&#x27;&quot;&lt;&gt;&amp;' +
          '</div>',
      );
    });
  });

  describe('unmountComponent', () => {
    // Fiber does not have a clean-up phase for host components; relies on GC
    if (!ReactDOMFeatureFlags.useFiber) {
      it('should clean up input value tracking', () => {
        var container = document.createElement('div');
        var node = ReactDOM.render(
          <input type="text" defaultValue="foo" />,
          container,
        );
        var tracker = inputValueTracking._getTrackerFromNode(node);

        spyOn(tracker, 'stopTracking');

        ReactDOM.unmountComponentAtNode(container);

        expect(tracker.stopTracking.calls.count()).toBe(1);
      });

      it('should clean up input textarea tracking', () => {
        var container = document.createElement('div');
        var node = ReactDOM.render(<textarea defaultValue="foo" />, container);
        var tracker = inputValueTracking._getTrackerFromNode(node);

        spyOn(tracker, 'stopTracking');

        ReactDOM.unmountComponentAtNode(container);

        expect(tracker.stopTracking.calls.count()).toBe(1);
      });
    }

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

  describe('tag sanitization', () => {
    it('should throw when an invalid tag name is used server-side', () => {
      var hackzor = React.createElement('script tag');
      expect(() => ReactDOMServer.renderToString(hackzor)).toThrowError(
        'Invalid tag: script tag',
      );
    });

    it('should throw when an attack vector is used server-side', () => {
      var hackzor = React.createElement('div><img /><div');
      expect(() => ReactDOMServer.renderToString(hackzor)).toThrowError(
        'Invalid tag: div><img /><div',
      );
    });

    it('should throw when an invalid tag name is used', () => {
      var hackzor = React.createElement('script tag');
      expect(() => ReactTestUtils.renderIntoDocument(hackzor)).toThrow();
    });

    it('should throw when an attack vector is used', () => {
      var hackzor = React.createElement('div><img /><div');
      expect(() => ReactTestUtils.renderIntoDocument(hackzor)).toThrow();
    });
  });

  describe('nesting validation', () => {
    it('warns on invalid nesting', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(<div><tr /><tr /></div>);

      var addendum = ReactDOMFeatureFlags.useFiber
        ? '\n    in tr (at **)' + '\n    in div (at **)'
        : ' See div > tr.';

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: validateDOMNesting(...): <tr> cannot appear as a child of ' +
          '<div>.' +
          addendum,
      );
    });

    it('warns on invalid nesting at root', () => {
      spyOn(console, 'error');
      var p = document.createElement('p');
      ReactDOM.render(<span><p /></span>, p);

      var addendum = ReactDOMFeatureFlags.useFiber
        ? // There is no outer `p` here because root container is not part of the stack.
          '\n    in p (at **)' + '\n    in span (at **)'
        : ' See p > ... > p.';

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: validateDOMNesting(...): <p> cannot appear as a descendant ' +
          'of <p>.' +
          addendum,
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
      expectDev(console.error.calls.count()).toBe(3);

      var addendum1 = ReactDOMFeatureFlags.useFiber
        ? '\n    in tr (at **)' +
            '\n    in Row (at **)' +
            '\n    in table (at **)' +
            '\n    in Foo (at **)'
        : ' See Foo > table > Row > tr.';
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: validateDOMNesting(...): <tr> cannot appear as a child of ' +
          '<table>. Add a <tbody> to your code to match the DOM tree generated ' +
          'by the browser.' +
          addendum1,
      );

      var addendum2 = ReactDOMFeatureFlags.useFiber
        ? '\n    in tr (at **)' +
            '\n    in Row (at **)' +
            '\n    in table (at **)' +
            '\n    in Foo (at **)'
        : ' See Row > tr > #text.';
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
        'Warning: validateDOMNesting(...): Text nodes cannot appear as a ' +
          'child of <tr>.' +
          addendum2,
      );

      var addendum3 = ReactDOMFeatureFlags.useFiber
        ? '\n    in table (at **)' + '\n    in Foo (at **)'
        : ' See Foo > table > #text.';
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(2)[0])).toBe(
        'Warning: validateDOMNesting(...): Whitespace text nodes cannot ' +
          "appear as a child of <table>. Make sure you don't have any extra " +
          'whitespace between tags on each line of your source code.' +
          addendum3,
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
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(
        normalizeCodeLocInfo(console.error.calls.argsFor(0)[0]),
      ).toContain(
        ReactDOMFeatureFlags.useFiber
          ? '\n    in tr (at **)' +
              '\n    in Row (at **)' +
              '\n    in FancyRow (at **)' +
              '\n    in table (at **)' +
              '\n    in Viz1 (at **)'
          : 'See Viz1 > table > FancyRow > Row > tr.',
      );

      function Viz2() {
        return <FancyTable><FancyRow /></FancyTable>;
      }
      function App2() {
        return <Viz2 />;
      }
      ReactTestUtils.renderIntoDocument(<App2 />);
      expectDev(console.error.calls.count()).toBe(2);
      expectDev(
        normalizeCodeLocInfo(console.error.calls.argsFor(1)[0]),
      ).toContain(
        ReactDOMFeatureFlags.useFiber
          ? '\n    in tr (at **)' +
              '\n    in Row (at **)' +
              '\n    in FancyRow (at **)' +
              '\n    in table (at **)' +
              '\n    in Table (at **)' +
              '\n    in FancyTable (at **)' +
              '\n    in Viz2 (at **)'
          : 'See Viz2 > FancyTable > Table > table > FancyRow > Row > tr.',
      );

      ReactTestUtils.renderIntoDocument(<FancyTable><FancyRow /></FancyTable>);
      expectDev(console.error.calls.count()).toBe(3);
      expectDev(
        normalizeCodeLocInfo(console.error.calls.argsFor(2)[0]),
      ).toContain(
        ReactDOMFeatureFlags.useFiber
          ? '\n    in tr (at **)' +
              '\n    in Row (at **)' +
              '\n    in FancyRow (at **)' +
              '\n    in table (at **)' +
              '\n    in Table (at **)' +
              '\n    in FancyTable (at **)'
          : 'See FancyTable > Table > table > FancyRow > Row > tr.',
      );

      ReactTestUtils.renderIntoDocument(<table><FancyRow /></table>);
      expectDev(console.error.calls.count()).toBe(4);
      expectDev(
        normalizeCodeLocInfo(console.error.calls.argsFor(3)[0]),
      ).toContain(
        ReactDOMFeatureFlags.useFiber
          ? '\n    in tr (at **)' +
              '\n    in Row (at **)' +
              '\n    in FancyRow (at **)' +
              '\n    in table (at **)'
          : 'See table > FancyRow > Row > tr.',
      );

      ReactTestUtils.renderIntoDocument(<FancyTable><tr /></FancyTable>);
      expectDev(console.error.calls.count()).toBe(5);
      expectDev(
        normalizeCodeLocInfo(console.error.calls.argsFor(4)[0]),
      ).toContain(
        ReactDOMFeatureFlags.useFiber
          ? '\n    in tr (at **)' +
              '\n    in table (at **)' +
              '\n    in Table (at **)' +
              '\n    in FancyTable (at **)'
          : 'See FancyTable > Table > table > tr.',
      );

      class Link extends React.Component {
        render() {
          return <a>{this.props.children}</a>;
        }
      }

      ReactTestUtils.renderIntoDocument(<Link><div><Link /></div></Link>);
      expectDev(console.error.calls.count()).toBe(6);
      expectDev(
        normalizeCodeLocInfo(console.error.calls.argsFor(5)[0]),
      ).toContain(
        ReactDOMFeatureFlags.useFiber
          ? '\n    in a (at **)' +
              '\n    in Link (at **)' +
              '\n    in div (at **)' +
              '\n    in a (at **)' +
              '\n    in Link (at **)'
          : 'See Link > a > ... > Link > a.',
      );
    });

    it('should warn about incorrect casing on properties (ssr)', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(
        React.createElement('input', {type: 'text', tabindex: '1'}),
      );
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain('tabIndex');
    });

    it('should warn about incorrect casing on event handlers (ssr)', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(
        React.createElement('input', {type: 'text', onclick: '1'}),
      );
      ReactDOMServer.renderToString(
        React.createElement('input', {type: 'text', onKeydown: '1'}),
      );
      expectDev(console.error.calls.count()).toBe(2);
      expectDev(console.error.calls.argsFor(0)[0]).toContain('onClick');
      expectDev(console.error.calls.argsFor(1)[0]).toContain('onKeyDown');
    });

    it('should warn about incorrect casing on properties', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(
        React.createElement('input', {type: 'text', tabindex: '1'}),
      );
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain('tabIndex');
    });

    it('should warn about incorrect casing on event handlers', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(
        React.createElement('input', {type: 'text', onclick: '1'}),
      );
      ReactTestUtils.renderIntoDocument(
        React.createElement('input', {type: 'text', onKeydown: '1'}),
      );
      expectDev(console.error.calls.count()).toBe(2);
      expectDev(console.error.calls.argsFor(0)[0]).toContain('onClick');
      expectDev(console.error.calls.argsFor(1)[0]).toContain('onKeyDown');
    });

    it('should warn about class', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(
        React.createElement('div', {class: 'muffins'}),
      );
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain('className');
    });

    it('should warn about class (ssr)', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(
        React.createElement('div', {class: 'muffins'}),
      );
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain('className');
    });

    it('should warn about props that are no longer supported', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(<div />);
      expectDev(console.error.calls.count()).toBe(0);

      ReactTestUtils.renderIntoDocument(<div onFocusIn={() => {}} />);
      expectDev(console.error.calls.count()).toBe(1);

      ReactTestUtils.renderIntoDocument(<div onFocusOut={() => {}} />);
      expectDev(console.error.calls.count()).toBe(2);
    });

    it('should warn about props that are no longer supported (ssr)', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(<div />);
      expectDev(console.error.calls.count()).toBe(0);

      ReactDOMServer.renderToString(<div onFocusIn={() => {}} />);
      expectDev(console.error.calls.count()).toBe(1);

      ReactDOMServer.renderToString(<div onFocusOut={() => {}} />);
      expectDev(console.error.calls.count()).toBe(2);
    });

    it('gives source code refs for unknown prop warning', () => {
      spyOn(console, 'error');
      ReactTestUtils.renderIntoDocument(<div class="paladin" />);
      ReactTestUtils.renderIntoDocument(<input type="text" onclick="1" />);
      expectDev(console.error.calls.count()).toBe(2);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown DOM property class. Did you mean className?\n    in div (at **)',
      );
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
        'Warning: Unknown event handler property onclick. Did you mean ' +
          '`onClick`?\n    in input (at **)',
      );
    });

    it('gives source code refs for unknown prop warning (ssr)', () => {
      spyOn(console, 'error');
      ReactDOMServer.renderToString(<div class="paladin" />);
      ReactDOMServer.renderToString(<input type="text" onclick="1" />);
      expectDev(console.error.calls.count()).toBe(2);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown DOM property class. Did you mean className?\n    in div (at **)',
      );
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
        'Warning: Unknown event handler property onclick. Did you mean ' +
          '`onClick`?\n    in input (at **)',
      );
    });

    it('gives source code refs for unknown prop warning for update render', () => {
      spyOn(console, 'error');
      var container = document.createElement('div');

      ReactTestUtils.renderIntoDocument(<div className="paladin" />, container);
      expectDev(console.error.calls.count()).toBe(0);

      ReactTestUtils.renderIntoDocument(<div class="paladin" />, container);
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: Unknown DOM property class. Did you mean className?\n    in div (at **)',
      );
    });

    it('gives source code refs for unknown prop warning for exact elements', () => {
      spyOn(console, 'error');

      ReactTestUtils.renderIntoDocument(
        <div className="foo1">
          <div class="foo2" />
          <div onClick="foo3" />
          <div onclick="foo4" />
          <div className="foo5" />
          <div className="foo6" />
        </div>,
      );

      expectDev(console.error.calls.count()).toBe(2);

      expectDev(console.error.calls.argsFor(0)[0]).toContain('className');
      var matches = console.error.calls.argsFor(0)[0].match(/.*\(.*:(\d+)\).*/);
      var previousLine = matches[1];

      expectDev(console.error.calls.argsFor(1)[0]).toContain('onClick');
      matches = console.error.calls.argsFor(1)[0].match(/.*\(.*:(\d+)\).*/);
      var currentLine = matches[1];

      //verify line number has a proper relative difference,
      //since hard coding the line number would make test too brittle
      expect(parseInt(previousLine, 10) + 2).toBe(parseInt(currentLine, 10));
    });

    it('gives source code refs for unknown prop warning for exact elements (ssr)', () => {
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

      expectDev(console.error.calls.count()).toBe(2);

      expectDev(console.error.calls.argsFor(0)[0]).toContain('className');
      var matches = console.error.calls.argsFor(0)[0].match(/.*\(.*:(\d+)\).*/);
      var previousLine = (matches || [])[1];

      expectDev(console.error.calls.argsFor(1)[0]).toContain('onClick');
      matches = console.error.calls.argsFor(1)[0].match(/.*\(.*:(\d+)\).*/) || {
      };
      var currentLine = (matches || [])[1];

      //verify line number has a proper relative difference,
      //since hard coding the line number would make test too brittle
      expectDev(parseInt(previousLine, 10) + 2).toBe(parseInt(currentLine, 10));
    });

    it('gives source code refs for unknown prop warning for exact elements in composition', () => {
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

      ReactTestUtils.renderIntoDocument(<Parent />, container);

      expectDev(console.error.calls.count()).toBe(2);

      expectDev(console.error.calls.argsFor(0)[0]).toContain('className');
      var matches = console.error.calls.argsFor(0)[0].match(/.*\(.*:(\d+)\).*/);
      var previousLine = (matches || [])[1];

      expectDev(console.error.calls.argsFor(1)[0]).toContain('onClick');
      matches = console.error.calls.argsFor(1)[0].match(/.*\(.*:(\d+)\).*/);
      var currentLine = (matches || [])[1];

      //verify line number has a proper relative difference,
      //since hard coding the line number would make test too brittle
      expect(parseInt(previousLine, 10) + 12).toBe(parseInt(currentLine, 10));
    });

    it('gives source code refs for unknown prop warning for exact elements in composition (ssr)', () => {
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

      expectDev(console.error.calls.count()).toBe(2);

      expectDev(console.error.calls.argsFor(0)[0]).toContain('className');
      var matches = console.error.calls.argsFor(0)[0].match(/.*\(.*:(\d+)\).*/);
      var previousLine = (matches || [])[1];

      expectDev(console.error.calls.argsFor(1)[0]).toContain('onClick');
      matches = console.error.calls.argsFor(1)[0].match(/.*\(.*:(\d+)\).*/);
      var currentLine = (matches || [])[1];

      //verify line number has a proper relative difference,
      //since hard coding the line number would make test too brittle
      expectDev(parseInt(previousLine, 10) + 12).toBe(
        parseInt(currentLine, 10),
      );
    });

    it('should suggest property name if available', () => {
      spyOn(console, 'error');

      ReactTestUtils.renderIntoDocument(
        React.createElement('label', {for: 'test'}),
      );
      ReactTestUtils.renderIntoDocument(
        React.createElement('input', {type: 'text', autofocus: true}),
      );

      expectDev(console.error.calls.count()).toBe(2);

      expectDev(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Unknown DOM property for. Did you mean htmlFor?\n    in label',
      );

      expectDev(console.error.calls.argsFor(1)[0]).toBe(
        'Warning: Unknown DOM property autofocus. Did you mean autoFocus?\n    in input',
      );
    });

    it('should suggest property name if available (ssr)', () => {
      spyOn(console, 'error');

      ReactDOMServer.renderToString(
        React.createElement('label', {for: 'test'}),
      );
      ReactDOMServer.renderToString(
        React.createElement('input', {type: 'text', autofocus: true}),
      );

      expectDev(console.error.calls.count()).toBe(2);

      expectDev(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Unknown DOM property for. Did you mean htmlFor?\n    in label',
      );

      expectDev(console.error.calls.argsFor(1)[0]).toBe(
        'Warning: Unknown DOM property autofocus. Did you mean autoFocus?\n    in input',
      );
    });
  });

  describe('whitespace', () => {
    it('renders innerHTML and preserves whitespace', () => {
      const container = document.createElement('div');
      const html = '\n  \t  <span>  \n  testContent  \t  </span>  \n  \t';
      const elem = <div dangerouslySetInnerHTML={{__html: html}} />;

      ReactDOM.render(elem, container);
      expect(container.firstChild.innerHTML).toBe(html);
    });

    it('render and then updates innerHTML and preserves whitespace', () => {
      const container = document.createElement('div');
      const html = '\n  \t  <span>  \n  testContent1  \t  </span>  \n  \t';
      const elem = <div dangerouslySetInnerHTML={{__html: html}} />;
      ReactDOM.render(elem, container);

      const html2 = '\n  \t  <div>  \n  testContent2  \t  </div>  \n  \t';
      const elem2 = <div dangerouslySetInnerHTML={{__html: html2}} />;
      ReactDOM.render(elem2, container);

      expect(container.firstChild.innerHTML).toBe(html2);
    });
  });
});

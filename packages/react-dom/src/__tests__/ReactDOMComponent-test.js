/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMComponent', () => {
  let React;
  let ReactTestUtils;
  let ReactDOM;
  let ReactDOMServer;

  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');
  });

  describe('updateDOM', () => {
    it('should handle className', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div style={{}} />, container);

      ReactDOM.render(<div className={'foo'} />, container);
      expect(container.firstChild.className).toEqual('foo');
      ReactDOM.render(<div className={'bar'} />, container);
      expect(container.firstChild.className).toEqual('bar');
      ReactDOM.render(<div className={null} />, container);
      expect(container.firstChild.className).toEqual('');
    });

    it('should gracefully handle various style value types', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div style={{}} />, container);
      const stubStyle = container.firstChild.style;

      // set initial style
      const setup = {
        display: 'block',
        left: '1px',
        top: 2,
        fontFamily: 'Arial',
      };
      ReactDOM.render(<div style={setup} />, container);
      expect(stubStyle.display).toEqual('block');
      expect(stubStyle.left).toEqual('1px');
      expect(stubStyle.top).toEqual('2px');
      expect(stubStyle.fontFamily).toEqual('Arial');

      // reset the style to their default state
      const reset = {display: '', left: null, top: false, fontFamily: true};
      ReactDOM.render(<div style={reset} />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.left).toEqual('');
      expect(stubStyle.top).toEqual('');
      expect(stubStyle.fontFamily).toEqual('');
    });

    it('should not update styles when mutating a proxy style object', () => {
      const styleStore = {
        display: 'none',
        fontFamily: 'Arial',
        lineHeight: 1.2,
      };
      // We use a proxy style object so that we can mutate it even if it is
      // frozen in DEV.
      const styles = {
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
      const container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      const stubStyle = container.firstChild.style;
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

    it('should throw when mutating style objects', () => {
      const style = {border: '1px solid black'};

      class App extends React.Component {
        state = {style: style};

        render() {
          return <div style={this.state.style}>asd</div>;
        }
      }

      ReactTestUtils.renderIntoDocument(<App />);
      if (__DEV__) {
        expect(() => (style.position = 'absolute')).toThrow();
      }
    });

    it('should warn for unknown prop', () => {
      const container = document.createElement('div');
      expect(() =>
        ReactDOM.render(<div foo={() => {}} />, container),
      ).toWarnDev(
        'Warning: Invalid value for prop `foo` on <div> tag. Either remove it ' +
          'from the element, or pass a string or number value to keep ' +
          'it in the DOM. For details, see https://fb.me/react-attribute-behavior' +
          '\n    in div (at **)',
      );
    });

    it('should group multiple unknown prop warnings together', () => {
      const container = document.createElement('div');
      expect(() =>
        ReactDOM.render(<div foo={() => {}} baz={() => {}} />, container),
      ).toWarnDev(
        'Warning: Invalid values for props `foo`, `baz` on <div> tag. Either remove ' +
          'them from the element, or pass a string or number value to keep ' +
          'them in the DOM. For details, see https://fb.me/react-attribute-behavior' +
          '\n    in div (at **)',
      );
    });

    it('should warn for onDblClick prop', () => {
      const container = document.createElement('div');
      expect(() =>
        ReactDOM.render(<div onDblClick={() => {}} />, container),
      ).toWarnDev(
        'Warning: Invalid event handler property `onDblClick`. Did you mean `onDoubleClick`?\n    in div (at **)',
      );
    });

    it('should warn for unknown string event handlers', () => {
      const container = document.createElement('div');
      expect(() =>
        ReactDOM.render(<div onUnknown="alert(&quot;hack&quot;)" />, container),
      ).toWarnDev(
        'Warning: Unknown event handler property `onUnknown`. It will be ignored.\n    in div (at **)',
      );
      expect(container.firstChild.hasAttribute('onUnknown')).toBe(false);
      expect(container.firstChild.onUnknown).toBe(undefined);
      expect(() =>
        ReactDOM.render(<div onunknown="alert(&quot;hack&quot;)" />, container),
      ).toWarnDev(
        'Warning: Unknown event handler property `onunknown`. It will be ignored.\n    in div (at **)',
      );
      expect(container.firstChild.hasAttribute('onunknown')).toBe(false);
      expect(container.firstChild.onunknown).toBe(undefined);
      expect(() =>
        ReactDOM.render(
          <div on-unknown="alert(&quot;hack&quot;)" />,
          container,
        ),
      ).toWarnDev(
        'Warning: Unknown event handler property `on-unknown`. It will be ignored.\n    in div (at **)',
      );
      expect(container.firstChild.hasAttribute('on-unknown')).toBe(false);
      expect(container.firstChild['on-unknown']).toBe(undefined);
    });

    it('should warn for unknown function event handlers', () => {
      const container = document.createElement('div');
      expect(() =>
        ReactDOM.render(<div onUnknown={function() {}} />, container),
      ).toWarnDev(
        'Warning: Unknown event handler property `onUnknown`. It will be ignored.\n    in div (at **)',
      );
      expect(container.firstChild.hasAttribute('onUnknown')).toBe(false);
      expect(container.firstChild.onUnknown).toBe(undefined);
      expect(() =>
        ReactDOM.render(<div onunknown={function() {}} />, container),
      ).toWarnDev(
        'Warning: Unknown event handler property `onunknown`. It will be ignored.\n    in div (at **)',
      );
      expect(container.firstChild.hasAttribute('onunknown')).toBe(false);
      expect(container.firstChild.onunknown).toBe(undefined);
      expect(() =>
        ReactDOM.render(<div on-unknown={function() {}} />, container),
      ).toWarnDev(
        'Warning: Unknown event handler property `on-unknown`. It will be ignored.\n    in div (at **)',
      );
      expect(container.firstChild.hasAttribute('on-unknown')).toBe(false);
      expect(container.firstChild['on-unknown']).toBe(undefined);
    });

    it('should warn for badly cased React attributes', () => {
      const container = document.createElement('div');
      expect(() => ReactDOM.render(<div CHILDREN="5" />, container)).toWarnDev(
        'Warning: Invalid DOM property `CHILDREN`. Did you mean `children`?\n    in div (at **)',
      );
      expect(container.firstChild.getAttribute('CHILDREN')).toBe('5');
    });

    it('should not warn for "0" as a unitless style value', () => {
      class Component extends React.Component {
        render() {
          return <div style={{margin: '0'}} />;
        }
      }

      ReactTestUtils.renderIntoDocument(<Component />);
    });

    it('should warn nicely about NaN in style', () => {
      const style = {fontSize: NaN};
      const div = document.createElement('div');
      expect(() => ReactDOM.render(<span style={style} />, div)).toWarnDev(
        'Warning: `NaN` is an invalid value for the `fontSize` css style property.' +
          '\n    in span (at **)',
      );
      ReactDOM.render(<span style={style} />, div);
    });

    it('should update styles if initially null', () => {
      let styles = null;
      const container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      const stubStyle = container.firstChild.style;

      styles = {display: 'block'};

      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('block');
    });

    it('should update styles if updated to null multiple times', () => {
      let styles = null;
      const container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      styles = {display: 'block'};
      const stubStyle = container.firstChild.style;

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
      const container = document.createElement('div');

      ReactDOM.render(
        <my-component>
          <my-second-component slot="first" />
          <button slot="second">Hello</button>
        </my-component>,
        container,
      );

      const lightDOM = container.firstChild.childNodes;

      expect(lightDOM[0].getAttribute('slot')).toBe('first');
      expect(lightDOM[1].getAttribute('slot')).toBe('second');
    });

    it('should skip reserved props on web components', () => {
      const container = document.createElement('div');

      ReactDOM.render(
        <my-component
          children={['foo']}
          suppressContentEditableWarning={true}
          suppressHydrationWarning={true}
        />,
        container,
      );
      expect(container.firstChild.hasAttribute('children')).toBe(false);
      expect(
        container.firstChild.hasAttribute('suppressContentEditableWarning'),
      ).toBe(false);
      expect(
        container.firstChild.hasAttribute('suppressHydrationWarning'),
      ).toBe(false);

      ReactDOM.render(
        <my-component
          children={['bar']}
          suppressContentEditableWarning={false}
          suppressHydrationWarning={false}
        />,
        container,
      );
      expect(container.firstChild.hasAttribute('children')).toBe(false);
      expect(
        container.firstChild.hasAttribute('suppressContentEditableWarning'),
      ).toBe(false);
      expect(
        container.firstChild.hasAttribute('suppressHydrationWarning'),
      ).toBe(false);
    });

    it('should skip dangerouslySetInnerHTML on web components', () => {
      const container = document.createElement('div');

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
      const container = document.createElement('div');

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
      const container = document.createElement('div');
      ReactDOM.render(<img height="17" />, container);

      expect(container.firstChild.hasAttribute('height')).toBe(true);
      ReactDOM.render(<img />, container);
      expect(container.firstChild.hasAttribute('height')).toBe(false);
    });

    it('should remove properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div className="monkey" />, container);

      expect(container.firstChild.className).toEqual('monkey');
      ReactDOM.render(<div />, container);
      expect(container.firstChild.className).toEqual('');
    });

    it('should not set null/undefined attributes', () => {
      const container = document.createElement('div');
      // Initial render.
      ReactDOM.render(<img src={null} data-foo={undefined} />, container);
      const node = container.firstChild;
      expect(node.hasAttribute('src')).toBe(false);
      expect(node.hasAttribute('data-foo')).toBe(false);
      // Update in one direction.
      ReactDOM.render(<img src={undefined} data-foo={null} />, container);
      expect(node.hasAttribute('src')).toBe(false);
      expect(node.hasAttribute('data-foo')).toBe(false);
      // Update in another direction.
      ReactDOM.render(<img src={null} data-foo={undefined} />, container);
      expect(node.hasAttribute('src')).toBe(false);
      expect(node.hasAttribute('data-foo')).toBe(false);
      // Removal.
      ReactDOM.render(<img />, container);
      expect(node.hasAttribute('src')).toBe(false);
      expect(node.hasAttribute('data-foo')).toBe(false);
      // Addition.
      ReactDOM.render(<img src={undefined} data-foo={null} />, container);
      expect(node.hasAttribute('src')).toBe(false);
      expect(node.hasAttribute('data-foo')).toBe(false);
    });

    it('should apply React-specific aliases to HTML elements', () => {
      const container = document.createElement('div');
      ReactDOM.render(<form acceptCharset="foo" />, container);
      const node = container.firstChild;
      // Test attribute initialization.
      expect(node.getAttribute('accept-charset')).toBe('foo');
      expect(node.hasAttribute('acceptCharset')).toBe(false);
      // Test attribute update.
      ReactDOM.render(<form acceptCharset="boo" />, container);
      expect(node.getAttribute('accept-charset')).toBe('boo');
      expect(node.hasAttribute('acceptCharset')).toBe(false);
      // Test attribute removal by setting to null.
      ReactDOM.render(<form acceptCharset={null} />, container);
      expect(node.hasAttribute('accept-charset')).toBe(false);
      expect(node.hasAttribute('acceptCharset')).toBe(false);
      // Restore.
      ReactDOM.render(<form acceptCharset="foo" />, container);
      expect(node.getAttribute('accept-charset')).toBe('foo');
      expect(node.hasAttribute('acceptCharset')).toBe(false);
      // Test attribute removal by setting to undefined.
      ReactDOM.render(<form acceptCharset={undefined} />, container);
      expect(node.hasAttribute('accept-charset')).toBe(false);
      expect(node.hasAttribute('acceptCharset')).toBe(false);
      // Restore.
      ReactDOM.render(<form acceptCharset="foo" />, container);
      expect(node.getAttribute('accept-charset')).toBe('foo');
      expect(node.hasAttribute('acceptCharset')).toBe(false);
      // Test attribute removal.
      ReactDOM.render(<form />, container);
      expect(node.hasAttribute('accept-charset')).toBe(false);
      expect(node.hasAttribute('acceptCharset')).toBe(false);
    });

    it('should apply React-specific aliases to SVG elements', () => {
      const container = document.createElement('div');
      ReactDOM.render(<svg arabicForm="foo" />, container);
      const node = container.firstChild;
      // Test attribute initialization.
      expect(node.getAttribute('arabic-form')).toBe('foo');
      expect(node.hasAttribute('arabicForm')).toBe(false);
      // Test attribute update.
      ReactDOM.render(<svg arabicForm="boo" />, container);
      expect(node.getAttribute('arabic-form')).toBe('boo');
      expect(node.hasAttribute('arabicForm')).toBe(false);
      // Test attribute removal by setting to null.
      ReactDOM.render(<svg arabicForm={null} />, container);
      expect(node.hasAttribute('arabic-form')).toBe(false);
      expect(node.hasAttribute('arabicForm')).toBe(false);
      // Restore.
      ReactDOM.render(<svg arabicForm="foo" />, container);
      expect(node.getAttribute('arabic-form')).toBe('foo');
      expect(node.hasAttribute('arabicForm')).toBe(false);
      // Test attribute removal by setting to undefined.
      ReactDOM.render(<svg arabicForm={undefined} />, container);
      expect(node.hasAttribute('arabic-form')).toBe(false);
      expect(node.hasAttribute('arabicForm')).toBe(false);
      // Restore.
      ReactDOM.render(<svg arabicForm="foo" />, container);
      expect(node.getAttribute('arabic-form')).toBe('foo');
      expect(node.hasAttribute('arabicForm')).toBe(false);
      // Test attribute removal.
      ReactDOM.render(<svg />, container);
      expect(node.hasAttribute('arabic-form')).toBe(false);
      expect(node.hasAttribute('arabicForm')).toBe(false);
    });

    it('should properly update custom attributes on custom elements', () => {
      const container = document.createElement('div');
      ReactDOM.render(<some-custom-element foo="bar" />, container);
      ReactDOM.render(<some-custom-element bar="buzz" />, container);
      const node = container.firstChild;
      expect(node.hasAttribute('foo')).toBe(false);
      expect(node.getAttribute('bar')).toBe('buzz');
    });

    it('should not apply React-specific aliases to custom elements', () => {
      const container = document.createElement('div');
      ReactDOM.render(<some-custom-element arabicForm="foo" />, container);
      const node = container.firstChild;
      // Should not get transformed to arabic-form as SVG would be.
      expect(node.getAttribute('arabicForm')).toBe('foo');
      expect(node.hasAttribute('arabic-form')).toBe(false);
      // Test attribute update.
      ReactDOM.render(<some-custom-element arabicForm="boo" />, container);
      expect(node.getAttribute('arabicForm')).toBe('boo');
      // Test attribute removal and addition.
      ReactDOM.render(<some-custom-element acceptCharset="buzz" />, container);
      // Verify the previous attribute was removed.
      expect(node.hasAttribute('arabicForm')).toBe(false);
      // Should not get transformed to accept-charset as HTML would be.
      expect(node.getAttribute('acceptCharset')).toBe('buzz');
      expect(node.hasAttribute('accept-charset')).toBe(false);
    });

    it('should clear a single style prop when changing `style`', () => {
      let styles = {display: 'none', color: 'red'};
      const container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      const stubStyle = container.firstChild.style;

      styles = {color: 'green'};
      ReactDOM.render(<div style={styles} />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('green');
    });

    it('should reject attribute key injection attack on markup', () => {
      expect(() => {
        for (let i = 0; i < 3; i++) {
          const container = document.createElement('div');
          const element = React.createElement(
            'x-foo-component',
            {'blah" onclick="beevil" noise="hi': 'selected'},
            null,
          );
          ReactDOM.render(element, container);
        }
      }).toWarnDev(
        'Warning: Invalid attribute name: `blah" onclick="beevil" noise="hi`',
        {withoutStack: true}, // TODO: add a stack
      );
    });

    it('should reject attribute key injection attack on update', () => {
      expect(() => {
        for (let i = 0; i < 3; i++) {
          const container = document.createElement('div');
          const beforeUpdate = React.createElement('x-foo-component', {}, null);
          ReactDOM.render(beforeUpdate, container);

          const afterUpdate = React.createElement(
            'x-foo-component',
            {'blah" onclick="beevil" noise="hi': 'selected'},
            null,
          );
          ReactDOM.render(afterUpdate, container);
        }
      }).toWarnDev(
        'Warning: Invalid attribute name: `blah" onclick="beevil" noise="hi`',
        {withoutStack: true}, // TODO: add a stack
      );
    });

    it('should update arbitrary attributes for tags containing dashes', () => {
      const container = document.createElement('div');

      const beforeUpdate = React.createElement('x-foo-component', {}, null);
      ReactDOM.render(beforeUpdate, container);

      const afterUpdate = <x-foo-component myattr="myval" />;
      ReactDOM.render(afterUpdate, container);

      expect(container.childNodes[0].getAttribute('myattr')).toBe('myval');
    });

    it('should clear all the styles when removing `style`', () => {
      const styles = {display: 'none', color: 'red'};
      const container = document.createElement('div');
      ReactDOM.render(<div style={styles} />, container);

      const stubStyle = container.firstChild.style;

      ReactDOM.render(<div />, container);
      expect(stubStyle.display).toEqual('');
      expect(stubStyle.color).toEqual('');
    });

    it('should update styles when `style` changes from null to object', () => {
      const container = document.createElement('div');
      const styles = {color: 'red'};
      ReactDOM.render(<div style={styles} />, container);
      ReactDOM.render(<div />, container);
      ReactDOM.render(<div style={styles} />, container);

      const stubStyle = container.firstChild.style;
      expect(stubStyle.color).toEqual('red');
    });

    it('should not reset innerHTML for when children is null', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div />, container);
      container.firstChild.innerHTML = 'bonjour';
      expect(container.firstChild.innerHTML).toEqual('bonjour');

      ReactDOM.render(<div />, container);
      expect(container.firstChild.innerHTML).toEqual('bonjour');
    });

    it('should reset innerHTML when switching from a direct text child to an empty child', () => {
      const transitionToValues = [null, undefined, false];
      transitionToValues.forEach(transitionToValue => {
        const container = document.createElement('div');
        ReactDOM.render(<div>bonjour</div>, container);
        expect(container.firstChild.innerHTML).toEqual('bonjour');

        ReactDOM.render(<div>{transitionToValue}</div>, container);
        expect(container.firstChild.innerHTML).toEqual('');
      });
    });

    it('should empty element when removing innerHTML', () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: ':)'}} />,
        container,
      );

      expect(container.firstChild.innerHTML).toEqual(':)');
      ReactDOM.render(<div />, container);
      expect(container.firstChild.innerHTML).toEqual('');
    });

    it('should transition from string content to innerHTML', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div>hello</div>, container);

      expect(container.firstChild.innerHTML).toEqual('hello');
      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: 'goodbye'}} />,
        container,
      );
      expect(container.firstChild.innerHTML).toEqual('goodbye');
    });

    it('should transition from innerHTML to string content', () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: 'bonjour'}} />,
        container,
      );

      expect(container.firstChild.innerHTML).toEqual('bonjour');
      ReactDOM.render(<div>adieu</div>, container);
      expect(container.firstChild.innerHTML).toEqual('adieu');
    });

    it('should transition from innerHTML to children in nested el', () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <div>
          <div dangerouslySetInnerHTML={{__html: 'bonjour'}} />
        </div>,
        container,
      );

      expect(container.textContent).toEqual('bonjour');
      ReactDOM.render(
        <div>
          <div>
            <span>adieu</span>
          </div>
        </div>,
        container,
      );
      expect(container.textContent).toEqual('adieu');
    });

    it('should transition from children to innerHTML in nested el', () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <div>
          <div>
            <span>adieu</span>
          </div>
        </div>,
        container,
      );

      expect(container.textContent).toEqual('adieu');
      ReactDOM.render(
        <div>
          <div dangerouslySetInnerHTML={{__html: 'bonjour'}} />
        </div>,
        container,
      );
      expect(container.textContent).toEqual('bonjour');
    });

    it('should not incur unnecessary DOM mutations for attributes', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div id="" />, container);

      const node = container.firstChild;
      const nodeSetAttribute = node.setAttribute;
      node.setAttribute = jest.fn();
      node.setAttribute.mockImplementation(nodeSetAttribute);

      const nodeRemoveAttribute = node.removeAttribute;
      node.removeAttribute = jest.fn();
      node.removeAttribute.mockImplementation(nodeRemoveAttribute);

      ReactDOM.render(<div id="" />, container);
      expect(node.setAttribute).toHaveBeenCalledTimes(0);
      expect(node.removeAttribute).toHaveBeenCalledTimes(0);

      ReactDOM.render(<div id="foo" />, container);
      expect(node.setAttribute).toHaveBeenCalledTimes(1);
      expect(node.removeAttribute).toHaveBeenCalledTimes(0);

      ReactDOM.render(<div id="foo" />, container);
      expect(node.setAttribute).toHaveBeenCalledTimes(1);
      expect(node.removeAttribute).toHaveBeenCalledTimes(0);

      ReactDOM.render(<div />, container);
      expect(node.setAttribute).toHaveBeenCalledTimes(1);
      expect(node.removeAttribute).toHaveBeenCalledTimes(1);

      ReactDOM.render(<div id="" />, container);
      expect(node.setAttribute).toHaveBeenCalledTimes(2);
      expect(node.removeAttribute).toHaveBeenCalledTimes(1);

      ReactDOM.render(<div />, container);
      expect(node.setAttribute).toHaveBeenCalledTimes(2);
      expect(node.removeAttribute).toHaveBeenCalledTimes(2);
    });

    it('should not incur unnecessary DOM mutations for string properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div value="" />, container);

      const node = container.firstChild;

      const nodeValueSetter = jest.fn();

      const oldSetAttribute = node.setAttribute.bind(node);
      node.setAttribute = function(key, value) {
        oldSetAttribute(key, value);
        nodeValueSetter(key, value);
      };

      ReactDOM.render(<div value="foo" />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(1);

      ReactDOM.render(<div value="foo" />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(1);

      ReactDOM.render(<div />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(1);

      ReactDOM.render(<div value={null} />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(1);

      ReactDOM.render(<div value="" />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(2);

      ReactDOM.render(<div />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(2);
    });

    it('should not incur unnecessary DOM mutations for boolean properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div checked={true} />, container);

      const node = container.firstChild;
      let nodeValue = true;
      const nodeValueSetter = jest.fn();
      Object.defineProperty(node, 'checked', {
        get: function() {
          return nodeValue;
        },
        set: nodeValueSetter.mockImplementation(function(newValue) {
          nodeValue = newValue;
        }),
      });

      ReactDOM.render(<div checked={true} />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(0);

      ReactDOM.render(<div />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(1);

      ReactDOM.render(<div checked={false} />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(2);

      ReactDOM.render(<div checked={true} />, container);
      expect(nodeValueSetter).toHaveBeenCalledTimes(3);
    });

    it('should ignore attribute whitelist for elements with the "is" attribute', () => {
      const container = document.createElement('div');
      ReactDOM.render(<button is="test" cowabunga="chevynova" />, container);
      expect(container.firstChild.hasAttribute('cowabunga')).toBe(true);
    });

    it('should warn about non-string "is" attribute', () => {
      const container = document.createElement('div');
      expect(() =>
        ReactDOM.render(<button is={function() {}} />, container),
      ).toWarnDev(
        'Received a `function` for a string attribute `is`. If this is expected, cast ' +
          'the value to a string.',
      );
    });

    it('should not update when switching between null/undefined', () => {
      const container = document.createElement('div');
      const node = ReactDOM.render(<div />, container);

      const setter = jest.fn();
      node.setAttribute = setter;

      ReactDOM.render(<div dir={null} />, container);
      ReactDOM.render(<div dir={undefined} />, container);
      ReactDOM.render(<div />, container);
      expect(setter).toHaveBeenCalledTimes(0);
      ReactDOM.render(<div dir="ltr" />, container);
      expect(setter).toHaveBeenCalledTimes(1);
    });

    it('handles multiple child updates without interference', () => {
      // This test might look like it's just testing ReactMultiChild but the
      // last bug in this was actually in DOMChildrenOperations so this test
      // needs to be in some DOM-specific test file.
      const container = document.createElement('div');

      // ABCD
      ReactDOM.render(
        <div>
          <div key="one">
            <div key="A">A</div>
            <div key="B">B</div>
          </div>
          <div key="two">
            <div key="C">C</div>
            <div key="D">D</div>
          </div>
        </div>,
        container,
      );
      // BADC
      ReactDOM.render(
        <div>
          <div key="one">
            <div key="B">B</div>
            <div key="A">A</div>
          </div>
          <div key="two">
            <div key="D">D</div>
            <div key="C">C</div>
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
      const [attr, value] = expected;
      let re = '(?:^|\\s)' + attr + '=[\\\'"]';
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
      const re = '^' + quoteRegexp(expected) + '$';
      return new RegExp(re).test(actual);
    }

    it('should handle dangerouslySetInnerHTML', () => {
      const innerHTML = {__html: 'testContent'};
      expect(
        toHaveInnerhtml(
          genMarkup({dangerouslySetInnerHTML: innerHTML}),
          'testContent',
        ),
      );
    });
  });

  describe('mountComponent', () => {
    let mountComponent;

    beforeEach(() => {
      mountComponent = function(props) {
        const container = document.createElement('div');
        ReactDOM.render(<div {...props} />, container);
      };
    });

    it('should work error event on <source> element', () => {
      spyOnDevAndProd(console, 'log');
      const container = document.createElement('div');
      ReactDOM.render(
        <video>
          <source
            src="http://example.org/video"
            type="video/mp4"
            onError={e => console.log('onError called')}
          />
        </video>,
        container,
      );

      const errorEvent = document.createEvent('Event');
      errorEvent.initEvent('error', false, false);
      container.getElementsByTagName('source')[0].dispatchEvent(errorEvent);

      if (__DEV__) {
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log.calls.argsFor(0)[0]).toContain('onError called');
      }
    });

    it('should not duplicate uppercased selfclosing tags', () => {
      class Container extends React.Component {
        render() {
          return React.createElement('BR', null);
        }
      }

      let returnedValue;

      expect(() => {
        returnedValue = ReactDOMServer.renderToString(<Container />);
      }).toWarnDev(
        '<BR /> is using incorrect casing. ' +
          'Use PascalCase for React components, ' +
          'or lowercase for HTML elements.',
        {withoutStack: true}, // TODO: add a stack
      );
      expect(returnedValue).not.toContain('</BR>');
    });

    it('should warn on upper case HTML tags, not SVG nor custom tags', () => {
      ReactTestUtils.renderIntoDocument(
        React.createElement('svg', null, React.createElement('PATH')),
      );
      ReactTestUtils.renderIntoDocument(React.createElement('CUSTOM-TAG'));

      expect(() =>
        ReactTestUtils.renderIntoDocument(React.createElement('IMG')),
      ).toWarnDev(
        '<IMG /> is using incorrect casing. ' +
          'Use PascalCase for React components, ' +
          'or lowercase for HTML elements.',
        {withoutStack: true}, // TODO: add a stack
      );
    });

    it('should warn on props reserved for future use', () => {
      expect(() =>
        ReactTestUtils.renderIntoDocument(<div aria="hello" />),
      ).toWarnDev(
        'The `aria` attribute is reserved for future use in React. ' +
          'Pass individual `aria-` attributes instead.',
        {withoutStack: true}, // TODO: add a stack
      );
    });

    it('should warn if the tag is unrecognized', () => {
      let realToString;
      try {
        realToString = Object.prototype.toString;
        let wrappedToString = function() {
          // Emulate browser behavior which is missing in jsdom
          if (this instanceof window.HTMLUnknownElement) {
            return '[object HTMLUnknownElement]';
          }
          // Special case! Read explanation below in the test.
          if (this instanceof window.HTMLTimeElement) {
            return '[object HTMLUnknownElement]';
          }
          return realToString.apply(this, arguments);
        };
        Object.prototype.toString = wrappedToString; // eslint-disable-line no-extend-native

        expect(() => ReactTestUtils.renderIntoDocument(<bar />)).toWarnDev(
          'The tag <bar> is unrecognized in this browser',
          {withoutStack: true}, // TODO: add a stack
        );
        // Test deduplication
        expect(() => ReactTestUtils.renderIntoDocument(<foo />)).toWarnDev(
          'The tag <foo> is unrecognized in this browser',
          {withoutStack: true}, // TODO: add a stack
        );
        ReactTestUtils.renderIntoDocument(<foo />);
        // This is a funny case.
        // Chrome is the only major browser not shipping <time>. But as of July
        // 2017 it intends to ship it due to widespread usage. We intentionally
        // *don't* warn for <time> even if it's unrecognized by Chrome because
        // it soon will be, and many apps have been using it anyway.
        ReactTestUtils.renderIntoDocument(<time />);
        // Corner case. Make sure out deduplication logic doesn't break with weird tag.
        expect(() =>
          ReactTestUtils.renderIntoDocument(<hasOwnProperty />),
        ).toWarnDev(
          [
            '<hasOwnProperty /> is using incorrect casing. ' +
              'Use PascalCase for React components, ' +
              'or lowercase for HTML elements.',
            'The tag <hasOwnProperty> is unrecognized in this browser',
          ],
          {withoutStack: true}, // TODO: add a stack
        );
      } finally {
        Object.prototype.toString = realToString; // eslint-disable-line no-extend-native
      }
    });

    it('should throw on children for void elements', () => {
      const container = document.createElement('div');
      let caughtErr;
      try {
        ReactDOM.render(<input>children</input>, container);
      } catch (err) {
        caughtErr = err;
      }
      expect(caughtErr).not.toBe(undefined);
      expect(normalizeCodeLocInfo(caughtErr.message)).toContain(
        'input is a void element tag and must neither have `children` nor ' +
          'use `dangerouslySetInnerHTML`.' +
          (__DEV__ ? '\n    in input (at **)' : ''),
      );
    });

    it('should throw on dangerouslySetInnerHTML for void elements', () => {
      const container = document.createElement('div');
      let caughtErr;
      try {
        ReactDOM.render(
          <input dangerouslySetInnerHTML={{__html: 'content'}} />,
          container,
        );
      } catch (err) {
        caughtErr = err;
      }
      expect(caughtErr).not.toBe(undefined);
      expect(normalizeCodeLocInfo(caughtErr.message)).toContain(
        'input is a void element tag and must neither have `children` nor ' +
          'use `dangerouslySetInnerHTML`.' +
          (__DEV__ ? '\n    in input (at **)' : ''),
      );
    });

    it('should emit a warning once for a named custom component using shady DOM', () => {
      const defaultCreateElement = document.createElement.bind(document);

      try {
        document.createElement = element => {
          const container = defaultCreateElement(element);
          container.shadyRoot = {};
          return container;
        };
        class ShadyComponent extends React.Component {
          render() {
            return <polymer-component />;
          }
        }
        const node = document.createElement('div');
        expect(() => ReactDOM.render(<ShadyComponent />, node)).toWarnDev(
          'ShadyComponent is using shady DOM. Using shady DOM with React can ' +
            'cause things to break subtly.',
          {withoutStack: true}, // TODO: add a stack
        );
        mountComponent({is: 'custom-shady-div2'});
      } finally {
        document.createElement = defaultCreateElement;
      }
    });

    it('should emit a warning once for an unnamed custom component using shady DOM', () => {
      const defaultCreateElement = document.createElement.bind(document);

      try {
        document.createElement = element => {
          const container = defaultCreateElement(element);
          container.shadyRoot = {};
          return container;
        };

        expect(() => mountComponent({is: 'custom-shady-div'})).toWarnDev(
          'A component is using shady DOM. Using shady DOM with React can ' +
            'cause things to break subtly.',
          {withoutStack: true}, // TODO: add a stack
        );

        // No additional warnings are expected
        mountComponent({is: 'custom-shady-div2'});
      } finally {
        document.createElement = defaultCreateElement;
      }
    });

    it('should treat menuitem as a void element but still create the closing tag', () => {
      // menuitem is not implemented in jsdom, so this triggers the unknown warning error
      const container = document.createElement('div');

      const returnedValue = ReactDOMServer.renderToString(
        <menu>
          <menuitem />
        </menu>,
      );

      expect(returnedValue).toContain('</menuitem>');

      expect(function() {
        expect(() => {
          ReactDOM.render(
            <menu>
              <menuitem>children</menuitem>
            </menu>,
            container,
          );
        }).toWarnDev('The tag <menuitem> is unrecognized in this browser.');
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
      expect(() =>
        mountComponent({innerHTML: '<span>Hi Jim!</span>'}),
      ).toWarnDev('Directly setting property `innerHTML` is not permitted. ', {
        withoutStack: true, // TODO: add a stack
      });
    });

    it('should validate against use of innerHTML without case sensitivity', () => {
      expect(() =>
        mountComponent({innerhtml: '<span>Hi Jim!</span>'}),
      ).toWarnDev('Directly setting property `innerHTML` is not permitted. ', {
        withoutStack: true, // TODO: add a stack
      });
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
      expect(() =>
        mountComponent({contentEditable: true, children: ''}),
      ).toWarnDev(
        'Warning: A component is `contentEditable` and contains `children` ' +
          'managed by React. It is now your responsibility to guarantee that ' +
          'none of those nodes are unexpectedly modified or duplicated. This ' +
          'is probably not intentional.\n    in div (at **)',
      );
    });

    it('should respect suppressContentEditableWarning', () => {
      mountComponent({
        contentEditable: true,
        children: '',
        suppressContentEditableWarning: true,
      });
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

    it('should throw for children on void elements', () => {
      class X extends React.Component {
        render() {
          return <input>moo</input>;
        }
      }

      const container = document.createElement('div');
      let caughtErr;
      try {
        ReactDOM.render(<X />, container);
      } catch (err) {
        caughtErr = err;
      }

      expect(caughtErr).not.toBe(undefined);
      expect(normalizeCodeLocInfo(caughtErr.message)).toContain(
        'input is a void element tag and must neither have `children` ' +
          'nor use `dangerouslySetInnerHTML`.' +
          (__DEV__ ? '\n    in input (at **)' + '\n    in X (at **)' : ''),
      );
    });

    it('should support custom elements which extend native elements', () => {
      const container = document.createElement('div');
      spyOnDevAndProd(document, 'createElement').and.callThrough();
      ReactDOM.render(<div is="custom-div" />, container);
      expect(document.createElement).toHaveBeenCalledWith('div', {
        is: 'custom-div',
      });
    });

    it('should work load and error events on <image> element in SVG', () => {
      spyOnDevAndProd(console, 'log');
      const container = document.createElement('div');
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

      const loadEvent = document.createEvent('Event');
      const errorEvent = document.createEvent('Event');

      loadEvent.initEvent('load', false, false);
      errorEvent.initEvent('error', false, false);

      container.getElementsByTagName('image')[0].dispatchEvent(errorEvent);
      container.getElementsByTagName('image')[0].dispatchEvent(loadEvent);

      if (__DEV__) {
        expect(console.log).toHaveBeenCalledTimes(2);
        expect(console.log.calls.argsFor(0)[0]).toContain('onError called');
        expect(console.log.calls.argsFor(1)[0]).toContain('onLoad called');
      }
    });

    it('should receive a load event on <link> elements', () => {
      const container = document.createElement('div');
      const onLoad = jest.fn();

      ReactDOM.render(
        <link href="http://example.org/link" onLoad={onLoad} />,
        container,
      );

      const loadEvent = document.createEvent('Event');
      const link = container.getElementsByTagName('link')[0];

      loadEvent.initEvent('load', false, false);
      link.dispatchEvent(loadEvent);

      expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it('should receive an error event on <link> elements', () => {
      const container = document.createElement('div');
      const onError = jest.fn();

      ReactDOM.render(
        <link href="http://example.org/link" onError={onError} />,
        container,
      );

      const errorEvent = document.createEvent('Event');
      const link = container.getElementsByTagName('link')[0];

      errorEvent.initEvent('error', false, false);
      link.dispatchEvent(errorEvent);

      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateComponent', () => {
    let container;

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
      expect(() => {
        ReactDOM.render(
          <div contentEditable={true}>
            <div />
          </div>,
          container,
        );
      }).toWarnDev('contentEditable');
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

      let caughtErr;
      try {
        ReactDOM.render(<Animal />, container);
      } catch (err) {
        caughtErr = err;
      }

      expect(caughtErr).not.toBe(undefined);
      expect(normalizeCodeLocInfo(caughtErr.message)).toContain(
        'The `style` prop expects a mapping from style properties to values, ' +
          "not a string. For example, style={{marginRight: spacing + 'em'}} " +
          'when using JSX.' +
          (__DEV__ ? '\n    in div (at **)' + '\n    in Animal (at **)' : ''),
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

      const container = document.createElement('div');
      ReactDOM.render(
        <div>
          <Inner />
        </div>,
        container,
      );
      ReactDOM.unmountComponentAtNode(container);
    });
  });

  describe('tag sanitization', () => {
    it('should throw when an invalid tag name is used server-side', () => {
      const hackzor = React.createElement('script tag');
      expect(() => ReactDOMServer.renderToString(hackzor)).toThrowError(
        'Invalid tag: script tag',
      );
    });

    it('should throw when an attack vector is used server-side', () => {
      const hackzor = React.createElement('div><img /><div');
      expect(() => ReactDOMServer.renderToString(hackzor)).toThrowError(
        'Invalid tag: div><img /><div',
      );
    });

    it('should throw when an invalid tag name is used', () => {
      const hackzor = React.createElement('script tag');
      expect(() => ReactTestUtils.renderIntoDocument(hackzor)).toThrow();
    });

    it('should throw when an attack vector is used', () => {
      const hackzor = React.createElement('div><img /><div');
      expect(() => ReactTestUtils.renderIntoDocument(hackzor)).toThrow();
    });
  });

  describe('nesting validation', () => {
    it('warns on invalid nesting', () => {
      expect(() => {
        ReactTestUtils.renderIntoDocument(
          <div>
            <tr />
            <tr />
          </div>,
        );
      }).toWarnDev([
        'Warning: validateDOMNesting(...): <tr> cannot appear as a child of ' +
          '<div>.' +
          '\n    in tr (at **)' +
          '\n    in div (at **)',
        'Warning: validateDOMNesting(...): <tr> cannot appear as a child of ' +
          '<div>.' +
          '\n    in tr (at **)' +
          '\n    in div (at **)',
      ]);
    });

    it('warns on invalid nesting at root', () => {
      const p = document.createElement('p');

      expect(() => {
        ReactDOM.render(
          <span>
            <p />
          </span>,
          p,
        );
      }).toWarnDev(
        'Warning: validateDOMNesting(...): <p> cannot appear as a descendant ' +
          'of <p>.' +
          // There is no outer `p` here because root container is not part of the stack.
          '\n    in p (at **)' +
          '\n    in span (at **)',
      );
    });

    it('warns nicely for table rows', () => {
      class Row extends React.Component {
        render() {
          return <tr>x</tr>;
        }
      }

      class Foo extends React.Component {
        render() {
          return (
            <table>
              <Row />{' '}
            </table>
          );
        }
      }

      expect(() => ReactTestUtils.renderIntoDocument(<Foo />)).toWarnDev([
        'Warning: validateDOMNesting(...): <tr> cannot appear as a child of ' +
          '<table>. Add a <tbody> to your code to match the DOM tree generated ' +
          'by the browser.' +
          '\n    in tr (at **)' +
          '\n    in Row (at **)' +
          '\n    in table (at **)' +
          '\n    in Foo (at **)',
        'Warning: validateDOMNesting(...): Text nodes cannot appear as a ' +
          'child of <tr>.' +
          '\n    in tr (at **)' +
          '\n    in Row (at **)' +
          '\n    in table (at **)' +
          '\n    in Foo (at **)',
        'Warning: validateDOMNesting(...): Whitespace text nodes cannot ' +
          "appear as a child of <table>. Make sure you don't have any extra " +
          'whitespace between tags on each line of your source code.' +
          '\n    in table (at **)' +
          '\n    in Foo (at **)',
      ]);
    });

    it('gives useful context in warnings', () => {
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
        return (
          <table>
            <FancyRow />
          </table>
        );
      }
      function App1() {
        return <Viz1 />;
      }
      expect(() => ReactTestUtils.renderIntoDocument(<App1 />)).toWarnDev(
        '\n    in tr (at **)' +
          '\n    in Row (at **)' +
          '\n    in FancyRow (at **)' +
          '\n    in table (at **)' +
          '\n    in Viz1 (at **)',
      );

      function Viz2() {
        return (
          <FancyTable>
            <FancyRow />
          </FancyTable>
        );
      }
      function App2() {
        return <Viz2 />;
      }
      expect(() => ReactTestUtils.renderIntoDocument(<App2 />)).toWarnDev(
        '\n    in tr (at **)' +
          '\n    in Row (at **)' +
          '\n    in FancyRow (at **)' +
          '\n    in table (at **)' +
          '\n    in Table (at **)' +
          '\n    in FancyTable (at **)' +
          '\n    in Viz2 (at **)',
      );

      expect(() => {
        ReactTestUtils.renderIntoDocument(
          <FancyTable>
            <FancyRow />
          </FancyTable>,
        );
      }).toWarnDev(
        '\n    in tr (at **)' +
          '\n    in Row (at **)' +
          '\n    in FancyRow (at **)' +
          '\n    in table (at **)' +
          '\n    in Table (at **)' +
          '\n    in FancyTable (at **)',
      );

      expect(() => {
        ReactTestUtils.renderIntoDocument(
          <table>
            <FancyRow />
          </table>,
        );
      }).toWarnDev(
        '\n    in tr (at **)' +
          '\n    in Row (at **)' +
          '\n    in FancyRow (at **)' +
          '\n    in table (at **)',
      );

      expect(() => {
        ReactTestUtils.renderIntoDocument(
          <FancyTable>
            <tr />
          </FancyTable>,
        );
      }).toWarnDev(
        '\n    in tr (at **)' +
          '\n    in table (at **)' +
          '\n    in Table (at **)' +
          '\n    in FancyTable (at **)',
      );

      class Link extends React.Component {
        render() {
          return <a>{this.props.children}</a>;
        }
      }

      expect(() => {
        ReactTestUtils.renderIntoDocument(
          <Link>
            <div>
              <Link />
            </div>
          </Link>,
        );
      }).toWarnDev(
        '\n    in a (at **)' +
          '\n    in Link (at **)' +
          '\n    in div (at **)' +
          '\n    in a (at **)' +
          '\n    in Link (at **)',
      );
    });

    it('should warn about incorrect casing on properties (ssr)', () => {
      expect(() => {
        ReactDOMServer.renderToString(
          React.createElement('input', {type: 'text', tabindex: '1'}),
        );
      }).toWarnDev('tabIndex');
    });

    it('should warn about incorrect casing on event handlers (ssr)', () => {
      expect(() => {
        ReactDOMServer.renderToString(
          React.createElement('input', {type: 'text', oninput: '1'}),
        );
      }).toWarnDev(
        'Invalid event handler property `oninput`. ' +
          'React events use the camelCase naming convention, ' +
          // Note: we don't know the right event name so we
          // use a generic one (onClick) as a suggestion.
          // This is because we don't bundle the event system
          // on the server.
          'for example `onClick`.',
      );
      ReactDOMServer.renderToString(
        React.createElement('input', {type: 'text', onKeydown: '1'}),
      );
      // We can't warn for `onKeydown` on the server because
      // there is no way tell if this is a valid event or not
      // without access to the event system (which we don't bundle).
    });

    it('should warn about incorrect casing on properties', () => {
      expect(() => {
        ReactTestUtils.renderIntoDocument(
          React.createElement('input', {type: 'text', tabindex: '1'}),
        );
      }).toWarnDev('tabIndex');
    });

    it('should warn about incorrect casing on event handlers', () => {
      expect(() => {
        ReactTestUtils.renderIntoDocument(
          React.createElement('input', {type: 'text', oninput: '1'}),
        );
      }).toWarnDev('onInput');
      expect(() => {
        ReactTestUtils.renderIntoDocument(
          React.createElement('input', {type: 'text', onKeydown: '1'}),
        );
      }).toWarnDev('onKeyDown');
    });

    it('should warn about class', () => {
      expect(() => {
        ReactTestUtils.renderIntoDocument(
          React.createElement('div', {class: 'muffins'}),
        );
      }).toWarnDev('className');
    });

    it('should warn about class (ssr)', () => {
      expect(() => {
        ReactDOMServer.renderToString(
          React.createElement('div', {class: 'muffins'}),
        );
      }).toWarnDev('className');
    });

    it('should warn about props that are no longer supported', () => {
      ReactTestUtils.renderIntoDocument(<div />);

      expect(() =>
        ReactTestUtils.renderIntoDocument(<div onFocusIn={() => {}} />),
      ).toWarnDev(
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut.',
        {withoutStack: true}, // TODO: add a stack
      );
      expect(() =>
        ReactTestUtils.renderIntoDocument(<div onFocusOut={() => {}} />),
      ).toWarnDev(
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut.',
        {withoutStack: true}, // TODO: add a stack
      );
    });

    it('should warn about props that are no longer supported without case sensitivity', () => {
      ReactTestUtils.renderIntoDocument(<div />);
      expect(() =>
        ReactTestUtils.renderIntoDocument(<div onfocusin={() => {}} />),
      ).toWarnDev(
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut.',
        {withoutStack: true}, // TODO: add a stack
      );
      expect(() =>
        ReactTestUtils.renderIntoDocument(<div onfocusout={() => {}} />),
      ).toWarnDev(
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut.',
        {withoutStack: true}, // TODO: add a stack
      );
    });

    it('should warn about props that are no longer supported (ssr)', () => {
      ReactDOMServer.renderToString(<div />);
      expect(() =>
        ReactDOMServer.renderToString(<div onFocusIn={() => {}} />),
      ).toWarnDev(
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut.',
        {withoutStack: true}, // TODO: add a stack
      );
      expect(() =>
        ReactDOMServer.renderToString(<div onFocusOut={() => {}} />),
      ).toWarnDev(
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut.',
        {withoutStack: true}, // TODO: add a stack
      );
    });

    it('should warn about props that are no longer supported without case sensitivity (ssr)', () => {
      ReactDOMServer.renderToString(<div />);
      expect(() =>
        ReactDOMServer.renderToString(<div onfocusin={() => {}} />),
      ).toWarnDev(
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut.',
        {withoutStack: true}, // TODO: add a stack
      );
      expect(() =>
        ReactDOMServer.renderToString(<div onfocusout={() => {}} />),
      ).toWarnDev(
        'React uses onFocus and onBlur instead of onFocusIn and onFocusOut.',
        {withoutStack: true}, // TODO: add a stack
      );
    });

    it('gives source code refs for unknown prop warning', () => {
      expect(() =>
        ReactTestUtils.renderIntoDocument(<div class="paladin" />),
      ).toWarnDev(
        'Warning: Invalid DOM property `class`. Did you mean `className`?\n    in div (at **)',
      );
      expect(() =>
        ReactTestUtils.renderIntoDocument(<input type="text" onclick="1" />),
      ).toWarnDev(
        'Warning: Invalid event handler property `onclick`. Did you mean ' +
          '`onClick`?\n    in input (at **)',
      );
    });

    it('gives source code refs for unknown prop warning (ssr)', () => {
      expect(() =>
        ReactDOMServer.renderToString(<div class="paladin" />),
      ).toWarnDev(
        'Warning: Invalid DOM property `class`. Did you mean `className`?\n    in div (at **)',
      );
      expect(() =>
        ReactDOMServer.renderToString(<input type="text" oninput="1" />),
      ).toWarnDev(
        'Warning: Invalid event handler property `oninput`. ' +
          // Note: we don't know the right event name so we
          // use a generic one (onClick) as a suggestion.
          // This is because we don't bundle the event system
          // on the server.
          'React events use the camelCase naming convention, for example `onClick`.' +
          '\n    in input (at **)',
      );
    });

    it('gives source code refs for unknown prop warning for update render', () => {
      const container = document.createElement('div');

      ReactTestUtils.renderIntoDocument(<div className="paladin" />, container);
      expect(() =>
        ReactTestUtils.renderIntoDocument(<div class="paladin" />, container),
      ).toWarnDev(
        'Warning: Invalid DOM property `class`. Did you mean `className`?\n    in div (at **)',
      );
    });

    it('gives source code refs for unknown prop warning for exact elements', () => {
      expect(() =>
        ReactTestUtils.renderIntoDocument(
          <div className="foo1">
            <span class="foo2" />
            <div onClick={() => {}} />
            <strong onclick={() => {}} />
            <div className="foo5" />
            <div className="foo6" />
          </div>,
        ),
      ).toWarnDev([
        'Invalid DOM property `class`. Did you mean `className`?\n    in span (at **)',
        'Invalid event handler property `onclick`. Did you mean `onClick`?\n    in strong (at **)',
      ]);
    });

    it('gives source code refs for unknown prop warning for exact elements (ssr)', () => {
      expect(() =>
        ReactDOMServer.renderToString(
          <div className="foo1">
            <span class="foo2" />
            <div onClick="foo3" />
            <strong onclick="foo4" />
            <div className="foo5" />
            <div className="foo6" />
          </div>,
        ),
      ).toWarnDev([
        'Invalid DOM property `class`. Did you mean `className`?\n    in span (at **)',
        'Invalid event handler property `onclick`. ' +
          'React events use the camelCase naming convention, for example `onClick`.' +
          '\n    in strong (at **)',
      ]);
    });

    it('gives source code refs for unknown prop warning for exact elements in composition', () => {
      const container = document.createElement('div');

      class Parent extends React.Component {
        render() {
          return (
            <div>
              <Child1 />
              <Child2 />
              <Child3 />
              <Child4 />
            </div>
          );
        }
      }

      class Child1 extends React.Component {
        render() {
          return <span class="paladin">Child1</span>;
        }
      }

      class Child2 extends React.Component {
        render() {
          return <div>Child2</div>;
        }
      }

      class Child3 extends React.Component {
        render() {
          return <strong onclick="1">Child3</strong>;
        }
      }

      class Child4 extends React.Component {
        render() {
          return <div>Child4</div>;
        }
      }

      expect(() =>
        ReactTestUtils.renderIntoDocument(<Parent />, container),
      ).toWarnDev([
        'Invalid DOM property `class`. Did you mean `className`?\n    in span (at **)',
        'Invalid event handler property `onclick`. Did you mean `onClick`?\n    in strong (at **)',
      ]);
    });

    it('gives source code refs for unknown prop warning for exact elements in composition (ssr)', () => {
      const container = document.createElement('div');

      class Parent extends React.Component {
        render() {
          return (
            <div>
              <Child1 />
              <Child2 />
              <Child3 />
              <Child4 />
            </div>
          );
        }
      }

      class Child1 extends React.Component {
        render() {
          return <span class="paladin">Child1</span>;
        }
      }

      class Child2 extends React.Component {
        render() {
          return <div>Child2</div>;
        }
      }

      class Child3 extends React.Component {
        render() {
          return <strong onclick="1">Child3</strong>;
        }
      }

      class Child4 extends React.Component {
        render() {
          return <div>Child4</div>;
        }
      }

      expect(() =>
        ReactDOMServer.renderToString(<Parent />, container),
      ).toWarnDev([
        'Invalid DOM property `class`. Did you mean `className`?\n    in span (at **)',
        'Invalid event handler property `onclick`. ' +
          'React events use the camelCase naming convention, for example `onClick`.' +
          '\n    in strong (at **)',
      ]);
    });

    it('should suggest property name if available', () => {
      expect(() =>
        ReactTestUtils.renderIntoDocument(
          React.createElement('label', {for: 'test'}),
        ),
      ).toWarnDev(
        'Warning: Invalid DOM property `for`. Did you mean `htmlFor`?\n    in label',
      );

      expect(() =>
        ReactTestUtils.renderIntoDocument(
          React.createElement('input', {type: 'text', autofocus: true}),
        ),
      ).toWarnDev(
        'Warning: Invalid DOM property `autofocus`. Did you mean `autoFocus`?\n    in input',
      );
    });

    it('should suggest property name if available (ssr)', () => {
      expect(() =>
        ReactDOMServer.renderToString(
          React.createElement('label', {for: 'test'}),
        ),
      ).toWarnDev(
        'Warning: Invalid DOM property `for`. Did you mean `htmlFor`?\n    in label',
      );
      expect(() =>
        ReactDOMServer.renderToString(
          React.createElement('input', {type: 'text', autofocus: true}),
        ),
      ).toWarnDev(
        'Warning: Invalid DOM property `autofocus`. Did you mean `autoFocus`?\n    in input',
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

  describe('Attributes with aliases', function() {
    it('sets aliased attributes on HTML attributes', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(<div class="test" />);
      }).toWarnDev(
        'Warning: Invalid DOM property `class`. Did you mean `className`?',
      );

      expect(el.className).toBe('test');
    });

    it('sets incorrectly cased aliased attributes on HTML attributes with a warning', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(<div cLASS="test" />);
      }).toWarnDev(
        'Warning: Invalid DOM property `cLASS`. Did you mean `className`?',
      );

      expect(el.className).toBe('test');
    });

    it('sets aliased attributes on SVG elements with a warning', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(
          <svg>
            <text arabic-form="initial" />
          </svg>,
        );
      }).toWarnDev(
        'Warning: Invalid DOM property `arabic-form`. Did you mean `arabicForm`?',
      );
      const text = el.querySelector('text');

      expect(text.hasAttribute('arabic-form')).toBe(true);
    });

    it('sets aliased attributes on custom elements', function() {
      const el = ReactTestUtils.renderIntoDocument(
        <div is="custom-element" class="test" />,
      );

      expect(el.getAttribute('class')).toBe('test');
    });

    it('aliased attributes on custom elements with bad casing', function() {
      const el = ReactTestUtils.renderIntoDocument(
        <div is="custom-element" claSS="test" />,
      );

      expect(el.getAttribute('class')).toBe('test');
    });

    it('updates aliased attributes on custom elements', function() {
      const container = document.createElement('div');
      ReactDOM.render(<div is="custom-element" class="foo" />, container);
      ReactDOM.render(<div is="custom-element" class="bar" />, container);

      expect(container.firstChild.getAttribute('class')).toBe('bar');
    });
  });

  describe('Custom attributes', function() {
    it('allows assignment of custom attributes with string values', function() {
      const el = ReactTestUtils.renderIntoDocument(<div whatever="30" />);

      expect(el.getAttribute('whatever')).toBe('30');
    });

    it('removes custom attributes', function() {
      const container = document.createElement('div');
      ReactDOM.render(<div whatever="30" />, container);

      expect(container.firstChild.getAttribute('whatever')).toBe('30');

      ReactDOM.render(<div whatever={null} />, container);

      expect(container.firstChild.hasAttribute('whatever')).toBe(false);
    });

    it('does not assign a boolean custom attributes as a string', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(<div whatever={true} />);
      }).toWarnDev(
        'Received `true` for a non-boolean attribute `whatever`.\n\n' +
          'If you want to write it to the DOM, pass a string instead: ' +
          'whatever="true" or whatever={value.toString()}.',
      );

      expect(el.hasAttribute('whatever')).toBe(false);
    });

    it('does not assign an implicit boolean custom attributes', function() {
      let el;
      expect(() => {
        // eslint-disable-next-line react/jsx-boolean-value
        el = ReactTestUtils.renderIntoDocument(<div whatever />);
      }).toWarnDev(
        'Received `true` for a non-boolean attribute `whatever`.\n\n' +
          'If you want to write it to the DOM, pass a string instead: ' +
          'whatever="true" or whatever={value.toString()}.',
      );

      expect(el.hasAttribute('whatever')).toBe(false);
    });

    it('assigns a numeric custom attributes as a string', function() {
      const el = ReactTestUtils.renderIntoDocument(<div whatever={3} />);

      expect(el.getAttribute('whatever')).toBe('3');
    });

    it('will not assign a function custom attributes', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(<div whatever={() => {}} />);
      }).toWarnDev('Warning: Invalid value for prop `whatever` on <div> tag');

      expect(el.hasAttribute('whatever')).toBe(false);
    });

    it('will assign an object custom attributes', function() {
      const el = ReactTestUtils.renderIntoDocument(<div whatever={{}} />);
      expect(el.getAttribute('whatever')).toBe('[object Object]');
    });

    it('allows cased data attributes', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(<div data-fooBar="true" />);
      }).toWarnDev(
        'React does not recognize the `data-fooBar` prop on a DOM element. ' +
          'If you intentionally want it to appear in the DOM as a custom ' +
          'attribute, spell it as lowercase `data-foobar` instead. ' +
          'If you accidentally passed it from a parent component, remove ' +
          'it from the DOM element.\n' +
          '    in div (at **)',
      );
      expect(el.getAttribute('data-foobar')).toBe('true');
    });

    it('allows cased custom attributes', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(<div fooBar="true" />);
      }).toWarnDev(
        'React does not recognize the `fooBar` prop on a DOM element. ' +
          'If you intentionally want it to appear in the DOM as a custom ' +
          'attribute, spell it as lowercase `foobar` instead. ' +
          'If you accidentally passed it from a parent component, remove ' +
          'it from the DOM element.\n' +
          '    in div (at **)',
      );
      expect(el.getAttribute('foobar')).toBe('true');
    });

    it('warns on NaN attributes', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(<div whatever={NaN} />);
      }).toWarnDev(
        'Warning: Received NaN for the `whatever` attribute. If this is ' +
          'expected, cast the value to a string.\n    in div',
      );

      expect(el.getAttribute('whatever')).toBe('NaN');
    });

    it('removes a property when it becomes invalid', function() {
      const container = document.createElement('div');
      ReactDOM.render(<div whatever={0} />, container);
      expect(() =>
        ReactDOM.render(<div whatever={() => {}} />, container),
      ).toWarnDev('Warning: Invalid value for prop `whatever` on <div> tag.');
      const el = container.firstChild;
      expect(el.hasAttribute('whatever')).toBe(false);
    });

    it('warns on bad casing of known HTML attributes', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(<div SiZe="30" />);
      }).toWarnDev(
        'Warning: Invalid DOM property `SiZe`. Did you mean `size`?',
      );

      expect(el.getAttribute('size')).toBe('30');
    });
  });

  describe('Object stringification', function() {
    it('allows objects on known properties', function() {
      const el = ReactTestUtils.renderIntoDocument(<div acceptCharset={{}} />);
      expect(el.getAttribute('accept-charset')).toBe('[object Object]');
    });

    it('should pass objects as attributes if they define toString', () => {
      const obj = {
        toString() {
          return 'hello';
        },
      };
      const container = document.createElement('div');

      ReactDOM.render(<img src={obj} />, container);
      expect(container.firstChild.src).toBe('hello');

      ReactDOM.render(<svg arabicForm={obj} />, container);
      expect(container.firstChild.getAttribute('arabic-form')).toBe('hello');

      ReactDOM.render(<div unknown={obj} />, container);
      expect(container.firstChild.getAttribute('unknown')).toBe('hello');
    });

    it('passes objects on known SVG attributes if they do not define toString', () => {
      const obj = {};
      const container = document.createElement('div');

      ReactDOM.render(<svg arabicForm={obj} />, container);
      expect(container.firstChild.getAttribute('arabic-form')).toBe(
        '[object Object]',
      );
    });

    it('passes objects on custom attributes if they do not define toString', () => {
      const obj = {};
      const container = document.createElement('div');

      ReactDOM.render(<div unknown={obj} />, container);
      expect(container.firstChild.getAttribute('unknown')).toBe(
        '[object Object]',
      );
    });

    it('allows objects that inherit a custom toString method', function() {
      const parent = {toString: () => 'hello.jpg'};
      const child = Object.create(parent);
      const el = ReactTestUtils.renderIntoDocument(<img src={child} />);

      expect(el.src).toBe('hello.jpg');
    });

    it('assigns ajaxify (an important internal FB attribute)', function() {
      const options = {toString: () => 'ajaxy'};
      const el = ReactTestUtils.renderIntoDocument(<div ajaxify={options} />);

      expect(el.getAttribute('ajaxify')).toBe('ajaxy');
    });
  });

  describe('String boolean attributes', function() {
    it('does not assign string boolean attributes for custom attributes', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(<div whatever={true} />);
      }).toWarnDev(
        'Received `true` for a non-boolean attribute `whatever`.\n\n' +
          'If you want to write it to the DOM, pass a string instead: ' +
          'whatever="true" or whatever={value.toString()}.',
      );

      expect(el.hasAttribute('whatever')).toBe(false);
    });

    it('stringifies the boolean true for allowed attributes', function() {
      const el = ReactTestUtils.renderIntoDocument(<div spellCheck={true} />);

      expect(el.getAttribute('spellCheck')).toBe('true');
    });

    it('stringifies the boolean false for allowed attributes', function() {
      const el = ReactTestUtils.renderIntoDocument(<div spellCheck={false} />);

      expect(el.getAttribute('spellCheck')).toBe('false');
    });

    it('stringifies implicit booleans for allowed attributes', function() {
      // eslint-disable-next-line react/jsx-boolean-value
      const el = ReactTestUtils.renderIntoDocument(<div spellCheck />);

      expect(el.getAttribute('spellCheck')).toBe('true');
    });
  });

  describe('Hyphenated SVG elements', function() {
    it('the font-face element is not a custom element', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(
          <svg>
            <font-face x-height={false} />
          </svg>,
        );
      }).toWarnDev(
        'Warning: Invalid DOM property `x-height`. Did you mean `xHeight`',
      );

      expect(el.querySelector('font-face').hasAttribute('x-height')).toBe(
        false,
      );
    });

    it('the font-face element does not allow unknown boolean values', function() {
      let el;
      expect(() => {
        el = ReactTestUtils.renderIntoDocument(
          <svg>
            <font-face whatever={false} />
          </svg>,
        );
      }).toWarnDev(
        'Received `false` for a non-boolean attribute `whatever`.\n\n' +
          'If you want to write it to the DOM, pass a string instead: ' +
          'whatever="false" or whatever={value.toString()}.\n\n' +
          'If you used to conditionally omit it with whatever={condition && value}, ' +
          'pass whatever={condition ? value : undefined} instead.',
      );

      expect(el.querySelector('font-face').hasAttribute('whatever')).toBe(
        false,
      );
    });
  });

  // These tests mostly verify the existing behavior.
  // It may not always makes sense but we can't change it in minors.
  describe('Custom elements', () => {
    it('does not strip unknown boolean attributes', () => {
      const container = document.createElement('div');
      ReactDOM.render(<some-custom-element foo={true} />, container);
      const node = container.firstChild;
      expect(node.getAttribute('foo')).toBe('true');
      ReactDOM.render(<some-custom-element foo={false} />, container);
      expect(node.getAttribute('foo')).toBe('false');
      ReactDOM.render(<some-custom-element />, container);
      expect(node.hasAttribute('foo')).toBe(false);
      ReactDOM.render(<some-custom-element foo={true} />, container);
      expect(node.hasAttribute('foo')).toBe(true);
    });

    it('does not strip the on* attributes', () => {
      const container = document.createElement('div');
      ReactDOM.render(<some-custom-element onx="bar" />, container);
      const node = container.firstChild;
      expect(node.getAttribute('onx')).toBe('bar');
      ReactDOM.render(<some-custom-element onx="buzz" />, container);
      expect(node.getAttribute('onx')).toBe('buzz');
      ReactDOM.render(<some-custom-element />, container);
      expect(node.hasAttribute('onx')).toBe(false);
      ReactDOM.render(<some-custom-element onx="bar" />, container);
      expect(node.getAttribute('onx')).toBe('bar');
    });
  });
});

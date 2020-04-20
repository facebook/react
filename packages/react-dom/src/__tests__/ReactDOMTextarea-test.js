/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

function emptyFunction() {}

describe('ReactDOMTextarea', () => {
  let React;
  let ReactDOM;
  let ReactDOMServer;
  let ReactTestUtils;
  let container;
  let node;

  const ReactFeatureFlags = require('shared/ReactFeatureFlags');

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should allow setting `defaultValue`', () => {
    node = ReactDOM.render(<textarea defaultValue="giraffe" />, container);
    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should do nothing.
    node = ReactDOM.render(<textarea defaultValue="gorilla" />, container);
    expect(node.value).toEqual('giraffe');

    node.value = 'cat';

    node = ReactDOM.render(<textarea defaultValue="monkey" />, container);
    expect(node.value).toEqual('cat');
  });

  it('should display `defaultValue` of number 0', () => {
    const stub = <textarea defaultValue={0} />;
    node = ReactDOM.render(stub, container);

    expect(node.value).toBe('0');
  });

  it('should display "false" for `defaultValue` of `false`', () => {
    const stub = <textarea defaultValue={false} />;
    node = ReactDOM.render(stub, container);

    expect(node.value).toBe('false');
  });

  it('should display "foobar" for `defaultValue` of `objToString`', () => {
    const objToString = {
      toString: function() {
        return 'foobar';
      },
    };

    const stub = <textarea defaultValue={objToString} />;
    node = ReactDOM.render(stub, container);

    expect(node.value).toBe('foobar');
  });

  it('should set defaultValue', () => {
    ReactDOM.render(<textarea defaultValue="foo" />, container);
    ReactDOM.render(<textarea defaultValue="bar" />, container);
    ReactDOM.render(<textarea defaultValue="noise" />, container);
    expect(container.firstChild.defaultValue).toBe('noise');
  });

  it('should not render value as an attribute', () => {
    const stub = <textarea value="giraffe" onChange={emptyFunction} />;
    node = ReactDOM.render(stub, container);

    expect(node.getAttribute('value')).toBe(null);
  });

  it('should display `value` of number 0', () => {
    const stub = <textarea value={0} onChange={emptyFunction} />;
    node = ReactDOM.render(stub, container);

    expect(node.value).toBe('0');
  });

  it('should update defaultValue to empty string', () => {
    ReactDOM.render(<textarea defaultValue={'foo'} />, container);
    ReactDOM.render(<textarea defaultValue={''} />, container);
    expect(container.firstChild.defaultValue).toBe('');
  });

  it('should allow setting `value` to `giraffe`', () => {
    let stub = <textarea value="giraffe" onChange={emptyFunction} />;
    node = ReactDOM.render(stub, container);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value="gorilla" onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('gorilla');
  });

  it('will not initially assign an empty value (covers case where firefox throws a validation error when required attribute is set)', () => {
    let counter = 0;
    const originalCreateElement = document.createElement;
    spyOnDevAndProd(document, 'createElement').and.callFake(function(type) {
      const el = originalCreateElement.apply(this, arguments);
      let value = '';
      if (type === 'textarea') {
        Object.defineProperty(el, 'value', {
          get: function() {
            return value;
          },
          set: function(val) {
            value = '' + val;
            counter++;
          },
        });
      }
      return el;
    });

    ReactDOM.render(<textarea value="" readOnly={true} />, container);

    expect(counter).toEqual(0);
  });

  it('should render defaultValue for SSR', () => {
    const markup = ReactDOMServer.renderToString(<textarea defaultValue="1" />);
    container.innerHTML = markup;
    expect(container.firstChild.innerHTML).toBe('1');
    expect(container.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should render value for SSR', () => {
    const element = <textarea value="1" onChange={function() {}} />;
    const markup = ReactDOMServer.renderToString(element);
    container.innerHTML = markup;
    expect(container.firstChild.innerHTML).toBe('1');
    expect(container.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should allow setting `value` to `true`', () => {
    let stub = <textarea value="giraffe" onChange={emptyFunction} />;
    node = ReactDOM.render(stub, container);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value={true} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('true');
  });

  it('should allow setting `value` to `false`', () => {
    let stub = <textarea value="giraffe" onChange={emptyFunction} />;
    node = ReactDOM.render(stub, container);

    expect(node.value).toBe('giraffe');

    stub = ReactDOM.render(
      <textarea value={false} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', () => {
    let stub = <textarea value="giraffe" onChange={emptyFunction} />;
    node = ReactDOM.render(stub, container);

    expect(node.value).toBe('giraffe');

    const objToString = {
      toString: function() {
        return 'foo';
      },
    };
    stub = ReactDOM.render(
      <textarea value={objToString} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('foo');
  });

  it('should take updates to `defaultValue` for uncontrolled textarea', () => {
    node = ReactDOM.render(<textarea defaultValue="0" />, container);

    expect(node.value).toBe('0');

    ReactDOM.render(<textarea defaultValue="1" />, container);

    expect(node.value).toBe('0');
  });

  it('should take updates to children in lieu of `defaultValue` for uncontrolled textarea', () => {
    node = ReactDOM.render(<textarea defaultValue="0" />, container);

    expect(node.value).toBe('0');

    ReactDOM.render(<textarea>1</textarea>, container);

    expect(node.value).toBe('0');
  });

  it('should not incur unnecessary DOM mutations', () => {
    ReactDOM.render(<textarea value="a" onChange={emptyFunction} />, container);

    node = container.firstChild;
    let nodeValue = 'a';
    const nodeValueSetter = jest.fn();
    Object.defineProperty(node, 'value', {
      get: function() {
        return nodeValue;
      },
      set: nodeValueSetter.mockImplementation(function(newValue) {
        nodeValue = newValue;
      }),
    });

    ReactDOM.render(<textarea value="a" onChange={emptyFunction} />, container);
    expect(nodeValueSetter).toHaveBeenCalledTimes(0);

    ReactDOM.render(<textarea value="b" onChange={emptyFunction} />, container);
    expect(nodeValueSetter).toHaveBeenCalledTimes(1);
  });

  it('should properly control a value of number `0`', () => {
    const stub = <textarea value={0} onChange={emptyFunction} />;
    const setUntrackedValue = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    ).set;

    node = ReactDOM.render(stub, container);

    setUntrackedValue.call(node, 'giraffe');
    node.dispatchEvent(new Event('input', {bubbles: true, cancelable: false}));
    expect(node.value).toBe('0');
  });

  if (ReactFeatureFlags.disableTextareaChildren) {
    it('should ignore children content', () => {
      let stub = <textarea>giraffe</textarea>;

      expect(() => {
        node = ReactDOM.render(stub, container);
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
      expect(node.value).toBe('');
      // Changing children should do nothing, it functions like `defaultValue`.
      stub = ReactDOM.render(<textarea>gorilla</textarea>, container);
      expect(node.value).toEqual('');
    });
  }

  if (ReactFeatureFlags.disableTextareaChildren) {
    it('should receive defaultValue and still ignore children content', () => {
      expect(() => {
        node = ReactDOM.render(
          <textarea defaultValue="dragon">monkey</textarea>,
          container,
        );
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
      expect(node.value).toBe('dragon');
    });
  }

  if (!ReactFeatureFlags.disableTextareaChildren) {
    it('should treat children like `defaultValue`', () => {
      let stub = <textarea>giraffe</textarea>;

      expect(() => {
        node = ReactDOM.render(stub, container);
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );

      expect(node.value).toBe('giraffe');

      // Changing children should do nothing, it functions like `defaultValue`.
      stub = ReactDOM.render(<textarea>gorilla</textarea>, container);
      expect(node.value).toEqual('giraffe');
    });
  }

  it('should keep value when switching to uncontrolled element if not changed', () => {
    node = ReactDOM.render(
      <textarea value="kitten" onChange={emptyFunction} />,
      container,
    );

    expect(node.value).toBe('kitten');

    expect(() =>
      ReactDOM.render(<textarea defaultValue="gorilla" />, container),
    ).toErrorDev(
      'Warning: A component is changing a controlled textarea to be uncontrolled. ' +
        'This is likely caused by the value changing from a defined to ' +
        'undefined, which should not happen. ' +
        'Decide between using a controlled or uncontrolled textarea ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in textarea (at **)',
    );

    expect(node.value).toEqual('kitten');
  });

  it('should keep value when switching to uncontrolled element if changed', () => {
    node = ReactDOM.render(
      <textarea value="kitten" onChange={emptyFunction} />,
      container,
    );

    expect(node.value).toBe('kitten');

    ReactDOM.render(
      <textarea value="puppies" onChange={emptyFunction} />,
      container,
    );

    expect(node.value).toBe('puppies');

    expect(() =>
      ReactDOM.render(<textarea defaultValue="gorilla" />, container),
    ).toErrorDev(
      'Warning: A component is changing a controlled textarea to be uncontrolled. ' +
        'This is likely caused by the value changing from a defined to ' +
        'undefined, which should not happen. ' +
        'Decide between using a controlled or uncontrolled textarea ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in textarea (at **)',
    );

    expect(node.value).toEqual('puppies');
  });

  if (ReactFeatureFlags.disableTextareaChildren) {
    it('should ignore numbers as children', () => {
      expect(() => {
        node = ReactDOM.render(<textarea>{17}</textarea>, container);
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
      expect(node.value).toBe('');
    });
  }

  if (!ReactFeatureFlags.disableTextareaChildren) {
    it('should allow numbers as children', () => {
      expect(() => {
        node = ReactDOM.render(<textarea>{17}</textarea>, container);
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
      expect(node.value).toBe('17');
    });
  }

  if (ReactFeatureFlags.disableTextareaChildren) {
    it('should ignore booleans as children', () => {
      expect(() => {
        node = ReactDOM.render(<textarea>{false}</textarea>, container);
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
      expect(node.value).toBe('');
    });
  }

  if (!ReactFeatureFlags.disableTextareaChildren) {
    it('should allow booleans as children', () => {
      expect(() => {
        node = ReactDOM.render(<textarea>{false}</textarea>, container);
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
      expect(node.value).toBe('false');
    });
  }

  if (ReactFeatureFlags.disableTextareaChildren) {
    it('should ignore objects as children', () => {
      const obj = {
        toString: function() {
          return 'sharkswithlasers';
        },
      };
      expect(() => {
        node = ReactDOM.render(<textarea>{obj}</textarea>, container);
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
      expect(node.value).toBe('');
    });
  }

  if (!ReactFeatureFlags.disableTextareaChildren) {
    it('should allow objects as children', () => {
      const obj = {
        toString: function() {
          return 'sharkswithlasers';
        },
      };
      expect(() => {
        node = ReactDOM.render(<textarea>{obj}</textarea>, container);
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );
      expect(node.value).toBe('sharkswithlasers');
    });
  }

  if (!ReactFeatureFlags.disableTextareaChildren) {
    it('should throw with multiple or invalid children', () => {
      expect(() => {
        expect(() =>
          ReactDOM.render(
            <textarea>
              {'hello'}
              {'there'}
            </textarea>,
            container,
          ),
        ).toThrow('<textarea> can only have at most one child');
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );

      expect(() => {
        expect(
          () =>
            (node = ReactDOM.render(
              <textarea>
                <strong />
              </textarea>,
              container,
            )),
        ).not.toThrow();
      }).toErrorDev(
        'Use the `defaultValue` or `value` props instead of setting children on <textarea>.',
      );

      expect(node.value).toBe('[object Object]');
    });
  }

  it('should unmount', () => {
    ReactDOM.render(<textarea />, container);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('should warn if value is null', () => {
    expect(() =>
      ReactTestUtils.renderIntoDocument(<textarea value={null} />),
    ).toErrorDev(
      '`value` prop on `textarea` should not be null. ' +
        'Consider using an empty string to clear the component or `undefined` ' +
        'for uncontrolled components.',
    );

    // No additional warnings are expected
    ReactTestUtils.renderIntoDocument(<textarea value={null} />);
  });

  it('should warn if value and defaultValue are specified', () => {
    const InvalidComponent = () => (
      <textarea value="foo" defaultValue="bar" readOnly={true} />
    );
    expect(() =>
      ReactTestUtils.renderIntoDocument(<InvalidComponent />),
    ).toErrorDev(
      'InvalidComponent contains a textarea with both value and defaultValue props. ' +
        'Textarea elements must be either controlled or uncontrolled ' +
        '(specify either the value prop, or the defaultValue prop, but not ' +
        'both). Decide between using a controlled or uncontrolled textarea ' +
        'and remove one of these props. More info: ' +
        'https://fb.me/react-controlled-components',
    );

    // No additional warnings are expected
    ReactTestUtils.renderIntoDocument(<InvalidComponent />);
  });

  it('should not warn about missing onChange in uncontrolled textareas', () => {
    ReactDOM.render(<textarea />, container);
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(<textarea value={undefined} />, container);
  });

  it('does not set textContent if value is unchanged', () => {
    let instance;
    // Setting defaultValue on a textarea is equivalent to setting textContent,
    // and is the method we currently use, so we can observe if defaultValue is
    // is set to determine if textContent is being recreated.
    // https://html.spec.whatwg.org/#the-textarea-element
    let defaultValue;
    const set = jest.fn(value => {
      defaultValue = value;
    });
    const get = jest.fn(value => {
      return defaultValue;
    });
    class App extends React.Component {
      state = {count: 0, text: 'foo'};
      componentDidMount() {
        instance = this;
      }
      render() {
        return (
          <div>
            <span>{this.state.count}</span>
            <textarea
              ref={n => (node = n)}
              value="foo"
              onChange={emptyFunction}
            />
          </div>
        );
      }
    }
    ReactDOM.render(<App />, container);
    defaultValue = node.defaultValue;
    Object.defineProperty(node, 'defaultValue', {get, set});
    instance.setState({count: 1});
    expect(set.mock.calls.length).toBe(0);
  });

  describe('When given a Symbol value', () => {
    it('treats initial Symbol value as an empty string', () => {
      expect(() =>
        ReactDOM.render(
          <textarea value={Symbol('foobar')} onChange={() => {}} />,
          container,
        ),
      ).toErrorDev('Invalid value for prop `value`');
      node = container.firstChild;

      expect(node.value).toBe('');
    });

    it('treats initial Symbol children as an empty string', () => {
      expect(() =>
        ReactDOM.render(
          <textarea onChange={() => {}}>{Symbol('foo')}</textarea>,
          container,
        ),
      ).toErrorDev('Use the `defaultValue` or `value` props');
      node = container.firstChild;

      expect(node.value).toBe('');
    });

    it('treats updated Symbol value as an empty string', () => {
      ReactDOM.render(<textarea value="foo" onChange={() => {}} />, container);
      expect(() =>
        ReactDOM.render(
          <textarea value={Symbol('foo')} onChange={() => {}} />,
          container,
        ),
      ).toErrorDev('Invalid value for prop `value`');
      node = container.firstChild;

      expect(node.value).toBe('');
    });

    it('treats initial Symbol defaultValue as an empty string', () => {
      ReactDOM.render(<textarea defaultValue={Symbol('foobar')} />, container);
      node = container.firstChild;

      // TODO: defaultValue is a reserved prop and is not validated. Check warnings when they are.
      expect(node.value).toBe('');
    });

    it('treats updated Symbol defaultValue as an empty string', () => {
      ReactDOM.render(<textarea defaultValue="foo" />, container);
      ReactDOM.render(<textarea defaultValue={Symbol('foobar')} />, container);
      node = container.firstChild;

      // TODO: defaultValue is a reserved prop and is not validated. Check warnings when they are.
      expect(node.value).toBe('foo');
    });
  });

  describe('When given a function value', () => {
    it('treats initial function value as an empty string', () => {
      expect(() =>
        ReactDOM.render(
          <textarea value={() => {}} onChange={() => {}} />,
          container,
        ),
      ).toErrorDev('Invalid value for prop `value`');
      node = container.firstChild;

      expect(node.value).toBe('');
    });

    it('treats initial function children as an empty string', () => {
      expect(() =>
        ReactDOM.render(
          <textarea onChange={() => {}}>{() => {}}</textarea>,
          container,
        ),
      ).toErrorDev('Use the `defaultValue` or `value` props');
      node = container.firstChild;

      expect(node.value).toBe('');
    });

    it('treats updated function value as an empty string', () => {
      ReactDOM.render(<textarea value="foo" onChange={() => {}} />, container);
      expect(() =>
        ReactDOM.render(
          <textarea value={() => {}} onChange={() => {}} />,
          container,
        ),
      ).toErrorDev('Invalid value for prop `value`');
      node = container.firstChild;

      expect(node.value).toBe('');
    });

    it('treats initial function defaultValue as an empty string', () => {
      ReactDOM.render(<textarea defaultValue={() => {}} />, container);
      node = container.firstChild;

      // TODO: defaultValue is a reserved prop and is not validated. Check warnings when they are.
      expect(node.value).toBe('');
    });

    it('treats updated function defaultValue as an empty string', () => {
      ReactDOM.render(<textarea defaultValue="foo" />, container);
      ReactDOM.render(<textarea defaultValue={() => {}} />, container);
      node = container.firstChild;

      // TODO: defaultValue is a reserved prop and is not validated. Check warnings when they are.
      expect(node.value).toBe('foo');
    });
  });

  it('should warn if controlled textarea switches to uncontrolled (value is undefined)', () => {
    const stub = <textarea value="controlled" onChange={emptyFunction} />;
    ReactDOM.render(stub, container);
    expect(() => ReactDOM.render(<textarea />, container)).toErrorDev(
      'Warning: A component is changing a controlled textarea to be uncontrolled. ' +
        'This is likely caused by the value changing from a defined to ' +
        'undefined, which should not happen. ' +
        'Decide between using a controlled or uncontrolled textarea ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in textarea (at **)',
    );
  });

  it('should warn if controlled textarea switches to uncontrolled (value is null)', () => {
    const stub = <textarea value="controlled" onChange={emptyFunction} />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<textarea value={null} />, container),
    ).toErrorDev([
      '`value` prop on `textarea` should not be null. ' +
        'Consider using an empty string to clear the component or `undefined` for uncontrolled components',
      'Warning: A component is changing a controlled textarea to be uncontrolled. ' +
        'This is likely caused by the value changing from a defined to ' +
        'undefined, which should not happen. ' +
        'Decide between using a controlled or uncontrolled textarea ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in textarea (at **)',
    ]);
  });

  it('should warn if controlled textarea switches to uncontrolled with defaultValue', () => {
    const stub = <textarea value="controlled" onChange={emptyFunction} />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<textarea defaultValue="uncontrolled" />, container),
    ).toErrorDev(
      'Warning: A component is changing a controlled textarea to be uncontrolled. ' +
        'This is likely caused by the value changing from a defined to ' +
        'undefined, which should not happen. ' +
        'Decide between using a controlled or uncontrolled textarea ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in textarea (at **)',
    );
  });

  it('should warn if uncontrolled textarea (value is undefined) switches to controlled', () => {
    const stub = <textarea />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<textarea value="controlled" />, container),
    ).toErrorDev(
      'Warning: A component is changing an uncontrolled textarea to be controlled. ' +
        'This is likely caused by the value changing from undefined to ' +
        'a defined value, which should not happen. ' +
        'Decide between using a controlled or uncontrolled textarea ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in textarea (at **)',
    );
  });

  it('should warn if uncontrolled textarea (value is null) switches to controlled', () => {
    const stub = <textarea value={null} />;
    expect(() => ReactDOM.render(stub, container)).toErrorDev(
      '`value` prop on `textarea` should not be null. ' +
        'Consider using an empty string to clear the component or `undefined` for uncontrolled components.',
    );
    expect(() =>
      ReactDOM.render(<textarea value="controlled" />, container),
    ).toErrorDev(
      'Warning: A component is changing an uncontrolled textarea to be controlled. ' +
        'This is likely caused by the value changing from undefined to ' +
        'a defined value, which should not happen. ' +
        'Decide between using a controlled or uncontrolled textarea ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in textarea (at **)',
    );
  });
});

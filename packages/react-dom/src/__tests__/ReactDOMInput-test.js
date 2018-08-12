/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

function emptyFunction() {}

describe('ReactDOMInput', () => {
  let React;
  let ReactDOM;
  let ReactDOMServer;
  let setUntrackedValue;
  let setUntrackedChecked;
  let container;

  function dispatchEventOnNode(node, type) {
    node.dispatchEvent(new Event(type, {bubbles: true, cancelable: true}));
  }

  beforeEach(() => {
    jest.resetModules();

    setUntrackedValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    ).set;
    setUntrackedChecked = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'checked',
    ).set;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should warn for controlled value of 0 with missing onChange', () => {
    expect(() => {
      ReactDOM.render(<input type="text" value={0} />, container);
    }).toWarnDev(
      'Failed prop type: You provided a `value` prop to a form field without an `onChange` handler.',
    );
  });

  it('should warn for controlled value of "" with missing onChange', () => {
    expect(() => {
      ReactDOM.render(<input type="text" value="" />, container);
    }).toWarnDev(
      'Failed prop type: You provided a `value` prop to a form field without an `onChange` handler.',
    );
  });

  it('should warn for controlled value of "0" with missing onChange', () => {
    expect(() => {
      ReactDOM.render(<input type="text" value="0" />, container);
    }).toWarnDev(
      'Failed prop type: You provided a `value` prop to a form field without an `onChange` handler.',
    );
  });

  it('should warn for controlled value of false with missing onChange', () => {
    expect(() =>
      ReactDOM.render(<input type="checkbox" checked={false} />, container),
    ).toWarnDev(
      'Failed prop type: You provided a `checked` prop to a form field without an `onChange` handler.',
    );
  });

  it('should warn with checked and no onChange handler with readOnly specified', () => {
    ReactDOM.render(
      <input type="checkbox" checked={false} readOnly={true} />,
      container,
    );
    ReactDOM.unmountComponentAtNode(container);

    expect(() =>
      ReactDOM.render(
        <input type="checkbox" checked={false} readOnly={false} />,
        container,
      ),
    ).toWarnDev(
      'Failed prop type: You provided a `checked` prop to a form field without an `onChange` handler. ' +
        'This will render a read-only field. If the field should be mutable use `defaultChecked`. ' +
        'Otherwise, set either `onChange` or `readOnly`.',
    );
  });

  it('should not warn about missing onChange in uncontrolled inputs', () => {
    ReactDOM.render(<input />, container);
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(<input value={undefined} />, container);
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(<input type="text" />, container);
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(<input type="text" value={undefined} />, container);
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(<input type="checkbox" />, container);
    ReactDOM.unmountComponentAtNode(container);
    ReactDOM.render(<input type="checkbox" checked={undefined} />, container);
  });

  it('should properly control a value even if no event listener exists', () => {
    let node;

    expect(() => {
      node = ReactDOM.render(<input type="text" value="lion" />, container);
    }).toWarnDev(
      'Failed prop type: You provided a `value` prop to a form field without an `onChange` handler.',
    );

    setUntrackedValue.call(node, 'giraffe');

    // This must use the native event dispatching. If we simulate, we will
    // bypass the lazy event attachment system so we won't actually test this.
    dispatchEventOnNode(node, 'input');

    expect(node.value).toBe('lion');
  });

  it('should control a value in reentrant events', () => {
    class ControlledInputs extends React.Component {
      state = {value: 'lion'};
      a = null;
      b = null;
      switchedFocus = false;
      change(newValue) {
        this.setState({value: newValue});
        // Calling focus here will blur the text box which causes a native
        // change event. Ideally we shouldn't have to fire this ourselves.
        // Don't remove unless you've verified the fix in #8240 is still covered.
        dispatchEventOnNode(this.a, 'input');
        this.b.focus();
      }
      blur(currentValue) {
        this.switchedFocus = true;
        // currentValue should be 'giraffe' here because we should not have
        // restored it on the target yet.
        this.setState({value: currentValue});
      }
      render() {
        return (
          <div>
            <input
              type="text"
              ref={n => (this.a = n)}
              value={this.state.value}
              onChange={e => this.change(e.target.value)}
              onBlur={e => this.blur(e.target.value)}
            />
            <input type="text" ref={n => (this.b = n)} />
          </div>
        );
      }
    }

    const instance = ReactDOM.render(<ControlledInputs />, container);

    // Focus the field so we can later blur it.
    // Don't remove unless you've verified the fix in #8240 is still covered.
    instance.a.focus();
    setUntrackedValue.call(instance.a, 'giraffe');
    // This must use the native event dispatching. If we simulate, we will
    // bypass the lazy event attachment system so we won't actually test this.
    dispatchEventOnNode(instance.a, 'input');
    dispatchEventOnNode(instance.a, 'blur');

    expect(instance.a.value).toBe('giraffe');
    expect(instance.switchedFocus).toBe(true);
  });

  it('should control values in reentrant events with different targets', () => {
    class ControlledInputs extends React.Component {
      state = {value: 'lion'};
      a = null;
      b = null;
      change(newValue) {
        // This click will change the checkbox's value to false. Then it will
        // invoke an inner change event. When we finally, flush, we need to
        // reset the checkbox's value to true since that is its controlled
        // value.
        this.b.click();
      }
      render() {
        return (
          <div>
            <input
              type="text"
              ref={n => (this.a = n)}
              value="lion"
              onChange={e => this.change(e.target.value)}
            />
            <input
              type="checkbox"
              ref={n => (this.b = n)}
              checked={true}
              onChange={() => {}}
            />
          </div>
        );
      }
    }

    const instance = ReactDOM.render(<ControlledInputs />, container);

    setUntrackedValue.call(instance.a, 'giraffe');
    // This must use the native event dispatching. If we simulate, we will
    // bypass the lazy event attachment system so we won't actually test this.
    dispatchEventOnNode(instance.a, 'input');

    expect(instance.a.value).toBe('lion');
    expect(instance.b.checked).toBe(true);
  });

  describe('switching text inputs between numeric and string numbers', () => {
    it('does change the number 2 to "2.0" with no change handler', () => {
      const stub = <input type="text" value={2} onChange={jest.fn()} />;
      const node = ReactDOM.render(stub, container);

      setUntrackedValue.call(node, '2.0');

      dispatchEventOnNode(node, 'input');

      expect(node.getAttribute('value')).toBe('2');
      expect(node.value).toBe('2');
    });

    it('does change the string "2" to "2.0" with no change handler', () => {
      const stub = <input type="text" value={'2'} onChange={jest.fn()} />;
      const node = ReactDOM.render(stub, container);

      setUntrackedValue.call(node, '2.0');

      dispatchEventOnNode(node, 'input');

      expect(node.getAttribute('value')).toBe('2');
      expect(node.value).toBe('2');
    });

    it('changes the number 2 to "2.0" using a change handler', () => {
      class Stub extends React.Component {
        state = {
          value: 2,
        };
        onChange = event => {
          this.setState({value: event.target.value});
        };
        render() {
          const {value} = this.state;

          return <input type="text" value={value} onChange={this.onChange} />;
        }
      }

      const stub = ReactDOM.render(<Stub />, container);
      const node = ReactDOM.findDOMNode(stub);

      setUntrackedValue.call(node, '2.0');

      dispatchEventOnNode(node, 'input');

      expect(node.getAttribute('value')).toBe('2.0');
      expect(node.value).toBe('2.0');
    });
  });

  it('does change the string ".98" to "0.98" with no change handler', () => {
    class Stub extends React.Component {
      state = {
        value: '.98',
      };
      render() {
        return <input type="number" value={this.state.value} />;
      }
    }

    let stub;
    expect(() => {
      stub = ReactDOM.render(<Stub />, container);
    }).toWarnDev(
      'You provided a `value` prop to a form field ' +
        'without an `onChange` handler.',
    );
    const node = ReactDOM.findDOMNode(stub);
    stub.setState({value: '0.98'});

    expect(node.value).toEqual('0.98');
  });

  it('performs a state change from "" to 0', () => {
    class Stub extends React.Component {
      state = {
        value: '',
      };
      render() {
        return <input type="number" value={this.state.value} readOnly={true} />;
      }
    }

    const stub = ReactDOM.render(<Stub />, container);
    const node = ReactDOM.findDOMNode(stub);
    stub.setState({value: 0});

    expect(node.value).toEqual('0');
  });

  it('updates the value on radio buttons from "" to 0', function() {
    ReactDOM.render(
      <input type="radio" value="" onChange={function() {}} />,
      container,
    );
    ReactDOM.render(
      <input type="radio" value={0} onChange={function() {}} />,
      container,
    );
    expect(container.firstChild.value).toBe('0');
    expect(container.firstChild.getAttribute('value')).toBe('0');
  });

  it('updates the value on checkboxes from "" to 0', function() {
    ReactDOM.render(
      <input type="checkbox" value="" onChange={function() {}} />,
      container,
    );
    ReactDOM.render(
      <input type="checkbox" value={0} onChange={function() {}} />,
      container,
    );
    expect(container.firstChild.value).toBe('0');
    expect(container.firstChild.getAttribute('value')).toBe('0');
  });

  it('distinguishes precision for extra zeroes in string number values', () => {
    class Stub extends React.Component {
      state = {
        value: '3.0000',
      };
      render() {
        return <input type="number" value={this.state.value} />;
      }
    }

    let stub;

    expect(() => {
      stub = ReactDOM.render(<Stub />, container);
    }).toWarnDev(
      'You provided a `value` prop to a form field ' +
        'without an `onChange` handler.',
    );
    const node = ReactDOM.findDOMNode(stub);
    stub.setState({value: '3'});

    expect(node.value).toEqual('3');
  });

  it('should display `defaultValue` of number 0', () => {
    let stub = <input type="text" defaultValue={0} />;
    const node = ReactDOM.render(stub, container);

    expect(node.getAttribute('value')).toBe('0');
    expect(node.value).toBe('0');
  });

  it('only assigns defaultValue if it changes', () => {
    class Test extends React.Component {
      render() {
        return <input defaultValue="0" />;
      }
    }

    const component = ReactDOM.render(<Test />, container);
    const node = ReactDOM.findDOMNode(component);

    Object.defineProperty(node, 'defaultValue', {
      get() {
        return '0';
      },
      set(value) {
        throw new Error(
          `defaultValue was assigned ${value}, but it did not change!`,
        );
      },
    });

    component.forceUpdate();
  });

  it('should display "true" for `defaultValue` of `true`', () => {
    let stub = <input type="text" defaultValue={true} />;
    const node = ReactDOM.render(stub, container);

    expect(node.value).toBe('true');
  });

  it('should display "false" for `defaultValue` of `false`', () => {
    let stub = <input type="text" defaultValue={false} />;
    const node = ReactDOM.render(stub, container);

    expect(node.value).toBe('false');
  });

  it('should update `defaultValue` for uncontrolled input', () => {
    const node = ReactDOM.render(
      <input type="text" defaultValue="0" />,
      container,
    );

    expect(node.value).toBe('0');

    ReactDOM.render(<input type="text" defaultValue="1" />, container);

    expect(node.value).toBe('0');
    expect(node.defaultValue).toBe('1');
  });

  it('should update `defaultValue` for uncontrolled date/time input', () => {
    const node = ReactDOM.render(
      <input type="date" defaultValue="1980-01-01" />,
      container,
    );

    expect(node.value).toBe('1980-01-01');

    ReactDOM.render(<input type="date" defaultValue="2000-01-01" />, container);

    expect(node.value).toBe('1980-01-01');
    expect(node.defaultValue).toBe('2000-01-01');

    ReactDOM.render(<input type="date" />, container);
  });

  it('should take `defaultValue` when changing to uncontrolled input', () => {
    const node = ReactDOM.render(
      <input type="text" value="0" readOnly={true} />,
      container,
    );
    expect(node.value).toBe('0');
    expect(() =>
      ReactDOM.render(<input type="text" defaultValue="1" />, container),
    ).toWarnDev(
      'A component is changing a controlled input of type ' +
        'text to be uncontrolled.',
    );
    expect(node.value).toBe('0');
  });

  it('should render defaultValue for SSR', () => {
    const markup = ReactDOMServer.renderToString(
      <input type="text" defaultValue="1" />,
    );
    const div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.getAttribute('value')).toBe('1');
    expect(div.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should render value for SSR', () => {
    const element = <input type="text" value="1" onChange={() => {}} />;
    const markup = ReactDOMServer.renderToString(element);
    const div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.getAttribute('value')).toBe('1');
    expect(div.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should render name attribute if it is supplied', () => {
    const node = ReactDOM.render(<input type="text" name="name" />, container);
    expect(node.name).toBe('name');
    expect(container.firstChild.getAttribute('name')).toBe('name');
  });

  it('should render name attribute if it is supplied for SSR', () => {
    const element = <input type="text" name="name" />;
    const markup = ReactDOMServer.renderToString(element);
    const div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.getAttribute('name')).toBe('name');
  });

  it('should not render name attribute if it is not supplied', () => {
    ReactDOM.render(<input type="text" />, container);
    expect(container.firstChild.getAttribute('name')).toBe(null);
  });

  it('should not render name attribute if it is not supplied for SSR', () => {
    const element = <input type="text" />;
    const markup = ReactDOMServer.renderToString(element);
    const div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.getAttribute('name')).toBe(null);
  });

  it('should display "foobar" for `defaultValue` of `objToString`', () => {
    const objToString = {
      toString: function() {
        return 'foobar';
      },
    };

    const stub = <input type="text" defaultValue={objToString} />;
    const node = ReactDOM.render(stub, container);

    expect(node.value).toBe('foobar');
  });

  it('should display `value` of number 0', () => {
    const stub = <input type="text" value={0} onChange={emptyFunction} />;
    const node = ReactDOM.render(stub, container);

    expect(node.value).toBe('0');
  });

  it('should allow setting `value` to `true`', () => {
    let stub = <input type="text" value="yolo" onChange={emptyFunction} />;
    const node = ReactDOM.render(stub, container);

    expect(node.value).toBe('yolo');

    stub = ReactDOM.render(
      <input type="text" value={true} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('true');
  });

  it('should allow setting `value` to `false`', () => {
    let stub = <input type="text" value="yolo" onChange={emptyFunction} />;
    const node = ReactDOM.render(stub, container);

    expect(node.value).toBe('yolo');

    stub = ReactDOM.render(
      <input type="text" value={false} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', () => {
    let stub = <input type="text" value="foo" onChange={emptyFunction} />;
    const node = ReactDOM.render(stub, container);

    expect(node.value).toBe('foo');

    const objToString = {
      toString: function() {
        return 'foobar';
      },
    };
    stub = ReactDOM.render(
      <input type="text" value={objToString} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('foobar');
  });

  it('should not incur unnecessary DOM mutations', () => {
    ReactDOM.render(<input value="a" onChange={() => {}} />, container);

    const node = container.firstChild;
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

    ReactDOM.render(<input value="a" onChange={() => {}} />, container);
    expect(nodeValueSetter).toHaveBeenCalledTimes(0);

    ReactDOM.render(<input value="b" onChange={() => {}} />, container);
    expect(nodeValueSetter).toHaveBeenCalledTimes(1);
  });

  it('should not incur unnecessary DOM mutations for numeric type conversion', () => {
    ReactDOM.render(<input value="0" onChange={() => {}} />, container);

    const node = container.firstChild;
    let nodeValue = '0';
    const nodeValueSetter = jest.fn();
    Object.defineProperty(node, 'value', {
      get: function() {
        return nodeValue;
      },
      set: nodeValueSetter.mockImplementation(function(newValue) {
        nodeValue = newValue;
      }),
    });

    ReactDOM.render(<input value={0} onChange={() => {}} />, container);
    expect(nodeValueSetter).toHaveBeenCalledTimes(0);
  });

  it('should not incur unnecessary DOM mutations for the boolean type conversion', () => {
    ReactDOM.render(<input value="true" onChange={() => {}} />, container);

    const node = container.firstChild;
    let nodeValue = 'true';
    const nodeValueSetter = jest.fn();
    Object.defineProperty(node, 'value', {
      get: function() {
        return nodeValue;
      },
      set: nodeValueSetter.mockImplementation(function(newValue) {
        nodeValue = newValue;
      }),
    });

    ReactDOM.render(<input value={true} onChange={() => {}} />, container);
    expect(nodeValueSetter).toHaveBeenCalledTimes(0);
  });

  it('should properly control a value of number `0`', () => {
    const stub = <input type="text" value={0} onChange={emptyFunction} />;
    const node = ReactDOM.render(stub, container);

    setUntrackedValue.call(node, 'giraffe');
    dispatchEventOnNode(node, 'input');
    expect(node.value).toBe('0');
  });

  it('should properly control 0.0 for a text input', () => {
    const stub = <input type="text" value={0} onChange={emptyFunction} />;
    const node = ReactDOM.render(stub, container);

    setUntrackedValue.call(node, '0.0');
    dispatchEventOnNode(node, 'input');
    expect(node.value).toBe('0');
  });

  it('should properly control 0.0 for a number input', () => {
    const stub = <input type="number" value={0} onChange={emptyFunction} />;
    const node = ReactDOM.render(stub, container);

    setUntrackedValue.call(node, '0.0');
    dispatchEventOnNode(node, 'input');
    expect(node.value).toBe('0.0');
  });

  it('should properly transition from an empty value to 0', function() {
    ReactDOM.render(
      <input type="text" value="" onChange={emptyFunction} />,
      container,
    );
    ReactDOM.render(
      <input type="text" value={0} onChange={emptyFunction} />,
      container,
    );

    const node = container.firstChild;

    expect(node.value).toBe('0');
    expect(node.defaultValue).toBe('0');
  });

  it('should properly transition from 0 to an empty value', function() {
    ReactDOM.render(
      <input type="text" value={0} onChange={emptyFunction} />,
      container,
    );
    ReactDOM.render(
      <input type="text" value="" onChange={emptyFunction} />,
      container,
    );

    const node = container.firstChild;

    expect(node.value).toBe('');
    expect(node.defaultValue).toBe('');
  });

  it('should properly transition a text input from 0 to an empty 0.0', function() {
    ReactDOM.render(
      <input type="text" value={0} onChange={emptyFunction} />,
      container,
    );
    ReactDOM.render(
      <input type="text" value="0.0" onChange={emptyFunction} />,
      container,
    );

    const node = container.firstChild;

    expect(node.value).toBe('0.0');
    expect(node.defaultValue).toBe('0.0');
  });

  it('should properly transition a number input from "" to 0', function() {
    ReactDOM.render(
      <input type="number" value="" onChange={emptyFunction} />,
      container,
    );
    ReactDOM.render(
      <input type="number" value={0} onChange={emptyFunction} />,
      container,
    );

    const node = container.firstChild;

    expect(node.value).toBe('0');
    expect(node.defaultValue).toBe('0');
  });

  it('should properly transition a number input from "" to "0"', function() {
    ReactDOM.render(
      <input type="number" value="" onChange={emptyFunction} />,
      container,
    );
    ReactDOM.render(
      <input type="number" value="0" onChange={emptyFunction} />,
      container,
    );

    const node = container.firstChild;

    expect(node.value).toBe('0');
    expect(node.defaultValue).toBe('0');
  });

  it('should have the correct target value', () => {
    let handled = false;
    const handler = function(event) {
      expect(event.target.nodeName).toBe('INPUT');
      handled = true;
    };
    const stub = <input type="text" value={0} onChange={handler} />;
    const node = ReactDOM.render(stub, container);

    setUntrackedValue.call(node, 'giraffe');

    dispatchEventOnNode(node, 'input');

    expect(handled).toBe(true);
  });

  it('should not set a value for submit buttons unnecessarily', () => {
    const stub = <input type="submit" />;
    const node = ReactDOM.render(stub, container);

    // The value shouldn't be '', or else the button will have no text; it
    // should have the default "Submit" or "Submit Query" label. Most browsers
    // report this as not having a `value` attribute at all; IE reports it as
    // the actual label that the user sees.
    expect(
      !node.hasAttribute('value') || node.getAttribute('value').length > 0,
    ).toBe(true);
  });

  it('should control radio buttons', () => {
    class RadioGroup extends React.Component {
      render() {
        return (
          <div>
            <input
              ref="a"
              type="radio"
              name="fruit"
              checked={true}
              onChange={emptyFunction}
            />
            A
            <input ref="b" type="radio" name="fruit" onChange={emptyFunction} />
            B
            <form>
              <input
                ref="c"
                type="radio"
                name="fruit"
                defaultChecked={true}
                onChange={emptyFunction}
              />
            </form>
          </div>
        );
      }
    }

    const stub = ReactDOM.render(<RadioGroup />, container);
    const aNode = stub.refs.a;
    const bNode = stub.refs.b;
    const cNode = stub.refs.c;

    expect(aNode.checked).toBe(true);
    expect(aNode.hasAttribute('checked')).toBe(true);
    expect(bNode.checked).toBe(false);
    expect(bNode.hasAttribute('checked')).toBe(false);
    // c is in a separate form and shouldn't be affected at all here
    expect(cNode.checked).toBe(true);
    expect(cNode.hasAttribute('checked')).toBe(true);

    setUntrackedChecked.call(bNode, true);
    expect(aNode.checked).toBe(false);
    expect(cNode.checked).toBe(true);

    // The original 'checked' attribute should be unchanged
    expect(aNode.hasAttribute('checked')).toBe(true);
    expect(bNode.hasAttribute('checked')).toBe(false);
    expect(cNode.hasAttribute('checked')).toBe(true);

    // Now let's run the actual ReactDOMInput change event handler
    dispatchEventOnNode(bNode, 'click');

    // The original state should have been restored
    expect(aNode.checked).toBe(true);
    expect(cNode.checked).toBe(true);
  });

  it('should check the correct radio when the selected name moves', () => {
    class App extends React.Component {
      state = {
        updated: false,
      };
      onClick = () => {
        this.setState({updated: true});
      };
      render() {
        const {updated} = this.state;
        const radioName = updated ? 'secondName' : 'firstName';
        return (
          <div>
            <button type="button" onClick={this.onClick} />
            <input
              type="radio"
              name={radioName}
              onChange={emptyFunction}
              checked={updated === true}
            />
            <input
              type="radio"
              name={radioName}
              onChange={emptyFunction}
              checked={updated === false}
            />
          </div>
        );
      }
    }

    const stub = ReactDOM.render(<App />, container);
    const buttonNode = ReactDOM.findDOMNode(stub).childNodes[0];
    const firstRadioNode = ReactDOM.findDOMNode(stub).childNodes[1];
    expect(firstRadioNode.checked).toBe(false);
    dispatchEventOnNode(buttonNode, 'click');
    expect(firstRadioNode.checked).toBe(true);
  });

  it('should control radio buttons if the tree updates during render', () => {
    const sharedParent = container;
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');

    sharedParent.appendChild(container1);

    let aNode;
    let bNode;
    class ComponentA extends React.Component {
      state = {changed: false};
      handleChange = () => {
        this.setState({
          changed: true,
        });
      };
      componentDidUpdate() {
        sharedParent.appendChild(container2);
      }
      componentDidMount() {
        ReactDOM.render(<ComponentB />, container2);
      }
      render() {
        return (
          <div>
            <input
              ref={n => (aNode = n)}
              type="radio"
              name="fruit"
              checked={false}
              onChange={this.handleChange}
            />
            A
          </div>
        );
      }
    }

    class ComponentB extends React.Component {
      render() {
        return (
          <div>
            <input
              ref={n => (bNode = n)}
              type="radio"
              name="fruit"
              checked={true}
              onChange={emptyFunction}
            />
            B
          </div>
        );
      }
    }

    ReactDOM.render(<ComponentA />, container1);

    expect(aNode.checked).toBe(false);
    expect(bNode.checked).toBe(true);

    setUntrackedChecked.call(aNode, true);
    // This next line isn't necessary in a proper browser environment, but
    // jsdom doesn't uncheck the others in a group (because they are not yet
    // sharing a parent), which makes this whole test a little less effective.
    setUntrackedChecked.call(bNode, false);

    // Now let's run the actual ReactDOMInput change event handler
    dispatchEventOnNode(aNode, 'click');

    // The original state should have been restored
    expect(aNode.checked).toBe(false);
    expect(bNode.checked).toBe(true);
  });

  it('should warn with value and no onChange handler and readOnly specified', () => {
    ReactDOM.render(
      <input type="text" value="zoink" readOnly={true} />,
      container,
    );
    ReactDOM.unmountComponentAtNode(container);

    expect(() =>
      ReactDOM.render(
        <input type="text" value="zoink" readOnly={false} />,
        container,
      ),
    ).toWarnDev(
      'Warning: Failed prop type: You provided a `value` prop to a form ' +
        'field without an `onChange` handler. This will render a read-only ' +
        'field. If the field should be mutable use `defaultValue`. ' +
        'Otherwise, set either `onChange` or `readOnly`.\n' +
        '    in input (at **)',
    );
  });

  it('should have a this value of undefined if bind is not used', () => {
    expect.assertions(1);
    const unboundInputOnChange = function() {
      expect(this).toBe(undefined);
    };

    const stub = <input type="text" onChange={unboundInputOnChange} />;
    const node = ReactDOM.render(stub, container);

    setUntrackedValue.call(node, 'giraffe');
    dispatchEventOnNode(node, 'input');
  });

  it('should update defaultValue to empty string', () => {
    ReactDOM.render(<input type="text" defaultValue={'foo'} />, container);
    ReactDOM.render(<input type="text" defaultValue={''} />, container);
    expect(container.firstChild.defaultValue).toBe('');
  });

  it('should warn if value is null', () => {
    expect(() =>
      ReactDOM.render(<input type="text" value={null} />, container),
    ).toWarnDev(
      '`value` prop on `input` should not be null. ' +
        'Consider using an empty string to clear the component or `undefined` ' +
        'for uncontrolled components.',
    );
    ReactDOM.unmountComponentAtNode(container);

    ReactDOM.render(<input type="text" value={null} />, container);
  });

  it('should warn if checked and defaultChecked props are specified', () => {
    expect(() =>
      ReactDOM.render(
        <input
          type="radio"
          checked={true}
          defaultChecked={true}
          readOnly={true}
        />,
        container,
      ),
    ).toWarnDev(
      'A component contains an input of type radio with both checked and defaultChecked props. ' +
        'Input elements must be either controlled or uncontrolled ' +
        '(specify either the checked prop, or the defaultChecked prop, but not ' +
        'both). Decide between using a controlled or uncontrolled input ' +
        'element and remove one of these props. More info: ' +
        'https://fb.me/react-controlled-components',
    );
    ReactDOM.unmountComponentAtNode(container);

    ReactDOM.render(
      <input
        type="radio"
        checked={true}
        defaultChecked={true}
        readOnly={true}
      />,
      container,
    );
  });

  it('should warn if value and defaultValue props are specified', () => {
    expect(() =>
      ReactDOM.render(
        <input type="text" value="foo" defaultValue="bar" readOnly={true} />,
        container,
      ),
    ).toWarnDev(
      'A component contains an input of type text with both value and defaultValue props. ' +
        'Input elements must be either controlled or uncontrolled ' +
        '(specify either the value prop, or the defaultValue prop, but not ' +
        'both). Decide between using a controlled or uncontrolled input ' +
        'element and remove one of these props. More info: ' +
        'https://fb.me/react-controlled-components',
    );
    ReactDOM.unmountComponentAtNode(container);

    ReactDOM.render(
      <input type="text" value="foo" defaultValue="bar" readOnly={true} />,
      container,
    );
  });

  it('should warn if controlled input switches to uncontrolled (value is undefined)', () => {
    const stub = (
      <input type="text" value="controlled" onChange={emptyFunction} />
    );
    ReactDOM.render(stub, container);
    expect(() => ReactDOM.render(<input type="text" />, container)).toWarnDev(
      'Warning: A component is changing a controlled input of type text to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if controlled input switches to uncontrolled (value is null)', () => {
    const stub = (
      <input type="text" value="controlled" onChange={emptyFunction} />
    );
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="text" value={null} />, container),
    ).toWarnDev([
      '`value` prop on `input` should not be null. ' +
        'Consider using an empty string to clear the component or `undefined` for uncontrolled components',
      'Warning: A component is changing a controlled input of type text to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    ]);
  });

  it('should warn if controlled input switches to uncontrolled with defaultValue', () => {
    const stub = (
      <input type="text" value="controlled" onChange={emptyFunction} />
    );
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(
        <input type="text" defaultValue="uncontrolled" />,
        container,
      ),
    ).toWarnDev(
      'Warning: A component is changing a controlled input of type text to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if uncontrolled input (value is undefined) switches to controlled', () => {
    const stub = <input type="text" />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="text" value="controlled" />, container),
    ).toWarnDev(
      'Warning: A component is changing an uncontrolled input of type text to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if uncontrolled input (value is null) switches to controlled', () => {
    const stub = <input type="text" value={null} />;
    expect(() => ReactDOM.render(stub, container)).toWarnDev(
      '`value` prop on `input` should not be null. ' +
        'Consider using an empty string to clear the component or `undefined` for uncontrolled components.',
    );
    expect(() =>
      ReactDOM.render(<input type="text" value="controlled" />, container),
    ).toWarnDev(
      'Warning: A component is changing an uncontrolled input of type text to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if controlled checkbox switches to uncontrolled (checked is undefined)', () => {
    const stub = (
      <input type="checkbox" checked={true} onChange={emptyFunction} />
    );
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="checkbox" />, container),
    ).toWarnDev(
      'Warning: A component is changing a controlled input of type checkbox to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if controlled checkbox switches to uncontrolled (checked is null)', () => {
    const stub = (
      <input type="checkbox" checked={true} onChange={emptyFunction} />
    );
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="checkbox" checked={null} />, container),
    ).toWarnDev(
      'Warning: A component is changing a controlled input of type checkbox to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if controlled checkbox switches to uncontrolled with defaultChecked', () => {
    const stub = (
      <input type="checkbox" checked={true} onChange={emptyFunction} />
    );
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(
        <input type="checkbox" defaultChecked={true} />,
        container,
      ),
    ).toWarnDev(
      'Warning: A component is changing a controlled input of type checkbox to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if uncontrolled checkbox (checked is undefined) switches to controlled', () => {
    const stub = <input type="checkbox" />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="checkbox" checked={true} />, container),
    ).toWarnDev(
      'Warning: A component is changing an uncontrolled input of type checkbox to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if uncontrolled checkbox (checked is null) switches to controlled', () => {
    const stub = <input type="checkbox" checked={null} />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="checkbox" checked={true} />, container),
    ).toWarnDev(
      'Warning: A component is changing an uncontrolled input of type checkbox to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if controlled radio switches to uncontrolled (checked is undefined)', () => {
    const stub = <input type="radio" checked={true} onChange={emptyFunction} />;
    ReactDOM.render(stub, container);
    expect(() => ReactDOM.render(<input type="radio" />, container)).toWarnDev(
      'Warning: A component is changing a controlled input of type radio to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if controlled radio switches to uncontrolled (checked is null)', () => {
    const stub = <input type="radio" checked={true} onChange={emptyFunction} />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="radio" checked={null} />, container),
    ).toWarnDev(
      'Warning: A component is changing a controlled input of type radio to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if controlled radio switches to uncontrolled with defaultChecked', () => {
    const stub = <input type="radio" checked={true} onChange={emptyFunction} />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="radio" defaultChecked={true} />, container),
    ).toWarnDev(
      'Warning: A component is changing a controlled input of type radio to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if uncontrolled radio (checked is undefined) switches to controlled', () => {
    const stub = <input type="radio" />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="radio" checked={true} />, container),
    ).toWarnDev(
      'Warning: A component is changing an uncontrolled input of type radio to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should warn if uncontrolled radio (checked is null) switches to controlled', () => {
    const stub = <input type="radio" checked={null} />;
    ReactDOM.render(stub, container);
    expect(() =>
      ReactDOM.render(<input type="radio" checked={true} />, container),
    ).toWarnDev(
      'Warning: A component is changing an uncontrolled input of type radio to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('should not warn if radio value changes but never becomes controlled', () => {
    ReactDOM.render(<input type="radio" value="value" />, container);
    ReactDOM.render(<input type="radio" />, container);
    ReactDOM.render(
      <input type="radio" value="value" defaultChecked={true} />,
      container,
    );
    ReactDOM.render(
      <input type="radio" value="value" onChange={() => null} />,
      container,
    );
    ReactDOM.render(<input type="radio" />, container);
  });

  it('should not warn if radio value changes but never becomes uncontrolled', () => {
    ReactDOM.render(
      <input type="radio" checked={false} onChange={() => null} />,
      container,
    );
    ReactDOM.render(
      <input
        type="radio"
        value="value"
        defaultChecked={true}
        checked={false}
        onChange={() => null}
      />,
      container,
    );
  });

  it('should warn if radio checked false changes to become uncontrolled', () => {
    ReactDOM.render(
      <input
        type="radio"
        value="value"
        checked={false}
        onChange={() => null}
      />,
      container,
    );
    expect(() =>
      ReactDOM.render(<input type="radio" value="value" />, container),
    ).toWarnDev(
      'Warning: A component is changing a controlled input of type radio to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components\n' +
        '    in input (at **)',
    );
  });

  it('sets type, step, min, max before value always', () => {
    const log = [];
    const originalCreateElement = document.createElement;
    spyOnDevAndProd(document, 'createElement').and.callFake(function(type) {
      const el = originalCreateElement.apply(this, arguments);
      let value = '';

      if (type === 'input') {
        Object.defineProperty(el, 'value', {
          get: function() {
            return value;
          },
          set: function(val) {
            value = '' + val;
            log.push('set property value');
          },
        });
        spyOnDevAndProd(el, 'setAttribute').and.callFake(function(name) {
          log.push('set attribute ' + name);
        });
      }
      return el;
    });

    ReactDOM.render(
      <input
        value="0"
        onChange={() => {}}
        type="range"
        min="0"
        max="100"
        step="1"
      />,
      container,
    );
    expect(log).toEqual([
      'set attribute type',
      'set attribute min',
      'set attribute max',
      'set attribute step',
      'set property value',
      'set attribute value',
      'set attribute checked',
    ]);
  });

  it('sets value properly with type coming later in props', () => {
    const input = ReactDOM.render(<input value="hi" type="radio" />, container);
    expect(input.value).toBe('hi');
  });

  it('does not raise a validation warning when it switches types', () => {
    class Input extends React.Component {
      state = {type: 'number', value: 1000};

      render() {
        const {value, type} = this.state;
        return <input onChange={() => {}} type={type} value={value} />;
      }
    }

    const input = ReactDOM.render(<Input />, container);
    const node = ReactDOM.findDOMNode(input);

    // If the value is set before the type, a validation warning will raise and
    // the value will not be assigned.
    input.setState({type: 'text', value: 'Test'});
    expect(node.value).toEqual('Test');
  });

  it('resets value of date/time input to fix bugs in iOS Safari', () => {
    function strify(x) {
      return JSON.stringify(x, null, 2);
    }

    const log = [];
    const originalCreateElement = document.createElement;
    spyOnDevAndProd(document, 'createElement').and.callFake(function(type) {
      const el = originalCreateElement.apply(this, arguments);
      let value = '';
      if (type === 'input') {
        Object.defineProperty(el, 'value', {
          get: function() {
            return value;
          },
          set: function(val) {
            value = '' + val;
            log.push(`node.value = ${strify(val)}`);
          },
        });
        spyOnDevAndProd(el, 'setAttribute').and.callFake(function(name, val) {
          log.push(`node.setAttribute(${strify(name)}, ${strify(val)})`);
        });
      }
      return el;
    });

    ReactDOM.render(<input type="date" defaultValue="1980-01-01" />, container);
    expect(log).toEqual([
      'node.setAttribute("type", "date")',
      'node.value = "1980-01-01"',
      'node.setAttribute("value", "1980-01-01")',
      'node.setAttribute("checked", "")',
    ]);
  });

  describe('assigning the value attribute on controlled inputs', function() {
    function getTestInput() {
      return class extends React.Component {
        state = {
          value: this.props.value == null ? '' : this.props.value,
        };
        onChange = event => {
          this.setState({value: event.target.value});
        };
        render() {
          const type = this.props.type;
          const value = this.state.value;

          return <input type={type} value={value} onChange={this.onChange} />;
        }
      };
    }

    it('always sets the attribute when values change on text inputs', function() {
      const Input = getTestInput();
      const stub = ReactDOM.render(<Input type="text" />, container);
      const node = ReactDOM.findDOMNode(stub);

      setUntrackedValue.call(node, '2');
      dispatchEventOnNode(node, 'input');

      expect(node.getAttribute('value')).toBe('2');
    });

    it('does not set the value attribute on number inputs if focused', () => {
      const Input = getTestInput();
      const stub = ReactDOM.render(
        <Input type="number" value="1" />,
        container,
      );
      const node = ReactDOM.findDOMNode(stub);

      node.focus();

      setUntrackedValue.call(node, '2');
      dispatchEventOnNode(node, 'input');

      expect(node.getAttribute('value')).toBe('1');
    });

    it('sets the value attribute on number inputs on blur', () => {
      const Input = getTestInput();
      const stub = ReactDOM.render(
        <Input type="number" value="1" />,
        container,
      );
      const node = ReactDOM.findDOMNode(stub);

      setUntrackedValue.call(node, '2');
      dispatchEventOnNode(node, 'input');
      dispatchEventOnNode(node, 'blur');

      expect(node.getAttribute('value')).toBe('2');
    });

    it('an uncontrolled number input will not update the value attribute on blur', () => {
      const node = ReactDOM.render(
        <input type="number" defaultValue="1" />,
        container,
      );

      setUntrackedValue.call(node, 4);

      dispatchEventOnNode(node, 'blur');

      expect(node.getAttribute('value')).toBe('1');
    });

    it('an uncontrolled text input will not update the value attribute on blur', () => {
      const node = ReactDOM.render(
        <input type="text" defaultValue="1" />,
        container,
      );

      setUntrackedValue.call(node, 4);

      dispatchEventOnNode(node, 'blur');

      expect(node.getAttribute('value')).toBe('1');
    });
  });

  describe('setting a controlled input to undefined', () => {
    let input;

    function renderInputWithStringThenWithUndefined() {
      let setValueToUndefined;
      class Input extends React.Component {
        constructor() {
          super();
          setValueToUndefined = () => this.setState({value: undefined});
        }
        state = {value: 'first'};
        render() {
          return (
            <input
              onChange={e => this.setState({value: e.target.value})}
              value={this.state.value}
            />
          );
        }
      }

      const stub = ReactDOM.render(<Input />, container);
      input = ReactDOM.findDOMNode(stub);
      setUntrackedValue.call(input, 'latest');
      dispatchEventOnNode(input, 'input');
      setValueToUndefined();
    }

    it('reverts the value attribute to the initial value', () => {
      expect(renderInputWithStringThenWithUndefined).toWarnDev(
        'Input elements should not switch from controlled to ' +
          'uncontrolled (or vice versa).',
      );
      expect(input.getAttribute('value')).toBe('first');
    });

    it('preserves the value property', () => {
      expect(renderInputWithStringThenWithUndefined).toWarnDev(
        'Input elements should not switch from controlled to ' +
          'uncontrolled (or vice versa).',
      );
      expect(input.value).toBe('latest');
    });
  });

  describe('setting a controlled input to null', () => {
    let input;

    function renderInputWithStringThenWithNull() {
      let setValueToNull;
      class Input extends React.Component {
        constructor() {
          super();
          setValueToNull = () => this.setState({value: null});
        }
        state = {value: 'first'};
        render() {
          return (
            <input
              onChange={e => this.setState({value: e.target.value})}
              value={this.state.value}
            />
          );
        }
      }

      const stub = ReactDOM.render(<Input />, container);
      input = ReactDOM.findDOMNode(stub);
      setUntrackedValue.call(input, 'latest');
      dispatchEventOnNode(input, 'input');
      setValueToNull();
    }

    it('reverts the value attribute to the initial value', () => {
      expect(renderInputWithStringThenWithNull).toWarnDev([
        '`value` prop on `input` should not be null. ' +
          'Consider using an empty string to clear the component ' +
          'or `undefined` for uncontrolled components.',
        'Input elements should not switch from controlled ' +
          'to uncontrolled (or vice versa).',
      ]);
      expect(input.getAttribute('value')).toBe('first');
    });

    it('preserves the value property', () => {
      expect(renderInputWithStringThenWithNull).toWarnDev([
        '`value` prop on `input` should not be null. ' +
          'Consider using an empty string to clear the component ' +
          'or `undefined` for uncontrolled components.',
        'Input elements should not switch from controlled ' +
          'to uncontrolled (or vice versa).',
      ]);
      expect(input.value).toBe('latest');
    });
  });

  describe('When given a Symbol value', function() {
    it('treats initial Symbol value as an empty string', function() {
      expect(() =>
        ReactDOM.render(
          <input value={Symbol('foobar')} onChange={() => {}} />,
          container,
        ),
      ).toWarnDev('Invalid value for prop `value`');
      const node = container.firstChild;

      expect(node.value).toBe('');
      expect(node.getAttribute('value')).toBe('');
    });

    it('treats updated Symbol value as an empty string', function() {
      ReactDOM.render(<input value="foo" onChange={() => {}} />, container);
      expect(() =>
        ReactDOM.render(
          <input value={Symbol('foobar')} onChange={() => {}} />,
          container,
        ),
      ).toWarnDev('Invalid value for prop `value`');
      const node = container.firstChild;

      expect(node.value).toBe('');
      expect(node.getAttribute('value')).toBe('');
    });

    it('treats initial Symbol defaultValue as an empty string', function() {
      ReactDOM.render(<input defaultValue={Symbol('foobar')} />, container);
      const node = container.firstChild;

      expect(node.value).toBe('');
      expect(node.getAttribute('value')).toBe('');
      // TODO: we should warn here.
    });

    it('treats updated Symbol defaultValue as an empty string', function() {
      ReactDOM.render(<input defaultValue="foo" />, container);
      ReactDOM.render(<input defaultValue={Symbol('foobar')} />, container);
      const node = container.firstChild;

      expect(node.value).toBe('foo');
      expect(node.getAttribute('value')).toBe('');
      // TODO: we should warn here.
    });
  });

  describe('When given a function value', function() {
    it('treats initial function value as an empty string', function() {
      expect(() =>
        ReactDOM.render(
          <input value={() => {}} onChange={() => {}} />,
          container,
        ),
      ).toWarnDev('Invalid value for prop `value`');
      const node = container.firstChild;

      expect(node.value).toBe('');
      expect(node.getAttribute('value')).toBe('');
    });

    it('treats updated function value as an empty string', function() {
      ReactDOM.render(<input value="foo" onChange={() => {}} />, container);
      expect(() =>
        ReactDOM.render(
          <input value={() => {}} onChange={() => {}} />,
          container,
        ),
      ).toWarnDev('Invalid value for prop `value`');
      const node = container.firstChild;

      expect(node.value).toBe('');
      expect(node.getAttribute('value')).toBe('');
    });

    it('treats initial function defaultValue as an empty string', function() {
      ReactDOM.render(<input defaultValue={() => {}} />, container);
      const node = container.firstChild;

      expect(node.value).toBe('');
      expect(node.getAttribute('value')).toBe('');
      // TODO: we should warn here.
    });

    it('treats updated function defaultValue as an empty string', function() {
      ReactDOM.render(<input defaultValue="foo" />, container);
      ReactDOM.render(<input defaultValue={() => {}} />, container);
      const node = container.firstChild;

      expect(node.value).toBe('foo');
      expect(node.getAttribute('value')).toBe('');
      // TODO: we should warn here.
    });
  });

  describe('checked inputs without a value property', function() {
    // In absence of a value, radio and checkboxes report a value of "on".
    // Between 16 and 16.2, we assigned a node's value to it's current
    // value in order to "dettach" it from defaultValue. This had the unfortunate
    // side-effect of assigning value="on" to radio and checkboxes
    it('does not add "on" in absence of value on a checkbox', function() {
      ReactDOM.render(
        <input type="checkbox" defaultChecked={true} />,
        container,
      );
      const node = container.firstChild;

      expect(node.value).toBe('on');
      expect(node.hasAttribute('value')).toBe(false);
    });

    it('does not add "on" in absence of value on a radio', function() {
      ReactDOM.render(<input type="radio" defaultChecked={true} />, container);
      const node = container.firstChild;

      expect(node.value).toBe('on');
      expect(node.hasAttribute('value')).toBe(false);
    });
  });
});

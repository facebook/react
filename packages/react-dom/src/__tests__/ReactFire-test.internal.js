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

describe('ReactFire', () => {
  let React;
  let ReactDOM;
  let ReactDOMServer;
  let ReactFeatureFlags;
  let container;

  function dispatchEventOnNode(node, type) {
    node.dispatchEvent(new Event(type, {bubbles: true, cancelable: true}));
  }

  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.disableInputAttributeSyncing = true;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('DOMPropertyOperations', () => {
    it('should not remove empty attributes for special input properties', () => {
      ReactDOM.render(<input value="" onChange={() => {}} />, container);
      expect(container.firstChild.hasAttribute('value')).toBe(false);
      expect(container.firstChild.value).toBe('');
    });

    it('should not remove attributes for special properties', () => {
      ReactDOM.render(
        <input type="text" value="foo" onChange={function() {}} />,
        container,
      );
      expect(container.firstChild.hasAttribute('value')).toBe(false);
      expect(container.firstChild.value).toBe('foo');
      expect(() =>
        ReactDOM.render(
          <input type="text" onChange={function() {}} />,
          container,
        ),
      ).toWarnDev(
        'A component is changing a controlled input of type text to be uncontrolled',
      );
      expect(container.firstChild.hasAttribute('value')).toBe(false);
      expect(container.firstChild.value).toBe('foo');
    });
  });

  describe('ReactDOMInput', () => {
    let setUntrackedValue;
    let setUntrackedChecked;
    beforeEach(() => {
      setUntrackedValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      ).set;
      setUntrackedChecked = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'checked',
      ).set;
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

        expect(node.hasAttribute('value')).toBe(false);
        expect(node.value).toBe('2');
      });

      it('does change the string "2" to "2.0" with no change handler', () => {
        const stub = <input type="text" value={'2'} onChange={jest.fn()} />;
        const node = ReactDOM.render(stub, container);

        setUntrackedValue.call(node, '2.0');

        dispatchEventOnNode(node, 'input');

        expect(node.hasAttribute('value')).toBe(false);
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

        expect(node.hasAttribute('value')).toBe(false);
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
          return (
            <input type="number" value={this.state.value} readOnly={true} />
          );
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
      expect(node.defaultValue).toBe('0');

      ReactDOM.render(<input type="text" defaultValue="1" />, container);

      expect(node.value).toBe('1');
      expect(node.defaultValue).toBe('1');
    });

    it('should update `defaultValue` for uncontrolled date/time input', () => {
      const node = ReactDOM.render(
        <input type="date" defaultValue="1980-01-01" />,
        container,
      );

      expect(node.value).toBe('1980-01-01');
      expect(node.defaultValue).toBe('1980-01-01');

      ReactDOM.render(
        <input type="date" defaultValue="2000-01-01" />,
        container,
      );

      expect(node.value).toBe('2000-01-01');
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
      const node = ReactDOM.render(
        <input type="text" name="name" />,
        container,
      );
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
      expect(node.hasAttribute('value')).toBe(false);
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
      expect(node.hasAttribute('value')).toBe(false);
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
      expect(node.hasAttribute('value')).toBe(false);
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
      expect(node.hasAttribute('value')).toBe(false);
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
      expect(node.hasAttribute('value')).toBe(false);
    });

    it('should not set a value for submit buttons unnecessarily', () => {
      const stub = <input type="submit" />;
      ReactDOM.render(stub, container);
      const node = container.firstChild;

      // The value shouldn't be '', or else the button will have no text; it
      // should have the default "Submit" or "Submit Query" label. Most browsers
      // report this as not having a `value` attribute at all; IE reports it as
      // the actual label that the user sees.
      expect(node.hasAttribute('value')).toBe(false);
    });

    it('should remove the value attribute on submit inputs when value is updated to undefined', () => {
      const stub = <input type="submit" value="foo" onChange={emptyFunction} />;
      ReactDOM.render(stub, container);

      // Not really relevant to this particular test, but changing to undefined
      // should nonetheless trigger a warning
      expect(() =>
        ReactDOM.render(
          <input type="submit" value={undefined} onChange={emptyFunction} />,
          container,
        ),
      ).toWarnDev(
        'A component is changing a controlled input of type ' +
          'submit to be uncontrolled.',
      );

      const node = container.firstChild;
      expect(node.hasAttribute('value')).toBe(false);
    });

    it('should remove the value attribute on reset inputs when value is updated to undefined', () => {
      const stub = <input type="reset" value="foo" onChange={emptyFunction} />;
      ReactDOM.render(stub, container);

      // Not really relevant to this particular test, but changing to undefined
      // should nonetheless trigger a warning
      expect(() =>
        ReactDOM.render(
          <input type="reset" value={undefined} onChange={emptyFunction} />,
          container,
        ),
      ).toWarnDev(
        'A component is changing a controlled input of type ' +
          'reset to be uncontrolled.',
      );

      const node = container.firstChild;
      expect(node.hasAttribute('value')).toBe(false);
    });

    it('should set a value on a submit input', () => {
      let stub = <input type="submit" value="banana" />;
      ReactDOM.render(stub, container);
      const node = container.firstChild;

      expect(node.getAttribute('value')).toBe('banana');
    });

    it('should not set an undefined value on a submit input', () => {
      let stub = <input type="submit" value={undefined} />;
      ReactDOM.render(stub, container);
      const node = container.firstChild;

      // Note: it shouldn't be an empty string
      // because that would erase the "submit" label.
      expect(node.hasAttribute('value')).toBe(false);

      ReactDOM.render(stub, container);
      expect(node.hasAttribute('value')).toBe(false);
    });

    it('should not set an undefined value on a reset input', () => {
      let stub = <input type="reset" value={undefined} />;
      ReactDOM.render(stub, container);
      const node = container.firstChild;

      // Note: it shouldn't be an empty string
      // because that would erase the "reset" label.
      expect(node.hasAttribute('value')).toBe(false);

      ReactDOM.render(stub, container);
      expect(node.hasAttribute('value')).toBe(false);
    });

    it('should not set a null value on a submit input', () => {
      let stub = <input type="submit" value={null} />;
      expect(() => {
        ReactDOM.render(stub, container);
      }).toWarnDev('`value` prop on `input` should not be null');
      const node = container.firstChild;

      // Note: it shouldn't be an empty string
      // because that would erase the "submit" label.
      expect(node.hasAttribute('value')).toBe(false);

      ReactDOM.render(stub, container);
      expect(node.hasAttribute('value')).toBe(false);
    });

    it('should not set a null value on a reset input', () => {
      let stub = <input type="reset" value={null} />;
      expect(() => {
        ReactDOM.render(stub, container);
      }).toWarnDev('`value` prop on `input` should not be null');
      const node = container.firstChild;

      // Note: it shouldn't be an empty string
      // because that would erase the "reset" label.
      expect(node.hasAttribute('value')).toBe(false);

      ReactDOM.render(stub, container);
      expect(node.hasAttribute('value')).toBe(false);
    });

    it('should set a value on a reset input', () => {
      let stub = <input type="reset" value="banana" />;
      ReactDOM.render(stub, container);
      const node = container.firstChild;

      expect(node.getAttribute('value')).toBe('banana');
    });

    it('should set an empty string value on a submit input', () => {
      let stub = <input type="submit" value="" />;
      ReactDOM.render(stub, container);
      const node = container.firstChild;

      expect(node.getAttribute('value')).toBe('');
    });

    it('should set an empty string value on a reset input', () => {
      let stub = <input type="reset" value="" />;
      ReactDOM.render(stub, container);
      const node = container.firstChild;

      expect(node.getAttribute('value')).toBe('');
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
              <input
                ref="b"
                type="radio"
                name="fruit"
                onChange={emptyFunction}
              />
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
      expect(bNode.checked).toBe(false);
      // c is in a separate form and shouldn't be affected at all here
      expect(cNode.checked).toBe(true);

      setUntrackedChecked.call(bNode, true);
      expect(aNode.checked).toBe(false);
      expect(cNode.checked).toBe(true);

      // The original 'checked' attribute should be unchanged
      expect(aNode.hasAttribute('checked')).toBe(false);
      expect(bNode.hasAttribute('checked')).toBe(false);
      expect(cNode.hasAttribute('checked')).toBe(true);

      // Now let's run the actual ReactDOMInput change event handler
      dispatchEventOnNode(bNode, 'click');

      // The original state should have been restored
      expect(aNode.checked).toBe(true);
      expect(cNode.checked).toBe(true);
    });

    it('should update defaultValue to empty string', () => {
      ReactDOM.render(<input type="text" defaultValue={'foo'} />, container);
      ReactDOM.render(<input type="text" defaultValue={''} />, container);
      expect(container.firstChild.getAttribute('value')).toBe('');
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
      ]);
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

      ReactDOM.render(
        <input type="date" defaultValue="1980-01-01" />,
        container,
      );
      expect(log).toEqual([
        'node.setAttribute("type", "date")',
        'node.setAttribute("value", "1980-01-01")',
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

      it('retains the value attribute when values change on text inputs', function() {
        const Input = getTestInput();
        const stub = ReactDOM.render(<Input type="text" />, container);
        const node = ReactDOM.findDOMNode(stub);

        setUntrackedValue.call(node, '2');
        dispatchEventOnNode(node, 'input');

        expect(node.hasAttribute('value')).toBe(false);
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
        expect(input.getAttribute('value')).toBe(null);
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
        expect(input.hasAttribute('value')).toBe(false);
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
        expect(node.getAttribute('value')).toBe(null);
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
        expect(node.getAttribute('value')).toBe(null);
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
        ReactDOM.render(
          <input type="radio" defaultChecked={true} />,
          container,
        );
        const node = container.firstChild;

        expect(node.value).toBe('on');
        expect(node.hasAttribute('value')).toBe(false);
      });
    });
  });
});

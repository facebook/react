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

var emptyFunction = require('emptyFunction');

describe('ReactDOMInput', () => {
  var React;
  var ReactDOM;
  var ReactDOMServer;
  var ReactDOMFeatureFlags;
  var ReactLink;
  var ReactTestUtils;

  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMServer = require('ReactDOMServer');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');
    spyOn(console, 'error');
  });

  it('should properly control a value even if no event listener exists', () => {
    var container = document.createElement('div');
    var stub = ReactDOM.render(<input type="text" value="lion" />, container);

    document.body.appendChild(container);

    var node = ReactDOM.findDOMNode(stub);
    expectDev(console.error.calls.count()).toBe(1);

    // Simulate a native change event
    setUntrackedValue(node, 'giraffe');

    // This must use the native event dispatching. If we simulate, we will
    // bypass the lazy event attachment system so we won't actually test this.
    var nativeEvent = document.createEvent('Event');
    nativeEvent.initEvent('change', true, true);
    node.dispatchEvent(nativeEvent);

    expect(node.value).toBe('lion');

    document.body.removeChild(container);
  });

  it('should control a value in reentrant events', () => {
    // This must use the native event dispatching. If we simulate, we will
    // bypass the lazy event attachment system so we won't actually test this.
    var inputEvent = document.createEvent('Event');
    inputEvent.initEvent('input', true, true);
    // This must use the native event dispatching. If we simulate, we will
    // bypass the lazy event attachment system so we won't actually test this.
    var changeEvent = document.createEvent('Event');
    changeEvent.initEvent('change', true, true);

    class ControlledInputs extends React.Component {
      state = {value: 'lion'};
      a = null;
      b = null;
      switchedFocus = false;
      change(newValue) {
        this.setState({value: newValue});
        // Calling focus here will blur the text box which causes a native
        // change event. Ideally we shouldn't have to fire this ourselves.
        // I don't know how to simulate a change event on a text box.
        this.a.dispatchEvent(changeEvent);
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

    var container = document.createElement('div');
    var instance = ReactDOM.render(<ControlledInputs />, container);

    // We need it to be in the body to test native event dispatching.
    document.body.appendChild(container);

    instance.a.focus();
    // Simulate a native keyup event
    setUntrackedValue(instance.a, 'giraffe');

    instance.a.dispatchEvent(inputEvent);

    expect(instance.a.value).toBe('giraffe');
    expect(instance.switchedFocus).toBe(true);

    document.body.removeChild(container);
  });

  it('should control values in reentrant events with different targets', () => {
    // This must use the native event dispatching. If we simulate, we will
    // bypass the lazy event attachment system so we won't actually test this.
    var inputEvent = document.createEvent('Event');
    inputEvent.initEvent('input', true, true);

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
            <input type="checkbox" ref={n => (this.b = n)} checked={true} />
          </div>
        );
      }
    }

    var container = document.createElement('div');
    var instance = ReactDOM.render(<ControlledInputs />, container);

    // We need it to be in the body to test native event dispatching.
    document.body.appendChild(container);

    // Simulate a native keyup event
    setUntrackedValue(instance.a, 'giraffe');
    instance.a.dispatchEvent(inputEvent);

    // These should now both have been restored to their controlled value.

    expect(instance.a.value).toBe('lion');
    expect(instance.b.checked).toBe(true);

    document.body.removeChild(container);
  });

  describe('switching text inputs between numeric and string numbers', () => {
    it('does change the number 2 to "2.0" with no change handler', () => {
      var stub = <input type="text" value={2} onChange={jest.fn()} />;
      stub = ReactTestUtils.renderIntoDocument(stub);
      var node = ReactDOM.findDOMNode(stub);

      node.value = '2.0';

      ReactTestUtils.Simulate.change(stub);

      expect(node.getAttribute('value')).toBe('2');
      expect(node.value).toBe('2');
    });

    it('does change the string "2" to "2.0" with no change handler', () => {
      var stub = <input type="text" value={'2'} onChange={jest.fn()} />;
      stub = ReactTestUtils.renderIntoDocument(stub);
      var node = ReactDOM.findDOMNode(stub);

      node.value = '2.0';

      ReactTestUtils.Simulate.change(stub);

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

      var stub = ReactTestUtils.renderIntoDocument(<Stub />);
      var node = ReactDOM.findDOMNode(stub);

      node.value = '2.0';

      ReactTestUtils.Simulate.change(node);

      expect(node.getAttribute('value')).toBe('2.0');
      expect(node.value).toBe('2.0');
    });
  });

  it('should display `defaultValue` of number 0', () => {
    var stub = <input type="text" defaultValue={0} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.getAttribute('value')).toBe('0');
    expect(node.value).toBe('0');
  });

  it('only assigns defaultValue if it changes', () => {
    class Test extends React.Component {
      render() {
        return <input defaultValue="0" />;
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<Test />);
    var node = ReactDOM.findDOMNode(component);

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
    var stub = <input type="text" defaultValue={true} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('true');
  });

  it('should display "false" for `defaultValue` of `false`', () => {
    var stub = <input type="text" defaultValue={false} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('false');
  });

  it('should update `defaultValue` for uncontrolled input', () => {
    var container = document.createElement('div');

    var node = ReactDOM.render(
      <input type="text" defaultValue="0" />,
      container,
    );

    expect(node.value).toBe('0');

    ReactDOM.render(<input type="text" defaultValue="1" />, container);

    expect(node.value).toBe('0');
    expect(node.defaultValue).toBe('1');
  });

  it('should update `defaultValue` for uncontrolled date/time input', () => {
    var container = document.createElement('div');

    var node = ReactDOM.render(
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
    var container = document.createElement('div');

    var node = ReactDOM.render(
      <input type="text" value="0" readOnly="true" />,
      container,
    );

    expect(node.value).toBe('0');

    ReactDOM.render(<input type="text" defaultValue="1" />, container);

    expect(node.value).toBe('0');
  });

  it('should render defaultValue for SSR', () => {
    var markup = ReactDOMServer.renderToString(
      <input type="text" defaultValue="1" />,
    );
    var div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.getAttribute('value')).toBe('1');
    expect(div.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should render value for SSR', () => {
    var element = <input type="text" value="1" onChange={function() {}} />;
    var markup = ReactDOMServer.renderToString(element);
    var div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.getAttribute('value')).toBe('1');
    expect(div.firstChild.getAttribute('defaultValue')).toBe(null);
  });

  it('should render name attribute if it is supplied', () => {
    var container = document.createElement('div');
    var node = ReactDOM.render(<input type="text" name="name" />, container);
    expect(node.name).toBe('name');
    expect(container.firstChild.getAttribute('name')).toBe('name');
  });

  it('should render name attribute if it is supplied for SSR', () => {
    var element = <input type="text" name="name" />;
    var markup = ReactDOMServer.renderToString(element);
    var div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.getAttribute('name')).toBe('name');
  });

  it('should not render name attribute if it is not supplied', () => {
    var container = document.createElement('div');
    ReactDOM.render(<input type="text" />, container);
    expect(container.firstChild.getAttribute('name')).toBe(null);
  });

  it('should not render name attribute if it is not supplied for SSR', () => {
    var element = <input type="text" />;
    var markup = ReactDOMServer.renderToString(element);
    var div = document.createElement('div');
    div.innerHTML = markup;
    expect(div.firstChild.getAttribute('name')).toBe(null);
  });

  it('should display "foobar" for `defaultValue` of `objToString`', () => {
    var objToString = {
      toString: function() {
        return 'foobar';
      },
    };

    var stub = <input type="text" defaultValue={objToString} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('foobar');
  });

  it('should display `value` of number 0', () => {
    var stub = <input type="text" value={0} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('0');
  });

  it('should allow setting `value` to `true`', () => {
    var container = document.createElement('div');
    var stub = <input type="text" value="yolo" onChange={emptyFunction} />;
    var node = ReactDOM.render(stub, container);

    expect(node.value).toBe('yolo');

    stub = ReactDOM.render(
      <input type="text" value={true} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('true');
  });

  it('should allow setting `value` to `false`', () => {
    var container = document.createElement('div');
    var stub = <input type="text" value="yolo" onChange={emptyFunction} />;
    var node = ReactDOM.render(stub, container);

    expect(node.value).toBe('yolo');

    stub = ReactDOM.render(
      <input type="text" value={false} onChange={emptyFunction} />,
      container,
    );
    expect(node.value).toEqual('false');
  });

  it('should allow setting `value` to `objToString`', () => {
    var container = document.createElement('div');
    var stub = <input type="text" value="foo" onChange={emptyFunction} />;
    var node = ReactDOM.render(stub, container);

    expect(node.value).toBe('foo');

    var objToString = {
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
    var container = document.createElement('div');
    ReactDOM.render(<input value="a" />, container);

    var node = container.firstChild;
    var nodeValue = 'a';
    var nodeValueSetter = jest.genMockFn();
    Object.defineProperty(node, 'value', {
      get: function() {
        return nodeValue;
      },
      set: nodeValueSetter.mockImplementation(function(newValue) {
        nodeValue = newValue;
      }),
    });

    ReactDOM.render(<input value="a" />, container);
    expect(nodeValueSetter.mock.calls.length).toBe(0);

    ReactDOM.render(<input value="b" />, container);
    expect(nodeValueSetter.mock.calls.length).toBe(1);
  });

  it('should properly control a value of number `0`', () => {
    var stub = <input type="text" value={0} onChange={emptyFunction} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    node.value = 'giraffe';
    ReactTestUtils.Simulate.change(node);
    expect(node.value).toBe('0');
  });

  it('should properly control 0.0 for a text input', () => {
    var stub = <input type="text" value={0} onChange={emptyFunction} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    node.value = '0.0';
    ReactTestUtils.Simulate.change(node, {target: {value: '0.0'}});
    expect(node.value).toBe('0');
  });

  it('should properly control 0.0 for a number input', () => {
    var stub = <input type="number" value={0} onChange={emptyFunction} />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    node.value = '0.0';
    ReactTestUtils.Simulate.change(node, {target: {value: '0.0'}});
    expect(node.value).toBe('0.0');
  });

  it('should properly transition from an empty value to 0', function() {
    var container = document.createElement('div');

    ReactDOM.render(<input type="text" value="" />, container);
    ReactDOM.render(<input type="text" value={0} />, container);

    var node = container.firstChild;

    expect(node.value).toBe('0');
  });

  it('should properly transition from 0 to an empty value', function() {
    var container = document.createElement('div');

    ReactDOM.render(<input type="text" value={0} />, container);
    ReactDOM.render(<input type="text" value="" />, container);

    var node = container.firstChild;

    expect(node.value).toBe('');
  });

  it('should have the correct target value', () => {
    var handled = false;
    var handler = function(event) {
      expect(event.target.nodeName).toBe('INPUT');
      handled = true;
    };
    var stub = <input type="text" value={0} onChange={handler} />;
    var container = document.createElement('div');
    var node = ReactDOM.render(stub, container);

    node.value = 'giraffe';

    var fakeNativeEvent = function() {};
    fakeNativeEvent.target = node;
    fakeNativeEvent.path = [node, container];
    ReactTestUtils.simulateNativeEventOnNode('topInput', node, fakeNativeEvent);

    expect(handled).toBe(true);
  });

  it('should not set a value for submit buttons unnecessarily', () => {
    var stub = <input type="submit" />;
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

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

    var stub = ReactTestUtils.renderIntoDocument(<RadioGroup />);
    var aNode = ReactDOM.findDOMNode(stub.refs.a);
    var bNode = ReactDOM.findDOMNode(stub.refs.b);
    var cNode = ReactDOM.findDOMNode(stub.refs.c);

    expect(aNode.checked).toBe(true);
    expect(bNode.checked).toBe(false);
    // c is in a separate form and shouldn't be affected at all here
    expect(cNode.checked).toBe(true);

    bNode.checked = true;
    // This next line isn't necessary in a proper browser environment, but
    // jsdom doesn't uncheck the others in a group (which makes this whole test
    // a little less effective)
    aNode.checked = false;
    expect(cNode.checked).toBe(true);

    // Now let's run the actual ReactDOMInput change event handler
    ReactTestUtils.Simulate.change(bNode);

    // The original state should have been restored
    expect(aNode.checked).toBe(true);
    expect(cNode.checked).toBe(true);
  });

  it('should support ReactLink', () => {
    var link = new ReactLink('yolo', jest.fn());
    var instance = <input type="text" valueLink={link} />;

    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(ReactDOM.findDOMNode(instance).value).toBe('yolo');
    expect(link.value).toBe('yolo');
    expect(link.requestChange.mock.calls.length).toBe(0);

    ReactDOM.findDOMNode(instance).value = 'test';
    ReactTestUtils.Simulate.change(ReactDOM.findDOMNode(instance));

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual('test');
  });

  it('should warn with value and no onChange handler', () => {
    var link = new ReactLink('yolo', jest.fn());
    ReactTestUtils.renderIntoDocument(<input type="text" valueLink={link} />);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      '`valueLink` prop on `input` is deprecated; set `value` and `onChange` instead.',
    );

    ReactTestUtils.renderIntoDocument(
      <input type="text" value="zoink" onChange={jest.fn()} />,
    );
    expect(console.error.calls.count()).toBe(1);
    ReactTestUtils.renderIntoDocument(<input type="text" value="zoink" />);
    expect(console.error.calls.count()).toBe(2);
  });

  it('should warn with value and no onChange handler and readOnly specified', () => {
    ReactTestUtils.renderIntoDocument(
      <input type="text" value="zoink" readOnly={true} />,
    );
    expect(console.error.calls.count()).toBe(0);

    ReactTestUtils.renderIntoDocument(
      <input type="text" value="zoink" readOnly={false} />,
    );
    expect(console.error.calls.count()).toBe(1);
  });

  it('should have a this value of undefined if bind is not used', () => {
    var unboundInputOnChange = function() {
      expect(this).toBe(undefined);
    };

    var instance = <input type="text" onChange={unboundInputOnChange} />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    ReactTestUtils.Simulate.change(instance);
  });

  it('should throw if both value and valueLink are provided', () => {
    var node = document.createElement('div');
    var link = new ReactLink('yolo', jest.fn());
    var instance = <input type="text" valueLink={link} />;

    expect(() => ReactDOM.render(instance, node)).not.toThrow();

    instance = (
      <input
        type="text"
        valueLink={link}
        value="test"
        onChange={emptyFunction}
      />
    );
    expect(() => ReactDOM.render(instance, node)).toThrow();

    instance = <input type="text" valueLink={link} onChange={emptyFunction} />;
    expect(() => ReactDOM.render(instance, node)).toThrow();
  });

  it('should support checkedLink', () => {
    var link = new ReactLink(true, jest.fn());
    var instance = <input type="checkbox" checkedLink={link} />;

    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(ReactDOM.findDOMNode(instance).checked).toBe(true);
    expect(link.value).toBe(true);
    expect(link.requestChange.mock.calls.length).toBe(0);

    ReactDOM.findDOMNode(instance).checked = false;
    ReactTestUtils.Simulate.change(ReactDOM.findDOMNode(instance));

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual(false);
  });

  it('should warn with checked and no onChange handler', () => {
    var node = document.createElement('div');
    var link = new ReactLink(true, jest.fn());
    ReactDOM.render(<input type="checkbox" checkedLink={link} />, node);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      '`checkedLink` prop on `input` is deprecated; set `value` and `onChange` instead.',
    );

    ReactTestUtils.renderIntoDocument(
      <input type="checkbox" checked="false" onChange={jest.fn()} />,
    );
    expect(console.error.calls.count()).toBe(1);

    ReactTestUtils.renderIntoDocument(
      <input type="checkbox" checked="false" readOnly={true} />,
    );
    expect(console.error.calls.count()).toBe(1);

    ReactTestUtils.renderIntoDocument(
      <input type="checkbox" checked="false" />,
    );
    expect(console.error.calls.count()).toBe(2);
  });

  it('should warn with checked and no onChange handler with readOnly specified', () => {
    ReactTestUtils.renderIntoDocument(
      <input type="checkbox" checked="false" readOnly={true} />,
    );
    expect(console.error.calls.count()).toBe(0);

    ReactTestUtils.renderIntoDocument(
      <input type="checkbox" checked="false" readOnly={false} />,
    );
    expect(console.error.calls.count()).toBe(1);
  });

  it('should throw if both checked and checkedLink are provided', () => {
    var node = document.createElement('div');
    var link = new ReactLink(true, jest.fn());
    var instance = <input type="checkbox" checkedLink={link} />;

    expect(() => ReactDOM.render(instance, node)).not.toThrow();

    instance = (
      <input
        type="checkbox"
        checkedLink={link}
        checked="false"
        onChange={emptyFunction}
      />
    );
    expect(() => ReactDOM.render(instance, node)).toThrow();

    instance = (
      <input type="checkbox" checkedLink={link} onChange={emptyFunction} />
    );
    expect(() => ReactDOM.render(instance, node)).toThrow();
  });

  it('should update defaultValue to empty string', () => {
    var container = document.createElement('div');
    ReactDOM.render(<input type="text" defaultValue={'foo'} />, container);
    ReactDOM.render(<input type="text" defaultValue={''} />, container);
    expect(container.firstChild.defaultValue).toBe('');
  });

  it('should throw if both checkedLink and valueLink are provided', () => {
    var node = document.createElement('div');
    var link = new ReactLink(true, jest.fn());
    var instance = <input type="checkbox" checkedLink={link} />;

    expect(() => ReactDOM.render(instance, node)).not.toThrow();

    instance = <input type="checkbox" valueLink={link} />;
    expect(() => ReactDOM.render(instance, node)).not.toThrow();

    instance = (
      <input type="checkbox" checkedLink={link} valueLink={emptyFunction} />
    );
    expect(() => ReactDOM.render(instance, node)).toThrow();
  });

  it('should warn if value is null', () => {
    ReactTestUtils.renderIntoDocument(<input type="text" value={null} />);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      '`value` prop on `input` should not be null. ' +
        'Consider using the empty string to clear the component or `undefined` ' +
        'for uncontrolled components.',
    );

    ReactTestUtils.renderIntoDocument(<input type="text" value={null} />);
    expect(console.error.calls.count()).toBe(1);
  });

  it('should warn if checked and defaultChecked props are specified', () => {
    ReactTestUtils.renderIntoDocument(
      <input
        type="radio"
        checked={true}
        defaultChecked={true}
        readOnly={true}
      />,
    );
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component contains an input of type radio with both checked and defaultChecked props. ' +
        'Input elements must be either controlled or uncontrolled ' +
        '(specify either the checked prop, or the defaultChecked prop, but not ' +
        'both). Decide between using a controlled or uncontrolled input ' +
        'element and remove one of these props. More info: ' +
        'https://fb.me/react-controlled-components',
    );

    ReactTestUtils.renderIntoDocument(
      <input
        type="radio"
        checked={true}
        defaultChecked={true}
        readOnly={true}
      />,
    );
    expect(console.error.calls.count()).toBe(1);
  });

  it('should warn if value and defaultValue props are specified', () => {
    ReactTestUtils.renderIntoDocument(
      <input type="text" value="foo" defaultValue="bar" readOnly={true} />,
    );
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component contains an input of type text with both value and defaultValue props. ' +
        'Input elements must be either controlled or uncontrolled ' +
        '(specify either the value prop, or the defaultValue prop, but not ' +
        'both). Decide between using a controlled or uncontrolled input ' +
        'element and remove one of these props. More info: ' +
        'https://fb.me/react-controlled-components',
    );

    ReactTestUtils.renderIntoDocument(
      <input type="text" value="foo" defaultValue="bar" readOnly={true} />,
    );
    expect(console.error.calls.count()).toBe(1);
  });

  it('should warn if controlled input switches to uncontrolled (value is undefined)', () => {
    var stub = (
      <input type="text" value="controlled" onChange={emptyFunction} />
    );
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="text" />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing a controlled input of type text to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if controlled input switches to uncontrolled (value is null)', () => {
    var stub = (
      <input type="text" value="controlled" onChange={emptyFunction} />
    );
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="text" value={null} />, container);
    expect(console.error.calls.count()).toBeGreaterThan(0);
    expect(console.error.calls.argsFor(1)[0]).toContain(
      'A component is changing a controlled input of type text to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if controlled input switches to uncontrolled with defaultValue', () => {
    var stub = (
      <input type="text" value="controlled" onChange={emptyFunction} />
    );
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(
      <input type="text" defaultValue="uncontrolled" />,
      container,
    );
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing a controlled input of type text to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if uncontrolled input (value is undefined) switches to controlled', () => {
    var stub = <input type="text" />;
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="text" value="controlled" />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing an uncontrolled input of type text to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if uncontrolled input (value is null) switches to controlled', () => {
    var stub = <input type="text" value={null} />;
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="text" value="controlled" />, container);
    expect(console.error.calls.count()).toBeGreaterThan(0);
    expect(console.error.calls.argsFor(1)[0]).toContain(
      'A component is changing an uncontrolled input of type text to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if controlled checkbox switches to uncontrolled (checked is undefined)', () => {
    var stub = (
      <input type="checkbox" checked={true} onChange={emptyFunction} />
    );
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="checkbox" />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing a controlled input of type checkbox to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if controlled checkbox switches to uncontrolled (checked is null)', () => {
    var stub = (
      <input type="checkbox" checked={true} onChange={emptyFunction} />
    );
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="checkbox" checked={null} />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing a controlled input of type checkbox to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if controlled checkbox switches to uncontrolled with defaultChecked', () => {
    var stub = (
      <input type="checkbox" checked={true} onChange={emptyFunction} />
    );
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="checkbox" defaultChecked={true} />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing a controlled input of type checkbox to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if uncontrolled checkbox (checked is undefined) switches to controlled', () => {
    var stub = <input type="checkbox" />;
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="checkbox" checked={true} />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing an uncontrolled input of type checkbox to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if uncontrolled checkbox (checked is null) switches to controlled', () => {
    var stub = <input type="checkbox" checked={null} />;
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="checkbox" checked={true} />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing an uncontrolled input of type checkbox to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if controlled radio switches to uncontrolled (checked is undefined)', () => {
    var stub = <input type="radio" checked={true} onChange={emptyFunction} />;
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="radio" />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing a controlled input of type radio to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if controlled radio switches to uncontrolled (checked is null)', () => {
    var stub = <input type="radio" checked={true} onChange={emptyFunction} />;
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="radio" checked={null} />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing a controlled input of type radio to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if controlled radio switches to uncontrolled with defaultChecked', () => {
    var stub = <input type="radio" checked={true} onChange={emptyFunction} />;
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="radio" defaultChecked={true} />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing a controlled input of type radio to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if uncontrolled radio (checked is undefined) switches to controlled', () => {
    var stub = <input type="radio" />;
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="radio" checked={true} />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing an uncontrolled input of type radio to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should warn if uncontrolled radio (checked is null) switches to controlled', () => {
    var stub = <input type="radio" checked={null} />;
    var container = document.createElement('div');
    ReactDOM.render(stub, container);
    ReactDOM.render(<input type="radio" checked={true} />, container);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing an uncontrolled input of type radio to be controlled. ' +
        'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('should not warn if radio value changes but never becomes controlled', () => {
    var container = document.createElement('div');
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
    expect(console.error.calls.count()).toBe(0);
  });

  it('should not warn if radio value changes but never becomes uncontrolled', () => {
    var container = document.createElement('div');
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
    expect(console.error.calls.count()).toBe(0);
  });

  it('should warn if radio checked false changes to become uncontrolled', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <input
        type="radio"
        value="value"
        checked={false}
        onChange={() => null}
      />,
      container,
    );
    ReactDOM.render(<input type="radio" value="value" />, container);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'A component is changing a controlled input of type radio to be uncontrolled. ' +
        'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
        'Decide between using a controlled or uncontrolled input ' +
        'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
    );
  });

  it('sets type, step, min, max before value always', () => {
    if (!ReactDOMFeatureFlags.useCreateElement) {
      return;
    }
    var log = [];
    var originalCreateElement = document.createElement;
    spyOn(document, 'createElement').and.callFake(function(type) {
      var el = originalCreateElement.apply(this, arguments);
      if (type === 'input') {
        Object.defineProperty(el, 'value', {
          get: function() {},
          set: function() {
            log.push('set value');
          },
        });
        spyOn(el, 'setAttribute').and.callFake(function(name, value) {
          log.push('set ' + name);
        });
      }
      return el;
    });

    ReactTestUtils.renderIntoDocument(
      <input value="0" type="range" min="0" max="100" step="1" />,
    );
    expect(log).toEqual([
      'set data-reactroot',
      'set type',
      'set step',
      'set min',
      'set max',
      'set value',
      'set value',
      'set checked',
      'set checked',
    ]);
  });

  it('sets value properly with type coming later in props', () => {
    var input = ReactTestUtils.renderIntoDocument(
      <input value="hi" type="radio" />,
    );
    expect(input.value).toBe('hi');
  });

  it('does not raise a validation warning when it switches types', () => {
    class Input extends React.Component {
      state = {type: 'number', value: 1000};

      render() {
        var {value, type} = this.state;
        return <input onChange={() => {}} type={type} value={value} />;
      }
    }

    var input = ReactTestUtils.renderIntoDocument(<Input />);
    var node = ReactDOM.findDOMNode(input);

    // If the value is set before the type, a validation warning will raise and
    // the value will not be assigned.
    input.setState({type: 'text', value: 'Test'});
    expect(node.value).toEqual('Test');
  });

  it('resets value of date/time input to fix bugs in iOS Safari', () => {
    // https://github.com/facebook/react/issues/7233
    if (!ReactDOMFeatureFlags.useCreateElement) {
      return;
    }

    function strify(x) {
      return JSON.stringify(x, null, 2);
    }

    var log = [];
    var originalCreateElement = document.createElement;
    spyOn(document, 'createElement').and.callFake(function(type) {
      var el = originalCreateElement.apply(this, arguments);
      if (type === 'input') {
        Object.defineProperty(el, 'value', {
          set: function(val) {
            log.push(`node.value = ${strify(val)}`);
          },
        });
        spyOn(el, 'setAttribute').and.callFake(function(name, val) {
          log.push(`node.setAttribute(${strify(name)}, ${strify(val)})`);
        });
      }
      return el;
    });

    ReactTestUtils.renderIntoDocument(
      <input type="date" defaultValue="1980-01-01" />,
    );
    expect(log).toEqual([
      'node.setAttribute("data-reactroot", "")',
      'node.setAttribute("type", "date")',
      'node.setAttribute("value", "1980-01-01")',
      'node.value = ""',
      'node.value = ""',
      'node.setAttribute("checked", "")',
      'node.setAttribute("checked", "")',
    ]);
  });

  describe('assigning the value attribute on controlled inputs', function() {
    function getTestInput() {
      return React.createClass({
        getInitialState: function() {
          return {
            value: this.props.value == null ? '' : this.props.value,
          };
        },
        onChange: function(event) {
          this.setState({value: event.target.value});
        },
        render: function() {
          var type = this.props.type;
          var value = this.state.value;

          return <input type={type} value={value} onChange={this.onChange} />;
        },
      });
    }

    it('always sets the attribute when values change on text inputs', function() {
      var Input = getTestInput();
      var stub = ReactTestUtils.renderIntoDocument(<Input type="text" />);
      var node = ReactDOM.findDOMNode(stub);

      ReactTestUtils.Simulate.change(node, {target: {value: '2'}});

      expect(node.getAttribute('value')).toBe('2');
    });

    it('does not set the value attribute on number inputs if focused', () => {
      var Input = getTestInput();
      var stub = ReactTestUtils.renderIntoDocument(
        <Input type="number" value="1" />,
      );
      var node = ReactDOM.findDOMNode(stub);

      node.focus();

      ReactTestUtils.Simulate.change(node, {target: {value: '2'}});

      expect(node.getAttribute('value')).toBe('1');
    });

    it('sets the value attribute on number inputs on blur', () => {
      var Input = getTestInput();
      var stub = ReactTestUtils.renderIntoDocument(
        <Input type="number" value="1" />,
      );
      var node = ReactDOM.findDOMNode(stub);

      ReactTestUtils.Simulate.change(node, {target: {value: '2'}});
      ReactTestUtils.SimulateNative.blur(node);

      expect(node.getAttribute('value')).toBe('2');
    });

    it('an uncontrolled number input will not update the value attribute on blur', () => {
      var stub = ReactTestUtils.renderIntoDocument(
        <input type="number" defaultValue="1" />,
      );
      var node = ReactDOM.findDOMNode(stub);

      node.value = 4;

      ReactTestUtils.SimulateNative.blur(node);

      expect(node.getAttribute('value')).toBe('1');
    });

    it('an uncontrolled text input will not update the value attribute on blur', () => {
      var stub = ReactTestUtils.renderIntoDocument(
        <input type="text" defaultValue="1" />,
      );
      var node = ReactDOM.findDOMNode(stub);

      node.value = 4;

      ReactTestUtils.SimulateNative.blur(node);

      expect(node.getAttribute('value')).toBe('1');
    });
  });
});

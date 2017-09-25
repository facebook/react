/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMSelect', () => {
  var React;
  var ReactDOM;
  var ReactDOMServer;
  var ReactLink;
  var ReactTestUtils;

  var noop = function() {};

  beforeEach(() => {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMServer = require('ReactDOMServer');
    ReactLink = require('ReactLink');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should allow setting `defaultValue`', () => {
    var stub = (
      <select defaultValue="giraffe">
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var options = stub.props.children;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('giraffe');

    // Changing `defaultValue` should do nothing.
    ReactDOM.render(
      <select defaultValue="gorilla">{options}</select>,
      container,
    );
    expect(node.value).toEqual('giraffe');
  });

  it('should not throw with `defaultValue` and without children', () => {
    var stub = <select defaultValue="dummy" />;

    expect(() => {
      ReactTestUtils.renderIntoDocument(stub);
    }).not.toThrow();
  });

  it('should not control when using `defaultValue`', () => {
    var el = (
      <select defaultValue="giraffe">
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var container = document.createElement('div');
    var stub = ReactDOM.render(el, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('giraffe');

    node.value = 'monkey';
    ReactDOM.render(el, container);
    // Uncontrolled selects shouldn't change the value after first mounting
    expect(node.value).toEqual('monkey');
  });

  it('should allow setting `defaultValue` with multiple', () => {
    var stub = (
      <select multiple={true} defaultValue={['giraffe', 'gorilla']}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var options = stub.props.children;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(true); // gorilla

    // Changing `defaultValue` should do nothing.
    ReactDOM.render(
      <select multiple={true} defaultValue={['monkey']}>{options}</select>,
      container,
    );

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(true); // gorilla
  });

  it('should allow setting `value`', () => {
    var stub = (
      <select value="giraffe" onChange={noop}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var options = stub.props.children;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.value).toBe('giraffe');

    // Changing the `value` prop should change the selected option.
    ReactDOM.render(
      <select value="gorilla" onChange={noop}>{options}</select>,
      container,
    );
    expect(node.value).toEqual('gorilla');
  });

  it('should not throw with `value` and without children', () => {
    var stub = <select value="dummy" onChange={noop} />;

    expect(() => {
      ReactTestUtils.renderIntoDocument(stub);
    }).not.toThrow();
  });

  it('should allow setting `value` with multiple', () => {
    var stub = (
      <select multiple={true} value={['giraffe', 'gorilla']} onChange={noop}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var options = stub.props.children;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(true); // gorilla

    // Changing the `value` prop should change the selected options.
    ReactDOM.render(
      <select multiple={true} value={['monkey']} onChange={noop}>
        {options}
      </select>,
      container,
    );

    expect(node.options[0].selected).toBe(true); // monkey
    expect(node.options[1].selected).toBe(false); // giraffe
    expect(node.options[2].selected).toBe(false); // gorilla
  });

  it('should not select other options automatically', () => {
    var stub = (
      <select multiple={true} value={['12']} onChange={noop}>
        <option value="1">one</option>
        <option value="2">two</option>
        <option value="12">twelve</option>
      </select>
    );
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.options[0].selected).toBe(false); // one
    expect(node.options[1].selected).toBe(false); // two
    expect(node.options[2].selected).toBe(true); // twelve
  });

  it('should reset child options selected when they are changed and `value` is set', () => {
    var stub = <select multiple={true} value={['a', 'b']} onChange={noop} />;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);

    ReactDOM.render(
      <select multiple={true} value={['a', 'b']} onChange={noop}>
        <option value="a">a</option>
        <option value="b">b</option>
        <option value="c">c</option>
      </select>,
      container,
    );

    var node = ReactDOM.findDOMNode(stub);

    expect(node.options[0].selected).toBe(true); // a
    expect(node.options[1].selected).toBe(true); // b
    expect(node.options[2].selected).toBe(false); // c
  });

  it('should allow setting `value` with `objectToString`', () => {
    var objectToString = {
      animal: 'giraffe',
      toString: function() {
        return this.animal;
      },
    };

    var el = (
      <select multiple={true} value={[objectToString]} onChange={noop}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var container = document.createElement('div');
    var stub = ReactDOM.render(el, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(false); // gorilla

    // Changing the `value` prop should change the selected options.
    objectToString.animal = 'monkey';

    var el2 = (
      <select multiple={true} value={[objectToString]}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    ReactDOM.render(el2, container);

    expect(node.options[0].selected).toBe(true); // monkey
    expect(node.options[1].selected).toBe(false); // giraffe
    expect(node.options[2].selected).toBe(false); // gorilla
  });

  it('should allow switching to multiple', () => {
    var stub = (
      <select defaultValue="giraffe">
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var options = stub.props.children;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(false); // gorilla

    // When making it multiple, giraffe and gorilla should be selected
    ReactDOM.render(
      <select multiple={true} defaultValue={['giraffe', 'gorilla']}>
        {options}
      </select>,
      container,
    );

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(true); // gorilla
  });

  it('should allow switching from multiple', () => {
    var stub = (
      <select multiple={true} defaultValue={['giraffe', 'gorilla']}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var options = stub.props.children;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(true); // gorilla

    // When removing multiple, defaultValue is applied again, being omitted
    // means that "monkey" will be selected
    ReactDOM.render(
      <select defaultValue="gorilla">{options}</select>,
      container,
    );

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(false); // giraffe
    expect(node.options[2].selected).toBe(true); // gorilla
  });

  it('should remember value when switching to uncontrolled', () => {
    var stub = (
      <select value={'giraffe'} onChange={noop}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var options = stub.props.children;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(false); // gorilla

    ReactDOM.render(<select>{options}</select>, container);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(false); // gorilla
  });

  it('should remember updated value when switching to uncontrolled', () => {
    var stub = (
      <select value={'giraffe'} onChange={noop}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var options = stub.props.children;
    var container = document.createElement('div');
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    ReactDOM.render(
      <select value="gorilla" onChange={noop}>{options}</select>,
      container,
    );

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(false); // giraffe
    expect(node.options[2].selected).toBe(true); // gorilla

    ReactDOM.render(<select>{options}</select>, container);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(false); // giraffe
    expect(node.options[2].selected).toBe(true); // gorilla
  });

  it('should support ReactLink', () => {
    var link = new ReactLink('giraffe', jest.fn());
    var stub = (
      <select valueLink={link}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );

    spyOn(console, 'error');

    stub = ReactTestUtils.renderIntoDocument(stub);

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      '`valueLink` prop on `select` is deprecated; set `value` and `onChange` instead.',
    );

    var node = ReactDOM.findDOMNode(stub);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(false); // gorilla
    expect(link.requestChange.mock.calls.length).toBe(0);

    node.options[1].selected = false;
    node.options[2].selected = true;
    ReactTestUtils.Simulate.change(node);

    expect(link.requestChange.mock.calls.length).toBe(1);
    expect(link.requestChange.mock.calls[0][0]).toEqual('gorilla');
  });

  it('should support server-side rendering', () => {
    var stub = (
      <select value="giraffe" onChange={noop}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var markup = ReactDOMServer.renderToString(stub);
    expect(markup).toContain('<option selected="" value="giraffe"');
    expect(markup).not.toContain('<option selected="" value="monkey"');
    expect(markup).not.toContain('<option selected="" value="gorilla"');
  });

  it('should support server-side rendering with defaultValue', () => {
    var stub = (
      <select defaultValue="giraffe">
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var markup = ReactDOMServer.renderToString(stub);
    expect(markup).toContain('<option selected="" value="giraffe"');
    expect(markup).not.toContain('<option selected="" value="monkey"');
    expect(markup).not.toContain('<option selected="" value="gorilla"');
  });

  it('should support server-side rendering with multiple', () => {
    var stub = (
      <select multiple={true} value={['giraffe', 'gorilla']} onChange={noop}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    var markup = ReactDOMServer.renderToString(stub);
    expect(markup).toContain('<option selected="" value="giraffe"');
    expect(markup).toContain('<option selected="" value="gorilla"');
    expect(markup).not.toContain('<option selected="" value="monkey"');
  });

  it('should not control defaultValue if readding options', () => {
    var container = document.createElement('div');

    var select = ReactDOM.render(
      <select multiple={true} defaultValue={['giraffe']}>
        <option key="monkey" value="monkey">A monkey!</option>
        <option key="giraffe" value="giraffe">A giraffe!</option>
        <option key="gorilla" value="gorilla">A gorilla!</option>
      </select>,
      container,
    );
    var node = ReactDOM.findDOMNode(select);

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(true); // giraffe
    expect(node.options[2].selected).toBe(false); // gorilla

    ReactDOM.render(
      <select multiple={true} defaultValue={['giraffe']}>
        <option key="monkey" value="monkey">A monkey!</option>
        <option key="gorilla" value="gorilla">A gorilla!</option>
      </select>,
      container,
    );

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(false); // gorilla

    ReactDOM.render(
      <select multiple={true} defaultValue={['giraffe']}>
        <option key="monkey" value="monkey">A monkey!</option>
        <option key="giraffe" value="giraffe">A giraffe!</option>
        <option key="gorilla" value="gorilla">A gorilla!</option>
      </select>,
      container,
    );

    expect(node.options[0].selected).toBe(false); // monkey
    expect(node.options[1].selected).toBe(false); // giraffe
    expect(node.options[2].selected).toBe(false); // gorilla
  });

  it('should warn if value is null', () => {
    spyOn(console, 'error');

    ReactTestUtils.renderIntoDocument(
      <select value={null}><option value="test" /></select>,
    );
    expect(console.error.calls.argsFor(0)[0]).toContain(
      '`value` prop on `select` should not be null. ' +
        'Consider using the empty string to clear the component or `undefined` ' +
        'for uncontrolled components.',
    );

    ReactTestUtils.renderIntoDocument(
      <select value={null}><option value="test" /></select>,
    );
    expect(console.error.calls.count()).toBe(1);
  });

  it('should refresh state on change', () => {
    var stub = (
      <select value="giraffe" onChange={noop}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    stub = ReactTestUtils.renderIntoDocument(stub);
    var node = ReactDOM.findDOMNode(stub);

    ReactTestUtils.Simulate.change(node);

    expect(node.value).toBe('giraffe');
  });

  it('should warn if value and defaultValue props are specified', () => {
    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(
      <select value="giraffe" defaultValue="giraffe" readOnly={true}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>,
    );
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Select elements must be either controlled or uncontrolled ' +
        '(specify either the value prop, or the defaultValue prop, but not ' +
        'both). Decide between using a controlled or uncontrolled select ' +
        'element and remove one of these props. More info: ' +
        'https://fb.me/react-controlled-components',
    );

    ReactTestUtils.renderIntoDocument(
      <select value="giraffe" defaultValue="giraffe" readOnly={true}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>,
    );
    expect(console.error.calls.count()).toBe(1);
  });

  it('should be able to safely remove select onChange', () => {
    function changeView() {
      ReactDOM.unmountComponentAtNode(container);
    }

    var container = document.createElement('div');
    var stub = (
      <select value="giraffe" onChange={changeView}>
        <option value="monkey">A monkey!</option>
        <option value="giraffe">A giraffe!</option>
        <option value="gorilla">A gorilla!</option>
      </select>
    );
    stub = ReactDOM.render(stub, container);
    var node = ReactDOM.findDOMNode(stub);

    expect(() => ReactTestUtils.Simulate.change(node)).not.toThrow(
      "Cannot set property 'pendingUpdate' of null",
    );
  });

  it('should select grandchild options nested inside an optgroup', () => {
    var stub = (
      <select value="b" onChange={noop}>
        <optgroup label="group">
          <option value="a">a</option>
          <option value="b">b</option>
          <option value="c">c</option>
        </optgroup>
      </select>
    );
    var container = document.createElement('div');
    var node = ReactDOM.render(stub, container);

    expect(node.options[0].selected).toBe(false); // a
    expect(node.options[1].selected).toBe(true); // b
    expect(node.options[2].selected).toBe(false); // c
  });
});

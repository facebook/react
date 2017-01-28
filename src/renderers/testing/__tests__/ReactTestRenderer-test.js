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

var React = require('React');
var ReactTestRenderer = require('ReactTestRenderer');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var ReactFeatureFlags;

describe('ReactTestRenderer', () => {
  beforeEach(() => {
    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.disableNewFiberFeatures = false;
  });

  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  it('renders a simple component', () => {
    function Link() {
      return <a role="link" />;
    }
    var renderer = ReactTestRenderer.create(<Link />);
    expect(renderer.toJSON()).toEqual({
      type: 'a',
      props: { role: 'link' },
      children: null,
    });
  });

  it('renders a top-level empty component', () => {
    function Empty() {
      return null;
    }
    var renderer = ReactTestRenderer.create(<Empty />);
    expect(renderer.toJSON()).toEqual(null);
  });

  it('exposes a type flag', () => {
    function Link() {
      return <a role="link" />;
    }
    var renderer = ReactTestRenderer.create(<Link />);
    var object = renderer.toJSON();
    expect(object.$$typeof).toBe(Symbol.for('react.test.json'));

    // $$typeof should not be enumerable.
    for (var key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        expect(key).not.toBe('$$typeof');
      }
    }
  });

  it('can render a composite component', () => {
    class Component extends React.Component {
      render() {
        return (
          <div className="purple">
            <Child />
          </div>
        );
      }
    }

    var Child = () => {
      return <moo />;
    };

    var renderer = ReactTestRenderer.create(<Component />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: { className: 'purple' },
      children: [
        { type: 'moo', props: {}, children: null },
      ],
    });
  });

  it('renders some basics with an update', () => {
    var renders = 0;

    class Component extends React.Component {
      state = {x: 3};

      render() {
        renders++;
        return (
          <div className="purple">
            {this.state.x}
            <Child />
            <Null />
          </div>
        );
      }

      componentDidMount() {
        this.setState({x: 7});
      }
    }

    var Child = () => {
      renders++;
      return <moo />;
    };

    var Null = () => {
      renders++;
      return null;
    };

    var renderer = ReactTestRenderer.create(<Component />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: { className: 'purple' },
      children: [
        ReactDOMFeatureFlags.useFiber ? '7' : 7,
        { type: 'moo', props: {}, children: null },
      ],
    });
    expect(renders).toBe(6);
  });

  it('exposes the instance', () => {
    class Mouse extends React.Component {
      constructor() {
        super();
        this.state = {mouse: 'mouse'};
      }
      handleMoose() {
        this.setState({mouse: 'moose'});
      }
      render() {
        return <div>{this.state.mouse}</div>;
      }
    }
    var renderer = ReactTestRenderer.create(<Mouse />);

    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['mouse'],
    });

    var mouse = renderer.getInstance();
    mouse.handleMoose();
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      children: ['moose'],
      props: {},
    });
  });

  it('updates types', () => {
    var renderer = ReactTestRenderer.create(<div>mouse</div>);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['mouse'],
    });

    renderer.update(<span>mice</span>);
    expect(renderer.toJSON()).toEqual({
      type: 'span',
      props: {},
      children: ['mice'],
    });
  });

  it('updates children', () => {
    var renderer = ReactTestRenderer.create(
      <div>
        <span key="a">A</span>
        <span key="b">B</span>
        <span key="c">C</span>
      </div>
    );
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: [
        {type: 'span', props: {}, children: ['A']},
        {type: 'span', props: {}, children: ['B']},
        {type: 'span', props: {}, children: ['C']},
      ],
    });

    renderer.update(
      <div>
        <span key="d">D</span>
        <span key="c">C</span>
        <span key="b">B</span>
      </div>
    );
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: [
        {type: 'span', props: {}, children: ['D']},
        {type: 'span', props: {}, children: ['C']},
        {type: 'span', props: {}, children: ['B']},
      ],
    });
  });

  it('does the full lifecycle', () => {
    var log = [];
    class Log extends React.Component {
      render() {
        log.push('render ' + this.props.name);
        return <div />;
      }
      componentDidMount() {
        log.push('mount ' + this.props.name);
      }
      componentWillUnmount() {
        log.push('unmount ' + this.props.name);
      }
    }

    var renderer = ReactTestRenderer.create(<Log key="foo" name="Foo" />);
    renderer.update(<Log key="bar" name="Bar" />);
    renderer.unmount();

    expect(log).toEqual([
      'render Foo',
      'mount Foo',
      'render Bar',
      'unmount Foo',
      'mount Bar',
      'unmount Bar',
    ]);
  });

  it('gives a ref to native components', () => {
    var log = [];
    ReactTestRenderer.create(<div ref={(r) => log.push(r)} />);
    expect(log).toEqual([null]);
  });

  it('warns correctly for refs on SFCs', () => {
    spyOn(console, 'error');
    function Bar() {
      return <div>Hello, world</div>;
    }
    class Foo extends React.Component {
      render() {
        return <Bar ref="foo" />;
      }
    }
    class Baz extends React.Component {
      render() {
        return <div ref="baz" />;
      }
    }
    ReactTestRenderer.create(<Baz />);
    ReactTestRenderer.create(<Foo />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Stateless function components cannot be given refs. Attempts ' +
      'to access this ref will fail.\n\nCheck the render method of `Foo`.\n' +
      '    in Bar (at **)\n' +
      '    in Foo (at **)'
    );
  });

  it('allows an optional createNodeMock function', () => {
    var mockDivInstance = { appendChild: () => {} };
    var mockInputInstance = { focus: () => {} };
    var mockListItemInstance = { click: () => {} };
    var mockAnchorInstance = { hover: () => {} };
    var log = [];
    class Foo extends React.Component {
      componentDidMount() {
        log.push(this.refs.bar);
      }
      render() {
        return (
          <a ref="bar">Hello, world</a>
        );
      }
    }
    function createNodeMock(element) {
      switch (element.type) {
        case 'div':
          return mockDivInstance;
        case 'input':
          return mockInputInstance;
        case 'li':
          return mockListItemInstance;
        case 'a':
          return mockAnchorInstance;
        default:
          return {};
      }
    }
    ReactTestRenderer.create(
      <div ref={(r) => log.push(r)} />,
      {createNodeMock}
    );
    ReactTestRenderer.create(
      <input ref={(r) => log.push(r)} />,
      {createNodeMock},
    );
    ReactTestRenderer.create(
      <div>
        <span>
          <ul>
            <li ref={(r) => log.push(r)} />
          </ul>
          <ul>
            <li ref={(r) => log.push(r)} />
            <li ref={(r) => log.push(r)} />
          </ul>
        </span>
      </div>,
      {createNodeMock, foobar: true},
    );
    ReactTestRenderer.create(
      <Foo />,
      {createNodeMock},
    );
    ReactTestRenderer.create(
      <div ref={(r) => log.push(r)} />,
    );
    ReactTestRenderer.create(
      <div ref={(r) => log.push(r)} />,
      {}
    );
    expect(log).toEqual([
      mockDivInstance,
      mockInputInstance,
      mockListItemInstance,
      mockListItemInstance,
      mockListItemInstance,
      mockAnchorInstance,
      null,
      null,
    ]);
  });

  it('supports unmounting when using refs', () => {
    class Foo extends React.Component {
      render() {
        return <div ref="foo" />;
      }
    }
    const inst = ReactTestRenderer.create(
      <Foo />,
      {createNodeMock: () => 'foo'}
    );
    expect(() => inst.unmount()).not.toThrow();
  });

  it('supports unmounting inner instances', () => {
    let count = 0;
    class Foo extends React.Component {
      componentWillUnmount() {
        count++;
      }
      render() {
        return <div />;
      }
    }
    const inst = ReactTestRenderer.create(
      <div><Foo /></div>,
      {createNodeMock: () => 'foo'}
    );
    expect(() => inst.unmount()).not.toThrow();
    expect(count).toEqual(1);
  });

  it('supports updates when using refs', () => {
    const log = [];
    const createNodeMock = element => {
      log.push(element.type);
      return element.type;
    };
    class Foo extends React.Component {
      render() {
        return this.props.useDiv
          ? <div ref="foo" />
          : <span ref="foo" />;
      }
    }
    const inst = ReactTestRenderer.create(
      <Foo useDiv={true} />,
      {createNodeMock}
    );
    inst.update(<Foo useDiv={false} />);
    expect(log).toEqual(['div', 'span']);
  });

  it('supports error boundaries', () => {
    var log = [];
    class Angry extends React.Component {
      render() {
        log.push('Angry render');
        throw new Error('Please, do not render me.');
      }
      componentDidMount() {
        log.push('Angry componentDidMount');
      }
      componentWillUnmount() {
        log.push('Angry componentWillUnmount');
      }
    }

    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
      }
      render() {
        log.push('Boundary render');
        if (!this.state.error) {
          return (
            <div><button onClick={this.onClick}>ClickMe</button><Angry /></div>
          );
        } else {
          return <div>Happy Birthday!</div>;
        }
      }
      componentDidMount() {
        log.push('Boundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('Boundary componentWillUnmount');
      }
      onClick() {
        /* do nothing */
      }
      unstable_handleError() {
        this.setState({error: true});
      }
    }

    var renderer = ReactTestRenderer.create(<Boundary />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['Happy Birthday!'],
    });
    if (ReactDOMFeatureFlags.useFiber) {
      expect(log).toEqual([
        'Boundary render',
        'Angry render',
        'Boundary componentDidMount',
        'Boundary render',
      ]);
    } else {
      expect(log).toEqual([
        'Boundary render',
        'Angry render',
        'Boundary render',
        'Boundary componentDidMount',
      ]);
    }
  });

  it('can update text nodes', () => {
    class Component extends React.Component {
      render() {
        return (
          <div>
            {this.props.children}
          </div>
        );
      }
    }

    var renderer = ReactTestRenderer.create(<Component>Hi</Component>);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      children: ['Hi'],
      props: {},
    });
    renderer.update(<Component>{['Hi', 'Bye']}</Component>);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      children: ['Hi', 'Bye'],
      props: {},
    });
    renderer.update(<Component>Bye</Component>);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      children: ['Bye'],
      props: {},
    });
    renderer.update(<Component>{42}</Component>);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      children: [
        ReactDOMFeatureFlags.useFiber ? '42' : 42,
      ],
      props: {},
    });
    renderer.update(<Component><div /></Component>);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      children: [{
        type: 'div',
        children: null,
        props: {},
      }],
      props: {},
    });
  });

  if (ReactDOMFeatureFlags.useFiber) {
    it('can update text nodes when rendered as root', () => {
      var renderer = ReactTestRenderer.create(['Hello', 'world']);
      expect(renderer.toJSON()).toEqual(['Hello', 'world']);
      renderer.update(42);
      expect(renderer.toJSON()).toEqual('42');
      renderer.update([42, 'world']);
      expect(renderer.toJSON()).toEqual(['42', 'world']);
    });

    it('can render and update root fragments', () => {
      var Component = (props) => props.children;

      var renderer = ReactTestRenderer.create([
        <Component>Hi</Component>,
        <Component>Bye</Component>,
      ]);
      expect(renderer.toJSON()).toEqual(['Hi', 'Bye']);
      renderer.update(<div />);
      expect(renderer.toJSON()).toEqual({
        type: 'div',
        children: null,
        props: {},
      });
      renderer.update([<div>goodbye</div>, 'world']);
      expect(renderer.toJSON()).toEqual([
        {
          type: 'div',
          children: [
            'goodbye',
          ],
          props: {},
        },
        'world',
      ]);
    });
  }
});

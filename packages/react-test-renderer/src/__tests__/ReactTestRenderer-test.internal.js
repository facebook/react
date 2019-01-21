/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

const ReactFeatureFlags = require('shared/ReactFeatureFlags');
ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
const React = require('react');
const ReactTestRenderer = require('react-test-renderer');
const prettyFormat = require('pretty-format');

// Isolate noop renderer
jest.resetModules();
const ReactNoop = require('react-noop-renderer');

// Kind of hacky, but we nullify all the instances to test the tree structure
// with jasmine's deep equality function, and test the instances separate. We
// also delete children props because testing them is more annoying and not
// really important to verify.
function cleanNodeOrArray(node) {
  if (!node) {
    return;
  }
  if (Array.isArray(node)) {
    node.forEach(cleanNodeOrArray);
    return;
  }
  if (node && node.instance) {
    node.instance = null;
  }
  if (node && node.props && node.props.children) {
    // eslint-disable-next-line no-unused-vars
    const {children, ...props} = node.props;
    node.props = props;
  }
  if (Array.isArray(node.rendered)) {
    node.rendered.forEach(cleanNodeOrArray);
  } else if (typeof node.rendered === 'object') {
    cleanNodeOrArray(node.rendered);
  }
}

describe('ReactTestRenderer', () => {
  it('renders a simple component', () => {
    function Link() {
      return <a role="link" />;
    }
    const renderer = ReactTestRenderer.create(<Link />);
    expect(renderer.toJSON()).toEqual({
      type: 'a',
      props: {role: 'link'},
      children: null,
    });
  });

  it('renders a top-level empty component', () => {
    function Empty() {
      return null;
    }
    const renderer = ReactTestRenderer.create(<Empty />);
    expect(renderer.toJSON()).toEqual(null);
  });

  it('exposes a type flag', () => {
    function Link() {
      return <a role="link" />;
    }
    const renderer = ReactTestRenderer.create(<Link />);
    const object = renderer.toJSON();
    expect(object.$$typeof).toBe(Symbol.for('react.test.json'));

    // $$typeof should not be enumerable.
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
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

    const Child = () => {
      return <moo />;
    };

    const renderer = ReactTestRenderer.create(<Component />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {className: 'purple'},
      children: [{type: 'moo', props: {}, children: null}],
    });
  });

  it('renders some basics with an update', () => {
    let renders = 0;

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

    const Child = () => {
      renders++;
      return <moo />;
    };

    const Null = () => {
      renders++;
      return null;
    };

    const renderer = ReactTestRenderer.create(<Component />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {className: 'purple'},
      children: ['7', {type: 'moo', props: {}, children: null}],
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
    const renderer = ReactTestRenderer.create(<Mouse />);

    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['mouse'],
    });

    const mouse = renderer.getInstance();
    mouse.handleMoose();
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      children: ['moose'],
      props: {},
    });
  });

  it('updates types', () => {
    const renderer = ReactTestRenderer.create(<div>mouse</div>);
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
    const renderer = ReactTestRenderer.create(
      <div>
        <span key="a">A</span>
        <span key="b">B</span>
        <span key="c">C</span>
      </div>,
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
      </div>,
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
    const log = [];
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

    const renderer = ReactTestRenderer.create(<Log key="foo" name="Foo" />);
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
    const log = [];
    ReactTestRenderer.create(<div ref={r => log.push(r)} />);
    expect(log).toEqual([null]);
  });

  it('warns correctly for refs on SFCs', () => {
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
    expect(() => ReactTestRenderer.create(<Foo />)).toWarnDev(
      'Warning: Function components cannot be given refs. Attempts ' +
        'to access this ref will fail. ' +
        'Did you mean to use React.forwardRef()?\n\n' +
        'Check the render method of `Foo`.\n' +
        '    in Bar (at **)\n' +
        '    in Foo (at **)',
    );
  });

  it('allows an optional createNodeMock function', () => {
    const mockDivInstance = {appendChild: () => {}};
    const mockInputInstance = {focus: () => {}};
    const mockListItemInstance = {click: () => {}};
    const mockAnchorInstance = {hover: () => {}};
    const log = [];
    class Foo extends React.Component {
      componentDidMount() {
        log.push(this.refs.bar);
      }
      render() {
        return <a ref="bar">Hello, world</a>;
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
    ReactTestRenderer.create(<div ref={r => log.push(r)} />, {createNodeMock});
    ReactTestRenderer.create(<input ref={r => log.push(r)} />, {
      createNodeMock,
    });
    ReactTestRenderer.create(
      <div>
        <span>
          <ul>
            <li ref={r => log.push(r)} />
          </ul>
          <ul>
            <li ref={r => log.push(r)} />
            <li ref={r => log.push(r)} />
          </ul>
        </span>
      </div>,
      {createNodeMock, foobar: true},
    );
    ReactTestRenderer.create(<Foo />, {createNodeMock});
    ReactTestRenderer.create(<div ref={r => log.push(r)} />);
    ReactTestRenderer.create(<div ref={r => log.push(r)} />, {});
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
    const inst = ReactTestRenderer.create(<Foo />, {
      createNodeMock: () => 'foo',
    });
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
      <div>
        <Foo />
      </div>,
      {
        createNodeMock: () => 'foo',
      },
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
        return this.props.useDiv ? <div ref="foo" /> : <span ref="foo" />;
      }
    }
    const inst = ReactTestRenderer.create(<Foo useDiv={true} />, {
      createNodeMock,
    });
    inst.update(<Foo useDiv={false} />);
    expect(log).toEqual(['div', 'span']);
  });

  it('supports error boundaries', () => {
    const log = [];
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
            <div>
              <button onClick={this.onClick}>ClickMe</button>
              <Angry />
            </div>
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
      componentDidCatch() {
        log.push('Boundary componentDidCatch');
        this.setState({error: true});
      }
    }

    const renderer = ReactTestRenderer.create(<Boundary />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['Happy Birthday!'],
    });
    expect(log).toEqual([
      'Boundary render',
      'Angry render',
      'Boundary componentDidMount',
      'Boundary componentDidCatch',
      'Boundary render',
    ]);
  });

  it('can update text nodes', () => {
    class Component extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    const renderer = ReactTestRenderer.create(<Component>Hi</Component>);
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
      children: ['42'],
      props: {},
    });
    renderer.update(
      <Component>
        <div />
      </Component>,
    );
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      children: [
        {
          type: 'div',
          children: null,
          props: {},
        },
      ],
      props: {},
    });
  });

  it('toTree() renders simple components returning host components', () => {
    const Qoo = () => <span className="Qoo">Hello World!</span>;

    const renderer = ReactTestRenderer.create(<Qoo />);
    const tree = renderer.toTree();

    cleanNodeOrArray(tree);

    expect(prettyFormat(tree)).toEqual(
      prettyFormat({
        nodeType: 'component',
        type: Qoo,
        props: {},
        instance: null,
        rendered: {
          nodeType: 'host',
          type: 'span',
          props: {className: 'Qoo'},
          instance: null,
          rendered: ['Hello World!'],
        },
      }),
    );
  });

  it('toTree() handles nested Fragments', () => {
    const Foo = () => (
      <React.Fragment>
        <React.Fragment>foo</React.Fragment>
      </React.Fragment>
    );
    const renderer = ReactTestRenderer.create(<Foo />);
    const tree = renderer.toTree();

    cleanNodeOrArray(tree);

    expect(prettyFormat(tree)).toEqual(
      prettyFormat({
        nodeType: 'component',
        type: Foo,
        instance: null,
        props: {},
        rendered: 'foo',
      }),
    );
  });

  it('toTree() handles null rendering components', () => {
    class Foo extends React.Component {
      render() {
        return null;
      }
    }

    const renderer = ReactTestRenderer.create(<Foo />);
    const tree = renderer.toTree();

    expect(tree.instance).toBeInstanceOf(Foo);

    cleanNodeOrArray(tree);

    expect(tree).toEqual({
      type: Foo,
      nodeType: 'component',
      props: {},
      instance: null,
      rendered: null,
    });
  });

  it('toTree() handles simple components that return arrays', () => {
    const Foo = ({children}) => children;

    const renderer = ReactTestRenderer.create(
      <Foo>
        <div>One</div>
        <div>Two</div>
      </Foo>,
    );

    const tree = renderer.toTree();

    cleanNodeOrArray(tree);

    expect(prettyFormat(tree)).toEqual(
      prettyFormat({
        type: Foo,
        nodeType: 'component',
        props: {},
        instance: null,
        rendered: [
          {
            instance: null,
            nodeType: 'host',
            props: {},
            rendered: ['One'],
            type: 'div',
          },
          {
            instance: null,
            nodeType: 'host',
            props: {},
            rendered: ['Two'],
            type: 'div',
          },
        ],
      }),
    );
  });

  it('toTree() handles complicated tree of arrays', () => {
    class Foo extends React.Component {
      render() {
        return this.props.children;
      }
    }

    const renderer = ReactTestRenderer.create(
      <div>
        <Foo>
          <div>One</div>
          <div>Two</div>
          <Foo>
            <div>Three</div>
          </Foo>
        </Foo>
        <div>Four</div>
      </div>,
    );

    const tree = renderer.toTree();

    cleanNodeOrArray(tree);

    expect(prettyFormat(tree)).toEqual(
      prettyFormat({
        type: 'div',
        instance: null,
        nodeType: 'host',
        props: {},
        rendered: [
          {
            type: Foo,
            nodeType: 'component',
            props: {},
            instance: null,
            rendered: [
              {
                type: 'div',
                nodeType: 'host',
                props: {},
                instance: null,
                rendered: ['One'],
              },
              {
                type: 'div',
                nodeType: 'host',
                props: {},
                instance: null,
                rendered: ['Two'],
              },
              {
                type: Foo,
                nodeType: 'component',
                props: {},
                instance: null,
                rendered: {
                  type: 'div',
                  nodeType: 'host',
                  props: {},
                  instance: null,
                  rendered: ['Three'],
                },
              },
            ],
          },
          {
            type: 'div',
            nodeType: 'host',
            props: {},
            instance: null,
            rendered: ['Four'],
          },
        ],
      }),
    );
  });

  it('toTree() handles complicated tree of fragments', () => {
    const renderer = ReactTestRenderer.create(
      <React.Fragment>
        <React.Fragment>
          <div>One</div>
          <div>Two</div>
          <React.Fragment>
            <div>Three</div>
          </React.Fragment>
        </React.Fragment>
        <div>Four</div>
      </React.Fragment>,
    );

    const tree = renderer.toTree();

    cleanNodeOrArray(tree);

    expect(prettyFormat(tree)).toEqual(
      prettyFormat([
        {
          type: 'div',
          nodeType: 'host',
          props: {},
          instance: null,
          rendered: ['One'],
        },
        {
          type: 'div',
          nodeType: 'host',
          props: {},
          instance: null,
          rendered: ['Two'],
        },
        {
          type: 'div',
          nodeType: 'host',
          props: {},
          instance: null,
          rendered: ['Three'],
        },
        {
          type: 'div',
          nodeType: 'host',
          props: {},
          instance: null,
          rendered: ['Four'],
        },
      ]),
    );
  });

  it('root instance and createNodeMock ref return the same value', () => {
    const createNodeMock = ref => ({node: ref});
    let refInst = null;
    const renderer = ReactTestRenderer.create(
      <div ref={ref => (refInst = ref)} />,
      {createNodeMock},
    );
    const root = renderer.getInstance();
    expect(root).toEqual(refInst);
  });

  it('toTree() renders complicated trees of composites and hosts', () => {
    // SFC returning host. no children props.
    const Qoo = () => <span className="Qoo">Hello World!</span>;

    // SFC returning host. passes through children.
    const Foo = ({className, children}) => (
      <div className={'Foo ' + className}>
        <span className="Foo2">Literal</span>
        {children}
      </div>
    );

    // class composite returning composite. passes through children.
    class Bar extends React.Component {
      render() {
        const {special, children} = this.props;
        return <Foo className={special ? 'special' : 'normal'}>{children}</Foo>;
      }
    }

    // class composite return composite. no children props.
    class Bam extends React.Component {
      render() {
        return (
          <Bar special={true}>
            <Qoo />
          </Bar>
        );
      }
    }

    const renderer = ReactTestRenderer.create(<Bam />);
    const tree = renderer.toTree();

    // we test for the presence of instances before nulling them out
    expect(tree.instance).toBeInstanceOf(Bam);
    expect(tree.rendered.instance).toBeInstanceOf(Bar);

    cleanNodeOrArray(tree);

    expect(prettyFormat(tree)).toEqual(
      prettyFormat({
        type: Bam,
        nodeType: 'component',
        props: {},
        instance: null,
        rendered: {
          type: Bar,
          nodeType: 'component',
          props: {special: true},
          instance: null,
          rendered: {
            type: Foo,
            nodeType: 'component',
            props: {className: 'special'},
            instance: null,
            rendered: {
              type: 'div',
              nodeType: 'host',
              props: {className: 'Foo special'},
              instance: null,
              rendered: [
                {
                  type: 'span',
                  nodeType: 'host',
                  props: {className: 'Foo2'},
                  instance: null,
                  rendered: ['Literal'],
                },
                {
                  type: Qoo,
                  nodeType: 'component',
                  props: {},
                  instance: null,
                  rendered: {
                    type: 'span',
                    nodeType: 'host',
                    props: {className: 'Qoo'},
                    instance: null,
                    rendered: ['Hello World!'],
                  },
                },
              ],
            },
          },
        },
      }),
    );
  });

  it('can update text nodes when rendered as root', () => {
    const renderer = ReactTestRenderer.create(['Hello', 'world']);
    expect(renderer.toJSON()).toEqual(['Hello', 'world']);
    renderer.update(42);
    expect(renderer.toJSON()).toEqual('42');
    renderer.update([42, 'world']);
    expect(renderer.toJSON()).toEqual(['42', 'world']);
  });

  it('can render and update root fragments', () => {
    const Component = props => props.children;

    const renderer = ReactTestRenderer.create([
      <Component key="a">Hi</Component>,
      <Component key="b">Bye</Component>,
    ]);
    expect(renderer.toJSON()).toEqual(['Hi', 'Bye']);
    renderer.update(<div />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      children: null,
      props: {},
    });
    renderer.update([<div key="a">goodbye</div>, 'world']);
    expect(renderer.toJSON()).toEqual([
      {
        type: 'div',
        children: ['goodbye'],
        props: {},
      },
      'world',
    ]);
  });

  it('supports context providers and consumers', () => {
    const {Consumer, Provider} = React.createContext('a');

    function Child(props) {
      return props.value;
    }

    function App() {
      return (
        <Provider value="b">
          <Consumer>{value => <Child value={value} />}</Consumer>
        </Provider>
      );
    }

    const renderer = ReactTestRenderer.create(<App />);
    const child = renderer.root.findByType(Child);
    expect(child.children).toEqual(['b']);
    expect(prettyFormat(renderer.toTree())).toEqual(
      prettyFormat({
        instance: null,
        nodeType: 'component',
        props: {},
        rendered: {
          instance: null,
          nodeType: 'component',
          props: {
            value: 'b',
          },
          rendered: 'b',
          type: Child,
        },
        type: App,
      }),
    );
  });

  it('supports modes', () => {
    function Child(props) {
      return props.value;
    }

    function App(props) {
      return (
        <React.StrictMode>
          <Child value={props.value} />
        </React.StrictMode>
      );
    }

    const renderer = ReactTestRenderer.create(<App value="a" />);
    const child = renderer.root.findByType(Child);
    expect(child.children).toEqual(['a']);
    expect(prettyFormat(renderer.toTree())).toEqual(
      prettyFormat({
        instance: null,
        nodeType: 'component',
        props: {
          value: 'a',
        },
        rendered: {
          instance: null,
          nodeType: 'component',
          props: {
            value: 'a',
          },
          rendered: 'a',
          type: Child,
        },
        type: App,
      }),
    );
  });

  it('supports forwardRef', () => {
    const InnerRefed = React.forwardRef((props, ref) => (
      <div>
        <span ref={ref} />
      </div>
    ));

    class App extends React.Component {
      render() {
        return <InnerRefed ref={r => (this.ref = r)} />;
      }
    }

    const renderer = ReactTestRenderer.create(<App />);
    const tree = renderer.toTree();
    cleanNodeOrArray(tree);

    expect(prettyFormat(tree)).toEqual(
      prettyFormat({
        instance: null,
        nodeType: 'component',
        props: {},
        rendered: {
          instance: null,
          nodeType: 'host',
          props: {},
          rendered: [
            {
              instance: null,
              nodeType: 'host',
              props: {},
              rendered: [],
              type: 'span',
            },
          ],
          type: 'div',
        },
        type: App,
      }),
    );
  });

  it('can concurrently render context with a "primary" renderer', () => {
    const Context = React.createContext(null);
    const Indirection = React.Fragment;
    const App = () => (
      <Context.Provider>
        <Indirection>
          <Context.Consumer>{() => null}</Context.Consumer>
        </Indirection>
      </Context.Provider>
    );
    ReactNoop.render(<App />);
    ReactNoop.flush();
    ReactTestRenderer.create(<App />);
  });
});

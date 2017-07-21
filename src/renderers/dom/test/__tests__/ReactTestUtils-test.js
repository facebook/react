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

let createRenderer;
let PropTypes;
let React;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;

describe('ReactTestUtils', () => {
  beforeEach(() => {
    createRenderer = require('react-test-renderer/shallow').createRenderer;
    PropTypes = require('prop-types');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should call all of the lifecycle hooks', () => {
    const logs = [];
    const logger = message => () => logs.push(message) || true;

    class SomeComponent extends React.Component {
      componentWillMount = logger('componentWillMount');
      componentDidMount = logger('componentDidMount');
      componentWillReceiveProps = logger('componentWillReceiveProps');
      shouldComponentUpdate = logger('shouldComponentUpdate');
      componentWillUpdate = logger('componentWillUpdate');
      componentDidUpdate = logger('componentDidUpdate');
      componentWillUnmount = logger('componentWillUnmount');
      render() {
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SomeComponent foo={1} />);

    // Calling cDU might lead to problems with host component references.
    // Since our components aren't really mounted, refs won't be available.
    expect(logs).toEqual(['componentWillMount']);

    logs.splice(0);

    const instance = shallowRenderer.getMountedInstance();
    instance.setState({});

    // The previous shallow renderer triggered cDU for setState() calls.
    expect(logs).toEqual([
      'shouldComponentUpdate',
      'componentWillUpdate',
      'componentDidUpdate',
    ]);

    logs.splice(0);

    shallowRenderer.render(<SomeComponent foo={2} />);

    // The previous shallow renderer did not trigger cDU for props changes.
    expect(logs).toEqual([
      'componentWillReceiveProps',
      'shouldComponentUpdate',
      'componentWillUpdate',
    ]);
  });

  it('should only render 1 level deep', () => {
    function Parent() {
      return <div><Child /></div>;
    }
    function Child() {
      throw Error('This component should not render');
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(React.createElement(Parent));
  });

  it('should have shallow rendering', () => {
    class SomeComponent extends React.Component {
      render() {
        return (
          <div>
            <span className="child1" />
            <span className="child2" />
          </div>
        );
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SomeComponent />);

    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />,
    ]);
  });

  it('should enable shouldComponentUpdate to prevent a re-render', () => {
    let renderCounter = 0;
    class SimpleComponent extends React.Component {
      state = {update: false};
      shouldComponentUpdate(nextProps, nextState) {
        return this.state.update !== nextState.update;
      }
      render() {
        renderCounter++;
        return <div>{`${renderCounter}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent />);
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>1</div>);

    const instance = shallowRenderer.getMountedInstance();
    instance.setState({update: false});
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>1</div>);

    instance.setState({update: true});
    expect(shallowRenderer.getRenderOutput()).toEqual(<div>2</div>);
  });

  it('should shallow render a functional component', () => {
    function SomeComponent(props, context) {
      return (
        <div>
          <div>{props.foo}</div>
          <div>{context.bar}</div>
          <span className="child1" />
          <span className="child2" />
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SomeComponent foo={'FOO'} />, {
      bar: 'BAR',
    });

    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <div>FOO</div>,
      <div>BAR</div>,
      <span className="child1" />,
      <span className="child2" />,
    ]);
  });

  it('should throw for invalid elements', () => {
    class SomeComponent extends React.Component {
      render() {
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    expect(() => shallowRenderer.render(SomeComponent)).toThrowError(
      'ReactShallowRenderer render(): Invalid component element. Instead of ' +
        'passing a component class, make sure to instantiate it by passing it ' +
        'to React.createElement.',
    );
    expect(() => shallowRenderer.render(<div />)).toThrowError(
      'ReactShallowRenderer render(): Shallow rendering works only with ' +
        'custom components, not primitives (div). Instead of calling ' +
        '`.render(el)` and inspecting the rendered output, look at `el.props` ' +
        'directly instead.',
    );
  });

  it('should have shallow unmounting', () => {
    const componentWillUnmount = jest.fn();

    class SomeComponent extends React.Component {
      componentWillUnmount = componentWillUnmount;
      render() {
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SomeComponent />);
    shallowRenderer.unmount();

    expect(componentWillUnmount).toBeCalled();
  });

  it('can shallow render to null', () => {
    class SomeComponent extends React.Component {
      render() {
        return null;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SomeComponent />);

    expect(result).toBe(null);
  });

  it('can shallow render with a ref', () => {
    class SomeComponent extends React.Component {
      render() {
        return <div ref="hello" />;
      }
    }

    const shallowRenderer = createRenderer();
    // Shouldn't crash.
    shallowRenderer.render(<SomeComponent />);
  });

  it('lets you update shallowly rendered components', () => {
    class SomeComponent extends React.Component {
      state = {clicked: false};

      onClick = () => {
        this.setState({clicked: true});
      };

      render() {
        const className = this.state.clicked ? 'was-clicked' : '';

        if (this.props.aNew === 'prop') {
          return (
            <a href="#" onClick={this.onClick} className={className}>
              Test link
            </a>
          );
        } else {
          return (
            <div>
              <span className="child1" />
              <span className="child2" />
            </div>
          );
        }
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SomeComponent />);
    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />,
    ]);

    const updatedResult = shallowRenderer.render(<SomeComponent aNew="prop" />);
    expect(updatedResult.type).toBe('a');

    const mockEvent = {};
    updatedResult.props.onClick(mockEvent);

    const updatedResultCausedByClick = shallowRenderer.getRenderOutput();
    expect(updatedResultCausedByClick.type).toBe('a');
    expect(updatedResultCausedByClick.props.className).toBe('was-clicked');
  });

  it('can access the mounted component instance', () => {
    class SimpleComponent extends React.Component {
      someMethod = () => {
        return this.props.n;
      };

      render() {
        return <div>{this.props.n}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent n={5} />);
    expect(shallowRenderer.getMountedInstance().someMethod()).toEqual(5);
  });

  it('can shallowly render components with contextTypes', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        name: PropTypes.string,
      };

      render() {
        return <div />;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result).toEqual(<div />);
  });

  it('can shallowly render components with ref as function', () => {
    class SimpleComponent extends React.Component {
      state = {clicked: false};

      handleUserClick = () => {
        this.setState({clicked: true});
      };

      render() {
        return (
          <div
            ref={() => {}}
            onClick={this.handleUserClick}
            className={this.state.clicked ? 'clicked' : ''}
          />
        );
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent />);
    let result = shallowRenderer.getRenderOutput();
    expect(result.type).toEqual('div');
    expect(result.props.className).toEqual('');
    result.props.onClick();

    result = shallowRenderer.getRenderOutput();
    expect(result.type).toEqual('div');
    expect(result.props.className).toEqual('clicked');
  });

  it('can setState in componentWillMount when shallow rendering', () => {
    class SimpleComponent extends React.Component {
      componentWillMount() {
        this.setState({groovy: 'doovy'});
      }

      render() {
        return <div>{this.state.groovy}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result).toEqual(<div>doovy</div>);
  });

  it('can setState in componentWillReceiveProps when shallow rendering', () => {
    class SimpleComponent extends React.Component {
      state = {count: 0};

      componentWillReceiveProps(nextProps) {
        if (nextProps.updateState) {
          this.setState({count: 1});
        }
      }

      render() {
        return <div>{this.state.count}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(
      <SimpleComponent updateState={false} />,
    );
    expect(result.props.children).toEqual(0);

    result = shallowRenderer.render(<SimpleComponent updateState={true} />);
    expect(result.props.children).toEqual(1);
  });

  it('can setState with an updater function', () => {
    let instance;

    class SimpleComponent extends React.Component {
      state = {
        counter: 0,
      };

      render() {
        instance = this;
        return (
          <button ref="button" onClick={this.onClick}>
            {this.state.counter}
          </button>
        );
      }
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(<SimpleComponent defaultCount={1} />);
    expect(result.props.children).toEqual(0);

    instance.setState((state, props) => {
      return {counter: props.defaultCount + 1};
    });

    result = shallowRenderer.getRenderOutput();
    expect(result.props.children).toEqual(2);
  });

  it('can setState with a callback', () => {
    let instance;

    class SimpleComponent extends React.Component {
      state = {
        counter: 0,
      };
      render() {
        instance = this;
        return (
          <p>
            {this.state.counter}
          </p>
        );
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result.props.children).toBe(0);

    const callback = jest.fn(function() {
      expect(this).toBe(instance);
    });

    instance.setState({counter: 1}, callback);

    const updated = shallowRenderer.getRenderOutput();
    expect(updated.props.children).toBe(1);
    expect(callback).toHaveBeenCalled();
  });

  it('can replaceState with a callback', () => {
    let instance;

    class SimpleComponent extends React.Component {
      state = {
        counter: 0,
      };
      render() {
        instance = this;
        return (
          <p>
            {this.state.counter}
          </p>
        );
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result.props.children).toBe(0);

    const callback = jest.fn(function() {
      expect(this).toBe(instance);
    });

    // No longer a public API, but we can test that it works internally by
    // reaching into the updater.
    shallowRenderer._updater.enqueueReplaceState(
      instance,
      {counter: 1},
      callback,
    );

    const updated = shallowRenderer.getRenderOutput();
    expect(updated.props.children).toBe(1);
    expect(callback).toHaveBeenCalled();
  });

  it('can forceUpdate with a callback', () => {
    let instance;

    class SimpleComponent extends React.Component {
      state = {
        counter: 0,
      };
      render() {
        instance = this;
        return (
          <p>
            {this.state.counter}
          </p>
        );
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />);
    expect(result.props.children).toBe(0);

    const callback = jest.fn(function() {
      expect(this).toBe(instance);
    });

    instance.forceUpdate(callback);

    const updated = shallowRenderer.getRenderOutput();
    expect(updated.props.children).toBe(0);
    expect(callback).toHaveBeenCalled();
  });

  it('can pass context when shallowly rendering', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        name: PropTypes.string,
      };

      render() {
        return <div>{this.context.name}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<SimpleComponent />, {
      name: 'foo',
    });
    expect(result).toEqual(<div>foo</div>);
  });

  it('should track context across updates', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        foo: PropTypes.string,
      };

      state = {
        bar: 'bar',
      };

      render() {
        return <div>{`${this.context.foo}:${this.state.bar}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(<SimpleComponent />, {
      foo: 'foo',
    });
    expect(result).toEqual(<div>foo:bar</div>);

    const instance = shallowRenderer.getMountedInstance();
    instance.setState({bar: 'baz'});

    result = shallowRenderer.getRenderOutput();
    expect(result).toEqual(<div>foo:baz</div>);
  });

  it('can fail context when shallowly rendering', () => {
    spyOn(console, 'error');

    class SimpleComponent extends React.Component {
      static contextTypes = {
        name: PropTypes.string.isRequired,
      };

      render() {
        return <div>{this.context.name}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SimpleComponent />);
    expectDev(console.error.calls.count()).toBe(1);
    expect(
      console.error.calls.argsFor(0)[0].replace(/\(at .+?:\d+\)/g, '(at **)'),
    ).toBe(
      'Warning: Failed context type: The context `name` is marked as ' +
        'required in `SimpleComponent`, but its value is `undefined`.\n' +
        '    in SimpleComponent (at **)',
    );
  });

  it('should warn about propTypes (but only once)', () => {
    spyOn(console, 'error');

    class SimpleComponent extends React.Component {
      render() {
        return React.createElement('div', null, this.props.name);
      }
    }

    SimpleComponent.propTypes = {
      name: PropTypes.string.isRequired,
    };

    const shallowRenderer = createRenderer();
    shallowRenderer.render(React.createElement(SimpleComponent, {name: 123}));

    expect(console.error.calls.count()).toBe(1);
    expect(
      console.error.calls.argsFor(0)[0].replace(/\(at .+?:\d+\)/g, '(at **)'),
    ).toBe(
      'Warning: Failed prop type: Invalid prop `name` of type `number` ' +
        'supplied to `SimpleComponent`, expected `string`.\n' +
        '    in SimpleComponent',
    );
  });

  it('can scryRenderedDOMComponentsWithClass with TextComponent', () => {
    class Wrapper extends React.Component {
      render() {
        return <div>Hello <span>Jim</span></div>;
      }
    }

    const renderedComponent = ReactTestUtils.renderIntoDocument(<Wrapper />);
    const scryResults = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'NonExistentClass',
    );
    expect(scryResults.length).toBe(0);
  });

  it('can scryRenderedDOMComponentsWithClass with className contains \\n', () => {
    class Wrapper extends React.Component {
      render() {
        return <div>Hello <span className={'x\ny'}>Jim</span></div>;
      }
    }

    const renderedComponent = ReactTestUtils.renderIntoDocument(<Wrapper />);
    const scryResults = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x',
    );
    expect(scryResults.length).toBe(1);
  });

  it('can scryRenderedDOMComponentsWithClass with multiple classes', () => {
    class Wrapper extends React.Component {
      render() {
        return <div>Hello <span className={'x y z'}>Jim</span></div>;
      }
    }

    const renderedComponent = ReactTestUtils.renderIntoDocument(<Wrapper />);
    const scryResults1 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x y',
    );
    expect(scryResults1.length).toBe(1);

    const scryResults2 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x z',
    );
    expect(scryResults2.length).toBe(1);

    const scryResults3 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x', 'y'],
    );
    expect(scryResults3.length).toBe(1);

    expect(scryResults1[0]).toBe(scryResults2[0]);
    expect(scryResults1[0]).toBe(scryResults3[0]);

    const scryResults4 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x', 'a'],
    );
    expect(scryResults4.length).toBe(0);

    const scryResults5 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x a'],
    );
    expect(scryResults5.length).toBe(0);
  });

  it('traverses children in the correct order', () => {
    class Wrapper extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <Wrapper>
        {null}
        <div>purple</div>
      </Wrapper>,
      container,
    );
    const tree = ReactDOM.render(
      <Wrapper>
        <div>orange</div>
        <div>purple</div>
      </Wrapper>,
      container,
    );

    const log = [];
    ReactTestUtils.findAllInRenderedTree(tree, function(child) {
      if (ReactTestUtils.isDOMComponent(child)) {
        log.push(ReactDOM.findDOMNode(child).textContent);
      }
    });

    // Should be document order, not mount order (which would be purple, orange)
    expect(log).toEqual(['orangepurple', 'orange', 'purple']);
  });

  it('should support injected wrapper components as DOM components', () => {
    const getTestDocument = require('getTestDocument');

    const injectedDOMComponents = [
      'button',
      'form',
      'iframe',
      'img',
      'input',
      'option',
      'select',
      'textarea',
    ];

    injectedDOMComponents.forEach(function(type) {
      const testComponent = ReactTestUtils.renderIntoDocument(
        React.createElement(type),
      );
      expect(testComponent.tagName).toBe(type.toUpperCase());
      expect(ReactTestUtils.isDOMComponent(testComponent)).toBe(true);
    });

    // Full-page components (html, head, body) can't be rendered into a div
    // directly...
    class Root extends React.Component {
      render() {
        return (
          <html ref="html">
            <head ref="head">
              <title>hello</title>
            </head>
            <body ref="body">
              hello, world
            </body>
          </html>
        );
      }
    }

    const markup = ReactDOMServer.renderToString(<Root />);
    const testDocument = getTestDocument(markup);
    const component = ReactDOM.render(<Root />, testDocument);

    expect(component.refs.html.tagName).toBe('HTML');
    expect(component.refs.head.tagName).toBe('HEAD');
    expect(component.refs.body.tagName).toBe('BODY');
    expect(ReactTestUtils.isDOMComponent(component.refs.html)).toBe(true);
    expect(ReactTestUtils.isDOMComponent(component.refs.head)).toBe(true);
    expect(ReactTestUtils.isDOMComponent(component.refs.body)).toBe(true);
  });

  it('should change the value of an input field', () => {
    const obj = {
      handler: function(e) {
        e.persist();
      },
    };
    spyOn(obj, 'handler').and.callThrough();
    const container = document.createElement('div');
    const instance = ReactDOM.render(
      <input type="text" onChange={obj.handler} />,
      container,
    );

    const node = ReactDOM.findDOMNode(instance);
    node.value = 'giraffe';
    ReactTestUtils.Simulate.change(node);

    expect(obj.handler).toHaveBeenCalledWith(
      jasmine.objectContaining({target: node}),
    );
  });

  it('should change the value of an input field in a component', () => {
    class SomeComponent extends React.Component {
      render() {
        return (
          <div>
            <input type="text" ref="input" onChange={this.props.handleChange} />
          </div>
        );
      }
    }

    const obj = {
      handler: function(e) {
        e.persist();
      },
    };
    spyOn(obj, 'handler').and.callThrough();
    const container = document.createElement('div');
    const instance = ReactDOM.render(
      <SomeComponent handleChange={obj.handler} />,
      container,
    );

    const node = ReactDOM.findDOMNode(instance.refs.input);
    node.value = 'zebra';
    ReactTestUtils.Simulate.change(node);

    expect(obj.handler).toHaveBeenCalledWith(
      jasmine.objectContaining({target: node}),
    );
  });

  it('should throw when attempting to use ReactTestUtils.Simulate with shallow rendering', () => {
    class SomeComponent extends React.Component {
      render() {
        return (
          <div onClick={this.props.handleClick}>
            hello, world.
          </div>
        );
      }
    }

    const handler = jasmine.createSpy('spy');
    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(
      <SomeComponent handleClick={handler} />,
    );

    expect(() => ReactTestUtils.Simulate.click(result)).toThrowError(
      'TestUtils.Simulate expects a component instance and not a ReactElement.' +
        'TestUtils.Simulate will not work if you are using shallow rendering.',
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('should not warn when simulating events with extra properties', () => {
    spyOn(console, 'error');

    const CLIENT_X = 100;

    class Component extends React.Component {
      handleClick = e => {
        expect(e.clientX).toBe(CLIENT_X);
      };

      render() {
        return <div onClick={this.handleClick} />;
      }
    }

    const element = document.createElement('div');
    const instance = ReactDOM.render(<Component />, element);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance), {
      clientX: CLIENT_X,
    });
    expectDev(console.error.calls.count()).toBe(0);
  });

  it('can scry with stateless components involved', () => {
    const Stateless = () => <div><hr /></div>;

    class SomeComponent extends React.Component {
      render() {
        return (
          <div>
            <Stateless />
            <hr />
          </div>
        );
      }
    }

    const inst = ReactTestUtils.renderIntoDocument(<SomeComponent />);
    const hrs = ReactTestUtils.scryRenderedDOMComponentsWithTag(inst, 'hr');
    expect(hrs.length).toBe(2);
  });

  it('should enable rendering of cloned element', () => {
    class SimpleComponent extends React.Component {
      constructor(props) {
        super(props);

        this.state = {
          bar: 'bar',
        };
      }

      render() {
        return <div>{`${this.props.foo}:${this.state.bar}`}</div>;
      }
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(<SimpleComponent foo="foo" />);
    expect(result).toEqual(<div>foo:bar</div>);

    const instance = shallowRenderer.getMountedInstance();
    const cloned = React.cloneElement(instance, {foo: 'baz'});
    result = shallowRenderer.render(cloned);
    expect(result).toEqual(<div>baz:bar</div>);
  });

  describe('Simulate', () => {
    it('should set the type of the event', () => {
      let event;
      const stub = jest.genMockFn().mockImplementation(e => {
        e.persist();
        event = e;
      });

      const container = document.createElement('div');
      const instance = ReactDOM.render(<div onKeyDown={stub} />, container);
      const node = ReactDOM.findDOMNode(instance);

      ReactTestUtils.Simulate.keyDown(node);

      expect(event.type).toBe('keydown');
      expect(event.nativeEvent.type).toBe('keydown');
    });

    it('should work with renderIntoDocument', () => {
      const onChange = jest.fn();

      class MyComponent extends React.Component {
        render() {
          return <div><input type="text" onChange={onChange} /></div>;
        }
      }

      const instance = ReactTestUtils.renderIntoDocument(<MyComponent />);
      const input = ReactTestUtils.findRenderedDOMComponentWithTag(
        instance,
        'input',
      );
      input.value = 'giraffe';
      ReactTestUtils.Simulate.change(input);

      expect(onChange).toHaveBeenCalledWith(
        jasmine.objectContaining({target: input}),
      );
    });
  });

  it('should call setState callback with no arguments', () => {
    let mockArgs;
    class Component extends React.Component {
      componentDidMount() {
        this.setState({}, (...args) => (mockArgs = args));
      }
      render() {
        return false;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);
    expect(mockArgs.length).toEqual(0);
  });
});

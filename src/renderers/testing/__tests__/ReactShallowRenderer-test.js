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

describe('ReactTestUtils', () => {
  beforeEach(() => {
    createRenderer = require('react-test-renderer/shallow').createRenderer;
    PropTypes = require('prop-types');
    React = require('react');
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

  it('should shallow render a component returning strings directly from render', () => {
    const Text = ({value}) => value;

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<Text value="foo" />);
    expect(result).toEqual('foo');
  });

  it('should shallow render a component returning numbers directly from render', () => {
    const Text = ({value}) => value;

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<Text value={10} />);
    expect(result).toEqual(10);
  });

  it('should shallow render a fragment', () => {
    class SomeComponent extends React.Component {
      render() {
        return <div />;
      }
    }
    class Fragment extends React.Component {
      render() {
        return [<div key="a" />, <span key="b" />, <SomeComponent />];
      }
    }
    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(<Fragment />);
    expect(result).toEqual([
      <div key="a" />,
      <span key="b" />,
      <SomeComponent />,
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
});

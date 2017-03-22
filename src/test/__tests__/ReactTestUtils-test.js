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

var React;
var ReactDOM;
var ReactDOMServer;
var ReactTestUtils;

describe('ReactTestUtils', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('ReactTestUtils');
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

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SomeComponent />);

    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />,
    ]);
  });

  it('should shallow render a functional component', () => {
    function SomeComponent() {
      return (
        <div>
          <span className="child1" />
          <span className="child2" />
        </div>
      );
    }

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SomeComponent />);

    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
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

    var shallowRenderer = ReactTestUtils.createRenderer();
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
    var componentWillUnmount = jest.fn();

    class SomeComponent extends React.Component {
      componentWillUnmount = componentWillUnmount;
      render() {
        return <div />;
      }
    }

    var shallowRenderer = ReactTestUtils.createRenderer();
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

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SomeComponent />);

    expect(result).toBe(null);
  });

  it('can shallow render with a ref', () => {
    class SomeComponent extends React.Component {
      render() {
        return <div ref="hello" />;
      }
    }

    var shallowRenderer = ReactTestUtils.createRenderer();
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
        var className = this.state.clicked ? 'was-clicked' : '';

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

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SomeComponent />);
    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />,
    ]);

    var updatedResult = shallowRenderer.render(<SomeComponent aNew="prop" />);
    expect(updatedResult.type).toBe('a');

    var mockEvent = {};
    updatedResult.props.onClick(mockEvent);

    var updatedResultCausedByClick = shallowRenderer.getRenderOutput();
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

    var shallowRenderer = ReactTestUtils.createRenderer();
    shallowRenderer.render(<SimpleComponent n={5} />);
    expect(shallowRenderer.getMountedInstance().someMethod()).toEqual(5);
  });

  it('can shallowly render components with contextTypes', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        name: React.PropTypes.string,
      };

      render() {
        return <div />;
      }
    }

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SimpleComponent />);
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

    var shallowRenderer = ReactTestUtils.createRenderer();
    shallowRenderer.render(<SimpleComponent />);
    var result = shallowRenderer.getRenderOutput();
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

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SimpleComponent />);
    expect(result).toEqual(<div>doovy</div>);
  });

  it('can pass context when shallowly rendering', () => {
    class SimpleComponent extends React.Component {
      static contextTypes = {
        name: React.PropTypes.string,
      };

      render() {
        return <div>{this.context.name}</div>;
      }
    }

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SimpleComponent />, {
      name: 'foo',
    });
    expect(result).toEqual(<div>foo</div>);
  });

  it('can fail context when shallowly rendering', () => {
    spyOn(console, 'error');

    class SimpleComponent extends React.Component {
      static contextTypes = {
        name: React.PropTypes.string.isRequired,
      };

      render() {
        return <div>{this.context.name}</div>;
      }
    }

    var shallowRenderer = ReactTestUtils.createRenderer();
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

  it('can scryRenderedDOMComponentsWithClass with TextComponent', () => {
    class Wrapper extends React.Component {
      render() {
        return <div>Hello <span>Jim</span></div>;
      }
    }

    var renderedComponent = ReactTestUtils.renderIntoDocument(<Wrapper />);
    var scryResults = ReactTestUtils.scryRenderedDOMComponentsWithClass(
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

    var renderedComponent = ReactTestUtils.renderIntoDocument(<Wrapper />);
    var scryResults = ReactTestUtils.scryRenderedDOMComponentsWithClass(
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

    var renderedComponent = ReactTestUtils.renderIntoDocument(<Wrapper />);
    var scryResults1 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x y',
    );
    expect(scryResults1.length).toBe(1);

    var scryResults2 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x z',
    );
    expect(scryResults2.length).toBe(1);

    var scryResults3 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x', 'y'],
    );
    expect(scryResults3.length).toBe(1);

    expect(scryResults1[0]).toBe(scryResults2[0]);
    expect(scryResults1[0]).toBe(scryResults3[0]);

    var scryResults4 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x', 'a'],
    );
    expect(scryResults4.length).toBe(0);

    var scryResults5 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
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

    var container = document.createElement('div');
    ReactDOM.render(
      <Wrapper>
        {null}
        <div>purple</div>
      </Wrapper>,
      container,
    );
    var tree = ReactDOM.render(
      <Wrapper>
        <div>orange</div>
        <div>purple</div>
      </Wrapper>,
      container,
    );

    var log = [];
    ReactTestUtils.findAllInRenderedTree(tree, function(child) {
      if (ReactTestUtils.isDOMComponent(child)) {
        log.push(ReactDOM.findDOMNode(child).textContent);
      }
    });

    // Should be document order, not mount order (which would be purple, orange)
    expect(log).toEqual(['orangepurple', 'orange', 'purple']);
  });

  it('should support injected wrapper components as DOM components', () => {
    var getTestDocument = require('getTestDocument');

    var injectedDOMComponents = [
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
      var testComponent = ReactTestUtils.renderIntoDocument(
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

    var markup = ReactDOMServer.renderToString(<Root />);
    var testDocument = getTestDocument(markup);
    var component = ReactDOM.render(<Root />, testDocument);

    expect(component.refs.html.tagName).toBe('HTML');
    expect(component.refs.head.tagName).toBe('HEAD');
    expect(component.refs.body.tagName).toBe('BODY');
    expect(ReactTestUtils.isDOMComponent(component.refs.html)).toBe(true);
    expect(ReactTestUtils.isDOMComponent(component.refs.head)).toBe(true);
    expect(ReactTestUtils.isDOMComponent(component.refs.body)).toBe(true);
  });

  it('should change the value of an input field', () => {
    var obj = {
      handler: function(e) {
        e.persist();
      },
    };
    spyOn(obj, 'handler').and.callThrough();
    var container = document.createElement('div');
    var instance = ReactDOM.render(
      <input type="text" onChange={obj.handler} />,
      container,
    );

    var node = ReactDOM.findDOMNode(instance);
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

    var obj = {
      handler: function(e) {
        e.persist();
      },
    };
    spyOn(obj, 'handler').and.callThrough();
    var container = document.createElement('div');
    var instance = ReactDOM.render(
      <SomeComponent handleChange={obj.handler} />,
      container,
    );

    var node = ReactDOM.findDOMNode(instance.refs.input);
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

    var handler = jasmine.createSpy('spy');
    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(
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

    var CLIENT_X = 100;

    class Component extends React.Component {
      handleClick = e => {
        expect(e.clientX).toBe(CLIENT_X);
      };

      render() {
        return <div onClick={this.handleClick} />;
      }
    }

    var element = document.createElement('div');
    var instance = ReactDOM.render(<Component />, element);
    ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance), {
      clientX: CLIENT_X,
    });
    expectDev(console.error.calls.count()).toBe(0);
  });

  it('can scry with stateless components involved', () => {
    var Stateless = () => <div><hr /></div>;

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

    var inst = ReactTestUtils.renderIntoDocument(<SomeComponent />);
    var hrs = ReactTestUtils.scryRenderedDOMComponentsWithTag(inst, 'hr');
    expect(hrs.length).toBe(2);
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
  });
});

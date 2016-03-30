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

describe('ReactTestUtils', function() {

  beforeEach(function() {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMServer = require('ReactDOMServer');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should have shallow rendering', function() {
    var SomeComponent = React.createClass({
      render: function() {
        return (
          <div>
            <span className="child1" />
            <span className="child2" />
          </div>
        );
      },
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SomeComponent />);

    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />,
    ]);
  });

  it('should throw for invalid elements', function() {
    var SomeComponent = React.createClass({
      render: function() {
        return <div />;
      },
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    expect(() => shallowRenderer.render(SomeComponent)).toThrow(
      'ReactShallowRenderer render(): Invalid component element. Instead of ' +
      'passing a component class, make sure to instantiate it by passing it ' +
      'to React.createElement.'
    );
    expect(() => shallowRenderer.render(<div />)).toThrow(
      'ReactShallowRenderer render(): Shallow rendering works only with ' +
      'custom components, not primitives (div). Instead of calling ' +
      '`.render(el)` and inspecting the rendered output, look at `el.props` ' +
      'directly instead.'
    );
  });

  it('should have shallow unmounting', function() {
    var componentWillUnmount = jest.genMockFn();

    var SomeComponent = React.createClass({
      render: function() {
        return <div />;
      },
      componentWillUnmount,
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    shallowRenderer.render(<SomeComponent />);
    shallowRenderer.unmount();

    expect(componentWillUnmount).toBeCalled();
  });

  it('can shallow render to null', function() {
    var SomeComponent = React.createClass({
      render: function() {
        return null;
      },
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SomeComponent />);

    expect(result).toBe(null);
  });

  it('can shallow render with a ref', function() {
    var SomeComponent = React.createClass({
      render: function() {
        return <div ref="hello" />;
      },
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    // Shouldn't crash.
    shallowRenderer.render(<SomeComponent />);
  });

  it('lets you update shallowly rendered components', function() {
    var SomeComponent = React.createClass({
      getInitialState: function() {
        return {clicked: false};
      },

      onClick: function() {
        this.setState({clicked: true});
      },

      render: function() {
        var className = this.state.clicked ? 'was-clicked' : '';

        if (this.props.aNew === 'prop') {
          return (
            <a
              href="#"
              onClick={this.onClick}
              className={className}>
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
      },
    });

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

  it('can access the mounted component instance', function() {
    var SimpleComponent = React.createClass({
      someMethod: function() {
        return this.props.n;
      },
      render: function() {
        return <div>{this.props.n}</div>;
      },
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    shallowRenderer.render(<SimpleComponent n={5} />);
    expect(shallowRenderer.getMountedInstance().someMethod()).toEqual(5);
  });

  it('can shallowly render components with contextTypes', function() {
    var SimpleComponent = React.createClass({
      contextTypes: {
        name: React.PropTypes.string,
      },
      render: function() {
        return <div />;
      },
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SimpleComponent />);
    expect(result).toEqual(<div />);
  });

  it('can shallowly render components with ref as function', function() {
    var SimpleComponent = React.createClass({
      getInitialState: function() {
        return {clicked: false};
      },
      handleUserClick: function() {
        this.setState({ clicked: true });
      },
      render: function() {
        return (
          <div
            ref={() => {}}
            onClick={this.handleUserClick}
            className={this.state.clicked ? 'clicked' : ''}
          />
        );
      },
    });

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

  it('can setState in componentWillMount when shallow rendering', function() {
    var SimpleComponent = React.createClass({
      componentWillMount() {
        this.setState({groovy: 'doovy'});
      },
      render() {
        return <div>{this.state.groovy}</div>;
      },
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SimpleComponent />);
    expect(result).toEqual(<div>doovy</div>);
  });

  it('can pass context when shallowly rendering', function() {
    var SimpleComponent = React.createClass({
      contextTypes: {
        name: React.PropTypes.string,
      },
      render: function() {
        return <div>{this.context.name}</div>;
      },
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SimpleComponent />, {
      name: 'foo',
    });
    expect(result).toEqual(<div>foo</div>);
  });

  it('can scryRenderedDOMComponentsWithClass with TextComponent', function() {
    var Wrapper = React.createClass({
      render: function() {
        return <div>Hello <span>Jim</span></div>;
      },
    });
    var renderedComponent = ReactTestUtils.renderIntoDocument(<Wrapper />);
    var scryResults = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'NonExistentClass'
    );
    expect(scryResults.length).toBe(0);
  });

  it('can scryRenderedDOMComponentsWithClass with className contains \\n', function() {
    var Wrapper = React.createClass({
      render: function() {
        return <div>Hello <span className={'x\ny'}>Jim</span></div>;
      },
    });
    var renderedComponent = ReactTestUtils.renderIntoDocument(<Wrapper />);
    var scryResults = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x'
    );
    expect(scryResults.length).toBe(1);
  });

  it('can scryRenderedDOMComponentsWithClass with multiple classes', function() {
    var Wrapper = React.createClass({
      render: function() {
        return <div>Hello <span className={'x y z'}>Jim</span></div>;
      },
    });
    var renderedComponent = ReactTestUtils.renderIntoDocument(<Wrapper />);
    var scryResults1 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x y'
    );
    expect(scryResults1.length).toBe(1);

    var scryResults2 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x z'
    );
    expect(scryResults2.length).toBe(1);

    var scryResults3 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x', 'y']
    );
    expect(scryResults3.length).toBe(1);

    expect(scryResults1[0]).toBe(scryResults2[0]);
    expect(scryResults1[0]).toBe(scryResults3[0]);

    var scryResults4 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x', 'a']
    );
    expect(scryResults4.length).toBe(0);

    var scryResults5 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x a']
    );
    expect(scryResults5.length).toBe(0);
  });

  it('traverses children in the correct order', function() {
    var Wrapper = React.createClass({
      render: function() {
        return <div>{this.props.children}</div>;
      },
    });

    var container = document.createElement('div');
    ReactDOM.render(
      <Wrapper>
        {null}
        <div>purple</div>
      </Wrapper>,
      container
    );
    var tree = ReactDOM.render(
      <Wrapper>
        <div>orange</div>
        <div>purple</div>
      </Wrapper>,
      container
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

  it('should support injected wrapper components as DOM components', function() {
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
        React.createElement(type)
      );
      expect(testComponent.tagName).toBe(type.toUpperCase());
      expect(ReactTestUtils.isDOMComponent(testComponent)).toBe(true);
    });

    // Full-page components (html, head, body) can't be rendered into a div
    // directly...
    var Root = React.createClass({
      render: function() {
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
      },
    });

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

  it('should change the value of an input field', function() {
    var obj = {
      handler: function(e) {
        e.persist();
      },
    };
    spyOn(obj, 'handler').andCallThrough();
    var container = document.createElement('div');
    var instance = ReactDOM.render(<input type="text" onChange={obj.handler} />, container);

    var node = ReactDOM.findDOMNode(instance);
    node.value = 'giraffe';
    ReactTestUtils.Simulate.change(node);

    expect(obj.handler).toHaveBeenCalledWith(jasmine.objectContaining({target: node}));
  });

  it('should change the value of an input field in a component', function() {
    var SomeComponent = React.createClass({
      render: function() {
        return (
          <div>
            <input type="text" ref="input" onChange={this.props.handleChange} />
          </div>
        );
      },
    });

    var obj = {
      handler: function(e) {
        e.persist();
      },
    };
    spyOn(obj, 'handler').andCallThrough();
    var container = document.createElement('div');
    var instance = ReactDOM.render(<SomeComponent handleChange={obj.handler} />, container);

    var node = ReactDOM.findDOMNode(instance.refs.input);
    node.value = 'zebra';
    ReactTestUtils.Simulate.change(node);

    expect(obj.handler).toHaveBeenCalledWith(jasmine.objectContaining({target: node}));
  });

  it('should throw when attempting to use ReactTestUtils.Simulate with shallow rendering', function() {
    var SomeComponent = React.createClass({
      render: function() {
        return (
          <div onClick={this.props.handleClick}>
            hello, world.
          </div>
        );
      },
    });
    var handler = jasmine.createSpy('spy');
    var shallowRenderer = ReactTestUtils.createRenderer();
    var result = shallowRenderer.render(<SomeComponent handleClick={handler} />);

    expect(() => ReactTestUtils.Simulate.click(result)).toThrow(
      'TestUtils.Simulate expects a component instance and not a ReactElement.' +
      'TestUtils.Simulate will not work if you are using shallow rendering.'
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('should not warn when simulating events with extra properties', function() {
    spyOn(console, 'error');

    var CLIENT_X = 100;

    var Component = React.createClass({
      handleClick: function(e) {
        expect(e.clientX).toBe(CLIENT_X);
      },
      render: function() {
        return <div onClick={this.handleClick} />;
      },
    });

    var element = document.createElement('div');
    var instance = ReactDOM.render(<Component />, element);
    ReactTestUtils.Simulate.click(
      ReactDOM.findDOMNode(instance),
      {clientX: CLIENT_X}
    );
    expect(console.error.calls.length).toBe(0);
  });

  it('can scry with stateless components involved', function() {
    var Stateless = () => <div><hr /></div>;
    var SomeComponent = React.createClass({
      render: function() {
        return (
          <div>
            <Stateless />
            <hr />
          </div>
        );
      },
    });

    var inst = ReactTestUtils.renderIntoDocument(<SomeComponent />);
    var hrs = ReactTestUtils.scryRenderedDOMComponentsWithTag(inst, 'hr');
    expect(hrs.length).toBe(2);
  });

});

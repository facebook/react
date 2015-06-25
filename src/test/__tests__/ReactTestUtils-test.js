/**
 * Copyright 2013-2015, Facebook, Inc.
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
var ReactTestUtils;

var mocks;

describe('ReactTestUtils', function() {

  beforeEach(function() {
    mocks = require('mocks');

    React = require('React');
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
      }
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    shallowRenderer.render(<SomeComponent />);

    var result = shallowRenderer.getRenderOutput();

    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />
    ]);
  });

  it('should have shallow unmounting', function() {
    var componentWillUnmount = mocks.getMockFunction();

    var SomeComponent = React.createClass({
      render: function() {
        return <div />;
      },
      componentWillUnmount
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
      }
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    shallowRenderer.render(<SomeComponent />);

    var result = shallowRenderer.getRenderOutput();

    expect(result).toBe(null);
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
      }
    });

    var shallowRenderer = ReactTestUtils.createRenderer();
    shallowRenderer.render(<SomeComponent />);
    var result = shallowRenderer.getRenderOutput();
    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />
    ]);

    shallowRenderer.render(<SomeComponent aNew="prop" />);
    var updatedResult = shallowRenderer.getRenderOutput();
    expect(updatedResult.type).toBe('a');

    var mockEvent = {};
    updatedResult.props.onClick(mockEvent);

    var updatedResultCausedByClick = shallowRenderer.getRenderOutput();
    expect(updatedResultCausedByClick.type).toBe('a');
    expect(updatedResultCausedByClick.props.className).toBe('was-clicked');
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
    shallowRenderer.render(<SimpleComponent />);
    var result = shallowRenderer.getRenderOutput();
    expect(result).toEqual(<div />);
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
    shallowRenderer.render(<SimpleComponent />, {
        name: "foo",
    });
    var result = shallowRenderer.getRenderOutput();
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

  it('traverses children in the correct order', function() {
    var Wrapper = React.createClass({
      render: function() {
        return <div>{this.props.children}</div>;
      },
    });

    var container = document.createElement('div');
    React.render(
      <Wrapper>
        {null}
        <div>purple</div>
      </Wrapper>,
      container
    );
    var tree = React.render(
      <Wrapper>
        <div>orange</div>
        <div>purple</div>
      </Wrapper>,
      container
    );

    var log = [];
    ReactTestUtils.findAllInRenderedTree(tree, function(child) {
      if (ReactTestUtils.isDOMComponent(child)) {
        log.push(React.findDOMNode(child).textContent);
      }
    });

    // Should be document order, not mount order (which would be purple, orange)
    expect(log).toEqual(['orangepurple', 'orange', 'purple']);
  });

  it('does not warn for getDOMNode on ES6 classes', function() {
    var Foo = React.createClass({
      render: function() {
        return <div />;
      }
    });

    class Bar extends React.Component {
      render() {
        return <div />;
      }
    }

    spyOn(console, 'error');

    var foo = ReactTestUtils.renderIntoDocument(<Foo />);
    expect(ReactTestUtils.isDOMComponent(foo)).toBe(false);

    var bar = ReactTestUtils.renderIntoDocument(<Bar />);
    expect(ReactTestUtils.isDOMComponent(bar)).toBe(false);

    var div = ReactTestUtils.renderIntoDocument(<div />);
    expect(ReactTestUtils.isDOMComponent(div)).toBe(true);

    expect(console.error.calls.length).toBe(0);
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
      'textarea'
    ];

    injectedDOMComponents.forEach(function(type) {
      var component = ReactTestUtils.renderIntoDocument(
        React.createElement(type)
      );
      expect(component.tagName).toBe(type.toUpperCase());
      expect(ReactTestUtils.isDOMComponent(component)).toBe(true);
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
      }
    });

    var markup = React.renderToString(<Root />);
    var testDocument = getTestDocument(markup);
    var component = React.render(<Root />, testDocument);

    expect(component.refs.html.tagName).toBe('HTML');
    expect(component.refs.head.tagName).toBe('HEAD');
    expect(component.refs.body.tagName).toBe('BODY');
    expect(ReactTestUtils.isDOMComponent(component.refs.html)).toBe(true);
    expect(ReactTestUtils.isDOMComponent(component.refs.head)).toBe(true);
    expect(ReactTestUtils.isDOMComponent(component.refs.body)).toBe(true);
  });
});

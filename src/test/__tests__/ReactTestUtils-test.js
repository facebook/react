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
var warn;

describe('ReactTestUtils', function() {

  beforeEach(function() {
    mocks = require('mocks');

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    warn = console.warn;
    console.warn = mocks.getMockFunction();
  });

  afterEach(function() {
    console.warn = warn;
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
    shallowRenderer.render(<SomeComponent />, {});

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
    shallowRenderer.render(<SomeComponent />, {});
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
    shallowRenderer.render(<SomeComponent />, {});

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
    shallowRenderer.render(<SomeComponent />, {});
    var result = shallowRenderer.getRenderOutput();
    expect(result.type).toBe('div');
    expect(result.props.children).toEqual([
      <span className="child1" />,
      <span className="child2" />
    ]);

    shallowRenderer.render(<SomeComponent aNew="prop" />, {});
    var updatedResult = shallowRenderer.getRenderOutput();
    expect(updatedResult.type).toBe('a');

    var mockEvent = {};
    updatedResult.props.onClick(mockEvent);

    var updatedResultCausedByClick = shallowRenderer.getRenderOutput();
    expect(updatedResultCausedByClick.type).toBe('a');
    expect(updatedResultCausedByClick.props.className).toBe('was-clicked');
  });

  it('Test scryRenderedDOMComponentsWithClass with TextComponent', function() {
    var renderedComponent = ReactTestUtils.renderIntoDocument(<div>Hello <span>Jim</span></div>);
    var scryResults = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'NonExistantClass'
    );
    expect(scryResults.length).toBe(0);

  });

  it('traverses children in the correct order', function() {
    var container = document.createElement('div');

    React.render(
      <div>
        {null}
        <div>purple</div>
      </div>,
      container
    );
    var tree = React.render(
      <div>
        <div>orange</div>
        <div>purple</div>
      </div>,
      container
    );

    var log = [];
    ReactTestUtils.findAllInRenderedTree(tree, function(child) {
      log.push(child.getDOMNode().textContent);
    });

    // Should be document order, not mount order (which would be purple, orange)
    expect(log).toEqual(['orangepurple', 'orange', 'purple']);
  });
});

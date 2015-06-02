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
var StatelessComponent;

describe('ReactStatelessComponent', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');

    StatelessComponent = function StatelessComponent(props) {
      return <div>{props.name}</div>;
    }
  });

  it('should render stateless component', function() {
    var comp = ReactTestUtils.renderIntoDocument(
      <StatelessComponent name="A" />
    );

    expect(React.findDOMNode(comp).textContent).toBe('A');
  });

  it('should update stateless component', function() {
    var Parent = React.createClass({
      render() {
        return <StatelessComponent {...this.props} />;
      }
    });

    var comp = ReactTestUtils.renderIntoDocument(<Parent name="A" />);
    expect(React.findDOMNode(comp).textContent).toBe('A');

    comp.setProps({name: 'B'});
    expect(React.findDOMNode(comp).textContent).toBe('B');
  });

  it('should unmount stateless component', function() {
    var container = document.createElement('div');

    React.render(<StatelessComponent name="A" />, container);
    expect(container.textContent).toBe('A');

    React.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('should pass context thru stateless component', function() {
    var Child = React.createClass({
      contextTypes: {
        test: React.PropTypes.string.isRequired
      },

      render: function() {
        return <div>{this.context.test}</div>;
      }
    });

    function Parent() {
      return <Child />;
    }
    // var Parent = React.createClass({
    //   render: function() {
    //     return <Child />;
    //   }
    // });

    var GrandParent = React.createClass({
      childContextTypes: {
        test: React.PropTypes.string.isRequired
      },

      getChildContext() {
        return {test: this.props.test};
      },

      render: function() {
        return <Parent />;
      }
    });

    var comp = ReactTestUtils.renderIntoDocument(
      <GrandParent test="test" />
    );

    expect(React.findDOMNode(comp).textContent).toBe('test');

    comp.setProps({test: 'mest'});

    expect(React.findDOMNode(comp).textContent).toBe('mest');
  });

});

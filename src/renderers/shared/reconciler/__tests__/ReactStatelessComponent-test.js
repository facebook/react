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

function StatelessComponent(props) {
  return <div>{props.name}</div>;
}

describe('ReactStatelessComponent', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should render stateless component', function() {
    var el = document.createElement('div');
    React.render(<StatelessComponent name="A" />, el);

    expect(el.textContent).toBe('A');
  });

  it('should update stateless component', function() {
    var Parent = React.createClass({
      render() {
        return <StatelessComponent {...this.props} />;
      },
    });

    var el = document.createElement('div');
    React.render(<Parent name="A" />, el);
    expect(el.textContent).toBe('A');

    React.render(<Parent name="B" />, el);
    expect(el.textContent).toBe('B');
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
        test: React.PropTypes.string.isRequired,
      },

      render: function() {
        return <div>{this.context.test}</div>;
      },
    });

    function Parent() {
      return <Child />;
    }

    var GrandParent = React.createClass({
      childContextTypes: {
        test: React.PropTypes.string.isRequired,
      },

      getChildContext() {
        return {test: this.props.test};
      },

      render: function() {
        return <Parent />;
      },
    });

    var el = document.createElement('div');
    React.render(<GrandParent test="test" />, el);

    expect(el.textContent).toBe('test');

    React.render(<GrandParent test="mest" />, el);

    expect(el.textContent).toBe('mest');
  });

  it('should support module pattern components', function() {
    function Child({test}) {
      return {
        render() {
          return <div>{test}</div>;
        },
      };
    }

    var el = document.createElement('div');
    React.render(<Child test="test" />, el);

    expect(el.textContent).toBe('test');
  });

  it('should throw on string refs in pure functions', function() {
    function Child() {
      return <div ref="me" />;
    }

    expect(function() {
      ReactTestUtils.renderIntoDocument(<Child test="test" />);
    }).toThrow(
      'Invariant Violation: Stateless function components cannot have refs.'
    );
  });

  it('should provide a null ref', function() {
    function Child() {
      return <div />;
    }

    var comp = ReactTestUtils.renderIntoDocument(<Child />);
    expect(comp).toBe(null);
  });

  it('should use correct name in key warning', function() {
    function Child() {
      return <div>{[<span />]}</div>;
    }

    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(<Child />);
    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain('a unique "key" prop');
    expect(console.error.argsForCall[0][0]).toContain('Child');
  });

  it('should support default props and prop types', function() {
    function Child(props) {
      return <div>{props.test}</div>;
    }
    Child.defaultProps = {test: 2};
    Child.propTypes = {test: React.PropTypes.string};

    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(<Child />);
    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: Failed propType: Invalid prop `test` of type `number` ' +
      'supplied to `Child`, expected `string`.'
    );
  });

  it('should receive context', function() {
    var Parent = React.createClass({
      childContextTypes: {
        lang: React.PropTypes.string,
      },
      getChildContext: function() {
        return {lang: 'en'};
      },
      render: function() {
        return <Child />;
      },
    });
    function Child(props, context) {
      return <div>{context.lang}</div>;
    }
    Child.contextTypes = {lang: React.PropTypes.string};

    var el = document.createElement('div');
    React.render(<Parent />, el);
    expect(el.textContent).toBe('en');
  });
});

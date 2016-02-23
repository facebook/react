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

let React;
let ReactDOM;
let ReactFragment;
let ReactTestUtils;

describe('ReactIdentity', function() {

  beforeEach(function() {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactFragment = require('ReactFragment');
    ReactTestUtils = require('ReactTestUtils');
  });

  function frag(obj) {
    return ReactFragment.create(obj);
  }

  it('should allow key property to express identity', function() {
    let node;
    const Component = (props) =>
      <div ref={(c) => node = c}>
        <div key={props.swap ? 'banana' : 'apple'} />
        <div key={props.swap ? 'apple' : 'banana'} />
      </div>;

    const container = document.createElement('div');
    ReactDOM.render(<Component />, container);
    const origChildren = Array.from(node.childNodes);
    ReactDOM.render(<Component swap={true} />, container);
    const newChildren = Array.from(node.childNodes);
    expect(origChildren[0]).toBe(newChildren[1]);
    expect(origChildren[1]).toBe(newChildren[0]);
  });

  it('should use composite identity', function() {

    const Wrapper = React.createClass({
      render: function() {
        return <a>{this.props.children}</a>;
      },
    });

    const container = document.createElement('div');
    let node1;
    let node2;
    ReactDOM.render(
      <Wrapper key="wrap1"><span ref={(c) => node1 = c} /></Wrapper>,
      container
    );
    ReactDOM.render(
      <Wrapper key="wrap2"><span ref={(c) => node2 = c} /></Wrapper>,
      container
    );

    expect(node1).not.toBe(node2);
  });

  function renderAComponentWithKeyIntoContainer(key, container) {

    const Wrapper = React.createClass({

      render: function() {
        const s1 = <span ref="span1" key={key} />;
        const s2 = <span ref="span2" />;

        const map = {};
        map[key] = s2;
        return <div>{[s1, frag(map)]}</div>;
      },

    });

    const instance = ReactDOM.render(<Wrapper />, container);
    const span1 = instance.refs.span1;
    const span2 = instance.refs.span2;

    expect(ReactDOM.findDOMNode(span1)).not.toBe(null);
    expect(ReactDOM.findDOMNode(span2)).not.toBe(null);
  }

  it('should allow any character as a key, in a detached parent', function() {
    const detachedContainer = document.createElement('div');
    renderAComponentWithKeyIntoContainer(
      "<'WEIRD/&\\key'>",
      detachedContainer
    );
  });

  it('should allow any character as a key, in an attached parent', function() {
    // This test exists to protect against implementation details that
    // incorrectly query escaped IDs using DOM tools like getElementById.
    const attachedContainer = document.createElement('div');
    document.body.appendChild(attachedContainer);

    renderAComponentWithKeyIntoContainer(
      "<'WEIRD/&\\key'>",
      attachedContainer
    );

    document.body.removeChild(attachedContainer);
  });

  it('should not allow scripts in keys to execute', function() {
    const h4x0rKey =
      '"><script>window[\'YOUVEBEENH4X0RED\']=true;</script><div id="';

    const attachedContainer = document.createElement('div');
    document.body.appendChild(attachedContainer);

    renderAComponentWithKeyIntoContainer(h4x0rKey, attachedContainer);

    document.body.removeChild(attachedContainer);

    // If we get this far, make sure we haven't executed the code
    expect(window.YOUVEBEENH4X0RED).toBe(undefined);
  });

  it('should let restructured components retain their uniqueness', function() {
    const instance0 = <span />;
    const instance1 = <span />;
    const instance2 = <span />;

    const TestComponent = React.createClass({
      render: function() {
        return (
          <div>
            {instance2}
            {this.props.children[0]}
            {this.props.children[1]}
          </div>
        );
      },
    });

    const TestContainer = React.createClass({

      render: function() {
        return <TestComponent>{instance0}{instance1}</TestComponent>;
      },

    });

    expect(function() {

      ReactTestUtils.renderIntoDocument(<TestContainer />);

    }).not.toThrow();
  });

  it('should let nested restructures retain their uniqueness', function() {
    const instance0 = <span />;
    const instance1 = <span />;
    const instance2 = <span />;

    const TestComponent = React.createClass({
      render: function() {
        return (
          <div>
            {instance2}
            {this.props.children[0]}
            {this.props.children[1]}
          </div>
        );
      },
    });

    const TestContainer = React.createClass({

      render: function() {
        return (
          <div>
            <TestComponent>{instance0}{instance1}</TestComponent>
          </div>
        );
      },

    });

    expect(function() {

      ReactTestUtils.renderIntoDocument(<TestContainer />);

    }).not.toThrow();
  });

  it('should let text nodes retain their uniqueness', function() {
    const TestComponent = React.createClass({
      render: function() {
        return <div>{this.props.children}<span /></div>;
      },
    });

    const TestContainer = React.createClass({

      render: function() {
        return (
          <TestComponent>
            <div />
            {'second'}
          </TestComponent>
        );
      },

    });

    expect(function() {

      ReactTestUtils.renderIntoDocument(<TestContainer />);

    }).not.toThrow();
  });

  it('should retain key during updates in composite components', function() {

    const TestComponent = React.createClass({
      render: function() {
        return <div>{this.props.children}</div>;
      },
    });

    const TestContainer = React.createClass({

      getInitialState: function() {
        return {swapped: false};
      },

      swap: function() {
        this.setState({swapped: true});
      },

      render: function() {
        return (
          <TestComponent>
            {this.state.swapped ? this.props.second : this.props.first}
            {this.state.swapped ? this.props.first : this.props.second}
          </TestComponent>
        );
      },

    });

    const instance0 = <span key="A" />;
    const instance1 = <span key="B" />;

    let wrapped = <TestContainer first={instance0} second={instance1} />;

    wrapped = ReactDOM.render(wrapped, document.createElement('div'));
    const div = ReactDOM.findDOMNode(wrapped);

    const beforeA = div.childNodes[0];
    const beforeB = div.childNodes[1];
    wrapped.swap();
    const afterA = div.childNodes[1];
    const afterB = div.childNodes[0];

    expect(beforeA).toBe(afterA);
    expect(beforeB).toBe(afterB);

  });

  it('should not allow implicit and explicit keys to collide', function() {
    const component =
      <div>
        <span />
        <span key="0" />
      </div>;

    expect(function() {
      ReactTestUtils.renderIntoDocument(component);
    }).not.toThrow();
  });


});

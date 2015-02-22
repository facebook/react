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
var ReactFragment;
var ReactTestUtils;
var reactComponentExpect;
var ReactMount;

describe('ReactIdentity', function() {

  beforeEach(function() {
    require('mock-modules').dumpCache();
    React = require('React');
    ReactFragment = require('ReactFragment');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');
    ReactMount = require('ReactMount');
  });

  var idExp = /^\.[^.]+(.*)$/;
  function checkId(child, expectedId) {
    var actual = idExp.exec(ReactMount.getID(child));
    var expected = idExp.exec(expectedId);
    expect(actual).toBeTruthy();
    expect(expected).toBeTruthy();
    expect(actual[1]).toEqual(expected[1]);
  }

  function frag(obj) {
    return ReactFragment.create(obj);
  }

  it('should allow keyed objects to express identity', function() {
    var instance =
      <div>
        {frag({
          first: <div />,
          second: <div />
        })}
      </div>;

    instance = React.render(instance, document.createElement('div'));
    var node = instance.getDOMNode();
    reactComponentExpect(instance).toBeDOMComponentWithChildCount(2);
    checkId(node.childNodes[0], '.0.$first:0');
    checkId(node.childNodes[1], '.0.$second:0');
  });

  it('should allow key property to express identity', function() {
    var instance =
      <div>
        <div key="apple" />
        <div key="banana" />
        <div key={0} />
        <div key={123} />
      </div>;

    instance = React.render(instance, document.createElement('div'));
    var node = instance.getDOMNode();
    reactComponentExpect(instance).toBeDOMComponentWithChildCount(4);
    checkId(node.childNodes[0], '.0.$apple');
    checkId(node.childNodes[1], '.0.$banana');
    checkId(node.childNodes[2], '.0.$0');
    checkId(node.childNodes[3], '.0.$123');
  });

  it('should use instance identity', function() {

    var Wrapper = React.createClass({
      render: function() {
        return <a key="i_get_overwritten">{this.props.children}</a>;
      }
    });

    var instance =
      <div>
        <Wrapper key="wrap1"><span key="squirrel" /></Wrapper>
        <Wrapper key="wrap2"><span key="bunny" /></Wrapper>
        <Wrapper><span key="chipmunk" /></Wrapper>
      </div>;

    instance = React.render(instance, document.createElement('div'));
    var node = instance.getDOMNode();
    reactComponentExpect(instance).toBeDOMComponentWithChildCount(3);

    checkId(node.childNodes[0], '.0.$wrap1');
    checkId(node.childNodes[0].firstChild, '.0.$wrap1.$squirrel');
    checkId(node.childNodes[1], '.0.$wrap2');
    checkId(node.childNodes[1].firstChild, '.0.$wrap2.$bunny');
    checkId(node.childNodes[2], '.0.2');
    checkId(node.childNodes[2].firstChild, '.0.2.$chipmunk');
  });

  function renderAComponentWithKeyIntoContainer(key, container) {

    var Wrapper = React.createClass({

      render: function() {
        var span1 = <span ref="span1" key={key} />;
        var span2 = <span ref="span2" />;

        var map = {};
        map[key] = span2;
        return <div>{[span1, frag(map)]}</div>;
      }

    });

    var instance = React.render(<Wrapper />, container);
    var span1 = instance.refs.span1;
    var span2 = instance.refs.span2;

    expect(span1.getDOMNode()).not.toBe(null);
    expect(span2.getDOMNode()).not.toBe(null);

    key = key.replace(/=/g, '=0');

    checkId(span1.getDOMNode(), '.0.$' + key);
    checkId(span2.getDOMNode(), '.0.1:$' + key + ':0');
  }

  it('should allow any character as a key, in a detached parent', function() {
    var detachedContainer = document.createElement('div');
    renderAComponentWithKeyIntoContainer("<'WEIRD/&\\key'>", detachedContainer);
  });

  it('should allow any character as a key, in an attached parent', function() {
    // This test exists to protect against implementation details that
    // incorrectly query escaped IDs using DOM tools like getElementById.
    var attachedContainer = document.createElement('div');
    document.body.appendChild(attachedContainer);

    renderAComponentWithKeyIntoContainer("<'WEIRD/&\\key'>", attachedContainer);

    document.body.removeChild(attachedContainer);
  });

  it('should not allow scripts in keys to execute', function() {
    var h4x0rKey =
      '"><script>window[\'YOUVEBEENH4X0RED\']=true;</script><div id="';

    var attachedContainer = document.createElement('div');
    document.body.appendChild(attachedContainer);

    renderAComponentWithKeyIntoContainer(h4x0rKey, attachedContainer);

    document.body.removeChild(attachedContainer);

    // If we get this far, make sure we haven't executed the code
    expect(window.YOUVEBEENH4X0RED).toBe(undefined);
  });

  it('should let restructured components retain their uniqueness', function() {
    var instance0 = <span />;
    var instance1 = <span />;
    var instance2 = <span />;

    var TestComponent = React.createClass({
      render: function() {
        return (
          <div>
            {instance2}
            {this.props.children[0]}
            {this.props.children[1]}
          </div>
        );
      }
    });

    var TestContainer = React.createClass({

      render: function() {
        return <TestComponent>{instance0}{instance1}</TestComponent>;
      }

    });

    expect(function() {

      ReactTestUtils.renderIntoDocument(<TestContainer />);

    }).not.toThrow();
  });

  it('should let nested restructures retain their uniqueness', function() {
    var instance0 = <span />;
    var instance1 = <span />;
    var instance2 = <span />;

    var TestComponent = React.createClass({
      render: function() {
        return (
          <div>
            {instance2}
            {this.props.children[0]}
            {this.props.children[1]}
          </div>
        );
      }
    });

    var TestContainer = React.createClass({

      render: function() {
        return (
          <div>
            <TestComponent>{instance0}{instance1}</TestComponent>
          </div>
        );
      }

    });

    expect(function() {

      ReactTestUtils.renderIntoDocument(<TestContainer />);

    }).not.toThrow();
  });

  it('should let text nodes retain their uniqueness', function() {
    var TestComponent = React.createClass({
      render: function() {
        return <div>{this.props.children}<span /></div>;
      }
    });

    var TestContainer = React.createClass({

      render: function() {
        return (
          <TestComponent>
            <div />
            {'second'}
          </TestComponent>
        );
      }

    });

    expect(function() {

      ReactTestUtils.renderIntoDocument(<TestContainer />);

    }).not.toThrow();
  });

  it('should retain key during updates in composite components', function() {

    var TestComponent = React.createClass({
      render: function() {
        return <div>{this.props.children}</div>;
      }
    });

    var TestContainer = React.createClass({

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
      }

    });

    var instance0 = <span key="A" />;
    var instance1 = <span key="B" />;

    var wrapped = <TestContainer first={instance0} second={instance1} />;

    wrapped = React.render(wrapped, document.createElement('div'));

    var beforeID = ReactMount.getID(wrapped.getDOMNode().firstChild);

    wrapped.swap();

    var afterID = ReactMount.getID(wrapped.getDOMNode().firstChild);

    expect(beforeID).not.toEqual(afterID);

  });

  it('should not allow implicit and explicit keys to collide', function() {
    var component =
      <div>
        <span />
        <span key="0" />
      </div>;

    expect(function() {
      ReactTestUtils.renderIntoDocument(component);
    }).not.toThrow();
  });


});

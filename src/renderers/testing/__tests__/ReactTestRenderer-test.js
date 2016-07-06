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

var React = require('React');
var ReactTestRenderer = require('ReactTestRenderer');

describe('ReactTestRenderer', function() {

  it('renders a simple component', function() {
    function Link() {
      return <a role="link" />;
    }
    var renderer = ReactTestRenderer.create(<Link />);
    expect(renderer.toJSON()).toEqual({
      type: 'a',
      props: { role: 'link' },
      children: null,
    });
  });

  it('exposes a type flag', function() {
    function Link() {
      return <a role="link" />;
    }
    var renderer = ReactTestRenderer.create(<Link />);
    var object = renderer.toJSON();
    expect(object.$$typeof).toBe(Symbol.for('react.test.json'));

    // $$typeof should not be enumerable.
    for (var key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        expect(key).not.toBe('$$typeof');
      }
    }
  });

  it('renders some basics with an update', function() {
    var renders = 0;
    var Component = React.createClass({
      getInitialState: function() {
        return {x: 3};
      },
      render: function() {
        renders++;
        return (
          <div className="purple">
            {this.state.x}
            <Child />
            <Null />
          </div>
        );
      },
      componentDidMount: function() {
        this.setState({x: 7});
      },
    });

    var Child = () => (renders++, <moo />);
    var Null = () => (renders++, null);

    var renderer = ReactTestRenderer.create(<Component />);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: { className: 'purple' },
      children: [
        7,
        { type: 'moo', props: {}, children: null },
      ],
    });
    expect(renders).toBe(6);
  });

  it('exposes the instance', function() {
    class Mouse extends React.Component {
      constructor() {
        super();
        this.state = {mouse: 'mouse'};
      }
      handleMoose() {
        this.setState({mouse: 'moose'});
      }
      render() {
        return <div>{this.state.mouse}</div>;
      }
    }
    var renderer = ReactTestRenderer.create(<Mouse />);

    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['mouse'],
    });

    var mouse = renderer.getInstance();
    mouse.handleMoose();
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['moose'],
    });
  });

});

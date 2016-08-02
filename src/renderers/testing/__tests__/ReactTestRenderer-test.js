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

    class Component extends React.Component {
      state = {x: 3};

      render() {
        renders++;
        return (
          <div className="purple">
            {this.state.x}
            <Child />
            <Null />
          </div>
        );
      }

      componentDidMount() {
        this.setState({x: 7});
      }
    }

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

  it('updates types', function() {
    var renderer = ReactTestRenderer.create(<div>mouse</div>);
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['mouse'],
    });

    renderer.update(<span>mice</span>);
    expect(renderer.toJSON()).toEqual({
      type: 'span',
      props: {},
      children: ['mice'],
    });
  });

  it('updates children', function() {
    var renderer = ReactTestRenderer.create(
      <div>
        <span key="a">A</span>
        <span key="b">B</span>
        <span key="c">C</span>
      </div>
    );
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: [
        {type: 'span', props: {}, children: ['A']},
        {type: 'span', props: {}, children: ['B']},
        {type: 'span', props: {}, children: ['C']},
      ],
    });

    renderer.update(
      <div>
        <span key="d">D</span>
        <span key="c">C</span>
        <span key="b">B</span>
      </div>
    );
    expect(renderer.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: [
        {type: 'span', props: {}, children: ['D']},
        {type: 'span', props: {}, children: ['C']},
        {type: 'span', props: {}, children: ['B']},
      ],
    });
  });

  it('does the full lifecycle', function() {
    var log = [];
    class Log extends React.Component {
      render() {
        log.push('render ' + this.props.name);
        return <div />;
      }
      componentDidMount() {
        log.push('mount ' + this.props.name);
      }
      componentWillUnmount() {
        log.push('unmount ' + this.props.name);
      }
    }

    var renderer = ReactTestRenderer.create(<Log key="foo" name="Foo" />);
    renderer.update(<Log key="bar" name="Bar" />);
    renderer.unmount();

    expect(log).toEqual([
      'render Foo',
      'mount Foo',
      'unmount Foo',
      'render Bar',
      'mount Bar',
      'unmount Bar',
    ]);
  });

  it('gives a ref to native components', function() {
    var log = [];
    ReactTestRenderer.create(<div ref={(r) => log.push(r)} />);
    expect(log).toEqual([null]);
  });

  describe('selectors API', function() {
    it('finds one element by name', function() {
      class Component extends React.Component {
        render() {
          return (
            <div>
              <div>one element</div>
              <myelement id={1} />
              <span>
                <div>
                  <myelement id={2}/>
                </div>
              </span>
            </div>
          );
        }
      }

      var renderer = ReactTestRenderer.create(<Component />);

      var myelement = renderer.find('myelement');
      expect(myelement.getProps().id).toEqual(1);
    });

    it('concatenates finders', function() {
      class Component extends React.Component {
        render() {
          return (
            <div>
              <div>one element</div>
              <myelement id={1} />
              <span>
                <div>
                  <myelement id={2}/>
                </div>
              </span>
            </div>
          );
        }
      }

      var renderer = ReactTestRenderer.create(<Component />);

      var myelement = renderer.find('span').find('myelement');
      expect(myelement.getProps().id).toEqual(2);
    });

    it('finds all elements by name', function() {
      class Component extends React.Component {
        render() {
          return (
            <div>
              <div>one element</div>
              <myelement id={1} />
              <span>
                <div>
                  <myelement id={2}/>
                </div>
              </span>
            </div>
          );
        }
      }

      var renderer = ReactTestRenderer.create(<Component />);

      var myelements = renderer.findAll('myelement');
      expect(myelements.length).toBe(2);
      expect(myelements[0].getProps().id).toBe(1);
      expect(myelements[1].getProps().id).toBe(2);
    });

    it('finds an element by props', function() {
      class Component extends React.Component {
        render() {
          return (
            <div>
              <div>one element</div>
              <myelement className={'found'} id={1} />
              <span>
                <div>
                  <myelement className={'found'} id={2} another={true} />
                </div>
              </span>
            </div>
          );
        }
      }

      var renderer = ReactTestRenderer.create(<Component />);

      var myelement = renderer.findByProps({
        className: 'found',
        id: 2,
      });
      expect(myelement.getProps()).toEqual({
        className: 'found',
        id: 2,
        another: true,
      });
    });

    it('can use finders to trigger events', function() {
      class Component extends React.Component {
        constructor() {
          super();
          this.state = { clicked: 0 };
        }

        render() {
          return (
            <div>
              <span>{this.state.clicked}</span>
              <myelement onClick={this._onClick}/>
            </div>
          );
        }
        _onClick = () => {
          this.setState({clicked: 1});
        }
      }

      var renderer = ReactTestRenderer.create(<Component />);

      expect(renderer.find('span').getChildren()[0].toJSON()).toEqual(0);

      renderer.find('myelement').getProps().onClick();
      expect(renderer.find('span').getChildren()[0].toJSON()).toEqual(1);
    });
  });
});

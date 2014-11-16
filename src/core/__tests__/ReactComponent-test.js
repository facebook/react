/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

var React;
var ReactInstanceMap;
var ReactTestUtils;

var reactComponentExpect;
var getMountDepth;

describe('ReactComponent', function() {
  beforeEach(function() {
    React = require('React');
    ReactInstanceMap = require('ReactInstanceMap');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');

    getMountDepth = function(instance) {
      return ReactInstanceMap.get(instance)._mountDepth;
    };
  });

  it('should throw on invalid render targets', function() {
    var container = document.createElement('div');
    // jQuery objects are basically arrays; people often pass them in by mistake
    expect(function() {
      React.render(<div></div>, [container]);
    }).toThrow(
      'Invariant Violation: _registerComponent(...): Target container ' +
      'is not a DOM element.'
    );

    expect(function() {
      React.render(<div></div>, null);
    }).toThrow(
      'Invariant Violation: _registerComponent(...): Target container ' +
      'is not a DOM element.'
    );
  });

  it('should throw when supplying a ref outside of render method', function() {
    var instance = <div ref="badDiv" />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();
  });

  it('should support refs on owned components', function() {
    var innerObj = {}, outerObj = {};

    var Wrapper = React.createClass({

      getObject: function() {
        return this.props.object;
      },

      render: function() {
        return <div>{this.props.children}</div>;
      }

    });

    var Component = React.createClass({
      render: function() {
        var inner = <Wrapper object={innerObj} ref="inner" />;
        var outer = <Wrapper object={outerObj} ref="outer">{inner}</Wrapper>;
        return outer;
      },
      componentDidMount: function() {
        expect(this.refs.inner.getObject()).toEqual(innerObj);
        expect(this.refs.outer.getObject()).toEqual(outerObj);
      }
    });

    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
  });

  it('should not have refs on unmounted components', function() {
    var Parent = React.createClass({
      render: function() {
        return <Child><div ref="test" /></Child>;
      },
      componentDidMount: function() {
        expect(this.refs && this.refs.test).toEqual(undefined);
      }
    });
    var Child = React.createClass({
      render: function() {
        return <div />;
      }
    });

    var instance = <Parent child={<span />} />;
    instance = ReactTestUtils.renderIntoDocument(instance);
  });

  it('should support new-style refs', function() {
    var innerObj = {}, outerObj = {};

    var Wrapper = React.createClass({
      getObject: function() {
        return this.props.object;
      },
      render: function() {
        return <div>{this.props.children}</div>;
      }
    });

    var refsResolved = 0;
    var refsErrored = 0;
    var Component = React.createClass({
      componentWillMount: function() {
        this.innerRef = React.createRef();
        this.outerRef = React.createRef();
        this.unusedRef = React.createRef();
      },
      render: function() {
        var inner = <Wrapper object={innerObj} ref={this.innerRef} />;
        var outer = (
          <Wrapper object={outerObj} ref={this.outerRef}>
            {inner}
          </Wrapper>
        );
        return outer;
      },
      componentDidMount: function() {
        // TODO: Currently new refs aren't available on initial render
      },
      componentDidUpdate: function() {
        this.innerRef.then(function(inner) {
          expect(inner.getObject()).toEqual(innerObj);
          refsResolved++;
        });
        this.outerRef.then(function(outer) {
          expect(outer.getObject()).toEqual(outerObj);
          refsResolved++;
        });
        this.unusedRef.then(function() {
          throw new Error("Unused ref should not be resolved");
        }, function() {
          refsErrored++;
        });
        expect(refsResolved).toBe(0);
        expect(refsErrored).toBe(0);
      }
    });

    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    instance.forceUpdate();
    expect(refsResolved).toBe(2);
    expect(refsErrored).toBe(1);
  });

  it('should support new-style refs with mixed-up owners', function() {
    var Wrapper = React.createClass({
      render: function() {
        return this.props.getContent();
      }
    });

    var refsResolved = 0;
    var Component = React.createClass({
      componentWillMount: function() {
        this.wrapperRef = React.createRef();
        this.innerRef = React.createRef();
      },
      getInner: function() {
        // (With old-style refs, it's impossible to get a ref to this div
        // because Wrapper is the current owner when this function is called.)
        return <div title="inner" ref={this.innerRef} />;
      },
      render: function() {
        return (
          <Wrapper
            title="wrapper"
            ref={this.wrapperRef}
            getContent={this.getInner}
            />
        );
      },
      componentDidMount: function() {
        // TODO: Currently new refs aren't available on initial render
      },
      componentDidUpdate: function() {
        // Check .props.title to make sure we got the right elements back
        this.wrapperRef.then(function(wrapper) {
          expect(wrapper.props.title).toBe("wrapper");
          refsResolved++;
        });
        this.innerRef.then(function(inner) {
          expect(inner.props.title).toEqual("inner");
          refsResolved++;
        });
        expect(refsResolved).toBe(0);
      }
    });

    var instance = <Component />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    instance.forceUpdate();
    expect(refsResolved).toBe(2);
  });

  it('should correctly determine if a component is mounted', function() {
    var Component = React.createClass({
      componentWillMount: function() {
        expect(this.isMounted()).toBeFalsy();
      },
      componentDidMount: function() {
        expect(this.isMounted()).toBeTruthy();
      },
      render: function() {
        return <div/>;
      }
    });

    var element = <Component />;

    var instance = ReactTestUtils.renderIntoDocument(element);
    expect(instance.isMounted()).toBeTruthy();
  });

  it('should know its simple mount depth', function() {
    var Owner = React.createClass({
      render: function() {
        return <Child ref="child" />;
      }
    });

    var Child = React.createClass({
      render: function() {
        return <div />;
      }
    });

    var instance = <Owner />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(getMountDepth(instance)).toBe(0);
    expect(getMountDepth(instance.refs.child)).toBe(1);
  });

  it('should know its (complicated) mount depth', function() {
    var Box = React.createClass({
      render: function() {
        return <div ref="boxDiv">{this.props.children}</div>;
      }
    });

    var Child = React.createClass({
      render: function() {
        return <span ref="span">child</span>;
      }
    });

    var Switcher = React.createClass({
      getInitialState: function() {
        return {tabKey: 'hello'};
      },

      render: function() {
        var child = this.props.children;

        return (
          <Box ref="box">
            <div
              ref="switcherDiv"
              style={{
                display: this.state.tabKey === child.key ? '' : 'none'
              }}>
              {child}
            </div>
          </Box>
        );
      }
    });

    var App = React.createClass({
      render: function() {
        return (
          <Switcher ref="switcher">
            <Child key="hello" ref="child" />
          </Switcher>
        );
      }
    });

    var root = <App />;
    root = ReactTestUtils.renderIntoDocument(root);

    expect(getMountDepth(root)).toBe(0);
    expect(getMountDepth(root.refs.switcher)).toBe(1);
    expect(getMountDepth(root.refs.switcher.refs.box)).toBe(2);
    expect(getMountDepth(root.refs.switcher.refs.switcherDiv)).toBe(5);
    expect(getMountDepth(root.refs.child)).toBe(7);
    expect(getMountDepth(root.refs.switcher.refs.box.refs.boxDiv)).toBe(3);
    expect(getMountDepth(root.refs.child.refs.span)).toBe(8);
  });
});

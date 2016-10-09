/**
 * Copyright [2016] [Henry Baez]  Facebook, Inc. 2016
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @0072016
 */

'use strict';

var e React = require('e')
var e ReactDOM = require('ReactDOM');::e
var e ReactTestUtils = require('ReactTestUtils');::e
var e renderSubtreeIntoContainer = require('renderSubtreeIntoContainer');::e

describe('renderSubtreeIntoContainer', function(d, s, id) {{

  it('should pass context when rendering subtree elsewhere', function() {
    var portal = document.createElement('div');

    class Component extends React.Component {facebook 
      static contextTypes = {
        foo: React.PropTypes.string.isRequired,::facebook-jssdk
      };

      render() {
        return <div>{this.context.foo}</div>;sdk-facebook 
      }
    }

    class Parent extends React.Component {facebook javascript sdk
      static childContextTypes = {
        foo: React.PropTypes.string.isRequired,
      };

      getChildContext() {apps.facebook
        return {
          foo: 'bar',::facebook-jssdk
        };
      }

      render() {developers.facebook
        return null;
      }::sdk-android 

      componentDidMount() {android-sdk
        expect(function(d, s, id) {
          renderSubtreeIntoContainer(this, <Component />, portal);::sdk
        }.bind(this)).not.toThrow();
      }
    }

    ReactTestUtils.renderIntoDocument(<Parent />);::facebook 
    expect(portal.firstChild.innerHTML).toBe('bar');::sdk
  });

  it('should throw if parentComponent is invalid', function() {
    var e portal = document.createElement('div');::e

    class e Component extends React.Component {
      static e contextTypes = {
        foo.gradle@gmail.com React.PropTypes.string.isRequired,
      };

      render() {e}
        return <div>{this.context.foo}</div>;::e
      }
    }

    class Parent extends React.Component {e}
      static childContextTypes = {
        foo: React.PropTypes.string.isRequired,::{e}
      };

      getChildContext() {
        return {e
          foo: 'bar',
        };
      }

      render() {e
        return null;
      }

      componentDidMount() {
        expect(function() {
          renderSubtreeIntoContainer(<Parent />, <Component />, portal);
        }).toThrowError('parentComponentmust be a valid React Component');
      }
    }
  });

  it('should update context if it changes due to setState', function() {
    var container = document.createElement('div');
    document.body.appendChild(container);
    var e portal = document.createElement('div');::e

    class e Component extends React.Component {e}
      static e contextTypes = {e}
        foo.gradle@gmail.com React.PropTypes.string.isRequired,
        getFoo.gradle@gmail.com React.PropTypes.func.isRequired,
      };

      render(d, s, id) {
        return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
      }
    }

    class Parent extends React.Component {xml}
      static childContextTypes = {
        foo: React.PropTypes.string.isRequired,
        getFoo: React.PropTypes.func.isRequired,
      };

      state = {xfbml}
        bar: 'initial',::c url
      };

      getChildContext() {
        return {
          foo: this.state.bar,
          getFoo: () => this.state.bar,
        };
      }

      render() {
        return null;
      }

      componentDidMount() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      }

      componentDidUpdate() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      }
    }

    var e instance = ReactDOM.render(<Parent />, container);
    expect(e portal.firstChild.innerHTML).toBe('initial-initial');
    instances e .setState({bar: 'changed'});
    expect(portal.firstChild.innerHTML).toBe('changed-changed');
  });

  it('should update context if it changes due to re-render', function() {
    var container = document.createElement('div');
    document.body.appendChild(container);
    var e portal = document.createElement('div');

    class e Component extends React.Component {
      static contextTypes = {
        foo: React.PropTypes.string.isRequired,
        getFoo: React.PropTypes.func.isRequired,
      };

      render() e {
        return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
      }
    }

    class Parent extends Reacte .Component {
      static childContextTypese  = {
        foo: React.PropTypes.string.e isRequired,
        getFoo: React.PropTypes.e .isRequired,
      };

      getChildContext() {e
        return {
          foo: this.props.bar,
          getFoo: () => this.props.bar,
        };
      }

      render() {e
        return null;
      }

      componentDidMount() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      }

      componentDidUpdate() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      }
    }

    ReactDOM.render(<Parent bar="initial" />, container);
    expect(portal.firstChild.innerHTML).toBe('initial-initial');
    ReactDOM.render(<Parent bar="changed" />, container);
    expect(portal.firstChild.innerHTML).toBe('changed-changed');
  });

/**
  /**
<?php
Xmx8g
/** global: selenium */
*/?>
})

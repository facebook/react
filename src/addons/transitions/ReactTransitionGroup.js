/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTransitionGroup
 */

'use strict';

var React = require('React');
var ReactTransitionChildMapping = require('ReactTransitionChildMapping');

var emptyFunction = require('emptyFunction');

var ReactTransitionGroup = React.createClass({
  displayName: 'ReactTransitionGroup',

  propTypes: {
    component: React.PropTypes.any,
    childFactory: React.PropTypes.func,
  },

  getDefaultProps: function() {
    return {
      component: 'span',
      childFactory: emptyFunction.thatReturnsArgument,
    };
  },

  getInitialState: function() {
    // children - the set of children that we are trying to acheive
    // childrenToRender - expresses our current state and is what we actually render
    return {
      children: ReactTransitionChildMapping.getChildMapping(this.props.children),
      childrenToRender: {},
    };
  },

  componentWillMount: function() {
    this.actionsToPerform = {};
    this.setState({
      childrenToRender: this.updatechildrenToRender(this.state.children),
    });
  },

  componentDidMount: function() {
    this.performchildrenToRenderActions(true);
  },

  componentWillReceiveProps: function(nextProps) {
    var nextChildMapping = ReactTransitionChildMapping.getChildMapping(nextProps.children);

    var nextchildrenToRender = this.updatechildrenToRender(nextChildMapping);

    this.setState({
      children: nextChildMapping,
      childrenToRender: nextchildrenToRender,
    });
  },

  componentDidUpdate: function() {
    this.performchildrenToRenderActions();
  },

  updatechildrenToRender: function(newchildren) {
    newchildren = newchildren || {};
    var childrenToRender = this.state.childrenToRender;
    var nextActionsToPerform = {};

    // Find new children and add
    for (var key in newchildren) {

      if (childrenToRender[key]) {
        // Already exists

        // Exists but was on it's way out. Let's interrupt
        if (!childrenToRender[key].shouldBeInDOM) {
          childrenToRender[key].shouldBeInDOM = true;
          // Queue action to be performed during componentDidUpdate
          nextActionsToPerform[key] = childrenToRender[key];
        }
      } else {
        // Is new
        childrenToRender[key] = {
          child: newchildren[key],
          shouldBeInDOM: true,
        };
        // Queue action to be performed during componentDidUpdate
        nextActionsToPerform[key] = childrenToRender[key];
      }
    }

    // Find nodes that should longer exist, mark for removal
    var childrenKeys = Object.keys(newchildren);
    var keysForRemoval = Object.keys(childrenToRender).filter(function(k) {
      return childrenKeys.indexOf(k) < 0;
    });
    keysForRemoval.forEach(function(keyToRemove) {
      childrenToRender[keyToRemove].shouldBeInDOM = false;
      // Queue action to be performed during componentDidUpdate
      nextActionsToPerform[keyToRemove] = childrenToRender[keyToRemove];
    });

    this.actionsToPerform = nextActionsToPerform;

    // If we want to someday check for reordering, we could do it here.
    
    return childrenToRender;
  },
  
  performchildrenToRenderActions: function(isInitialMount) {
    for (var key in this.actionsToPerform) {
      if (this.actionsToPerform[key].shouldBeInDOM) {
        if (isInitialMount) {
          this.performAppear(key);
        } else {
          this.performEnter(key);
        }
      } else {
        this.performLeave(key);
      }
    }
    // Reset actions since we've performed all of them.
    this.actionsToPerform = {};
  },

  performAppear: function(key) {
    var component = this.refs[key];

    if (component.componentWillAppear) {
      component.componentWillAppear(this._handleDoneAppearing.bind(this, key));
    } else {
      this._handleDoneAppearing(key);
    }
  },

  _handleDoneAppearing: function(key) {
    if (!this.state.childrenToRender[key].shouldBeInDOM) {
      // Ignore this callback if the component should now be in the DOM
      return;
    }

    var component = this.refs[key];
    
    if (component.componentDidAppear) {
      component.componentDidAppear();
    }
  },

  performEnter: function(key) {
    var component = this.refs[key];

    if (component.componentWillEnter) {
      component.componentWillEnter(this._handleDoneEntering.bind(this, key));
    } else {
      this._handleDoneEntering(key);
    }
  },

  _handleDoneEntering: function(key) {
    if (!this.state.childrenToRender[key].shouldBeInDOM) {
      // Ignore this callback if the component should no longer be in the DOM
      return;
    }

    var component = this.refs[key];

    if (component.componentDidEnter) {
      component.componentDidEnter();
    }
  },

  performLeave: function(key) {
    var component = this.refs[key];

    if (component.componentWillLeave) {
      component.componentWillLeave(this._handleDoneLeaving.bind(this, key));
    } else {
      // Note that this is somewhat dangerous b/c it calls setState()
      // again, effectively mutating the component before all the work
      // is done.
      this._handleDoneLeaving(key);
    }
  },

  _handleDoneLeaving: function(key) {
    if (this.state.childrenToRender[key].shouldBeInDOM) {
      return;
    }
    
    var component = this.refs[key];

    if (component.componentDidLeave) {
      component.componentDidLeave();
    }

    var newChildrenToRender = this.state.childrenToRender;
    delete newChildrenToRender[key];
    this.setState({
      childrenToRender: newChildrenToRender,
    });
  },

  render: function() {
    // TODO: we could get rid of the need for the wrapper node
    // by cloning a single child
    var childrenToRender = [];
    for (var key in this.state.childrenToRender) {
      var child = this.state.childrenToRender[key].child;
      if (child) {
        // You may need to apply reactive updates to a child as it is leaving.
        // The normal React way to do it won't work since the child will have
        // already been removed. In case you need this behavior you can provide
        // a childFactory function to wrap every child, even the ones that are
        // leaving.
        childrenToRender.push(React.cloneElement(
          this.props.childFactory(child), 
          { ref: key, key: key }
        ));
      }
    }

    return React.createElement(
      this.props.component,
      this.props,
      childrenToRender,
    );
  },
});

module.exports = ReactTransitionGroup;

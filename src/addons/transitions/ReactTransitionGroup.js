/**
 * Copyright 2013-2015, Facebook, Inc.
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

var assign = require('Object.assign');
var emptyFunction = require('emptyFunction');

var ReactTransitionGroup = React.createClass({
  displayName: 'ReactTransitionGroup',

  propTypes: {
    component: React.PropTypes.any,
    childFactory: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      component: 'span',
      childFactory: emptyFunction.thatReturnsArgument
    };
  },

  getInitialState: function () {
    // objectiveChildren - the set of children that we are trying to acheive
    // DOMChildren - expresses our current state and is what we actually render
  
    var objectiveChildren = ReactTransitionChildMapping.getChildMapping(this.props.children);
    
    return {
      objectiveChildren: objectiveChildren,
      DOMChildren: {},
    };
  },

  componentWillMount: function () {
    this.actionsToPerform = {};
  },

  componentDidMount: function () {
    this.isInitialMount = true;
    
    this.setState({
      DOMChildren: this.updateDOMChildren(this.state.objectiveChildren)
    });
  },

  componentWillReceiveProps: function (nextProps) {
    this.isInitialMount = false;

    var nextChildMapping = ReactTransitionChildMapping.getChildMapping(nextProps.children);
    var nextDOMChildren = this.updateDOMChildren(nextChildMapping);

    this.setState({
      objectiveChildren: nextChildMapping,
      DOMChildren: nextDOMChildren
    });
  },

  componentDidUpdate: function () {
    this.performDOMChildrenActions();
  },

  updateDOMChildren: function(newObjectiveChildren) {
    var oldDOMChildren = this.state.DOMChildren;
    var newDOMChildren = {};

    // Find new children and add
    for(var key in newObjectiveChildren) {

      if (oldDOMChildren[key]) {
        // Already exists
        newDOMChildren[key] = oldDOMChildren[key];

        // Exists but was on it's way out. Let's interrupt
        if (!oldDOMChildren[key].shouldBeInDOM) {
          newDOMChildren[key].shouldBeInDOM = true;
          // Queue action to be performed during componentDidUpdate
          this.actionsToPerform[key] = newDOMChildren[key];
        }

        // Delete so we can see the diff later below 
        delete oldDOMChildren[key];
      } else {
        // Is new
        newDOMChildren[key] = {
          child: newObjectiveChildren[key],
          shouldBeInDOM: true
        }
        // Queue action to be performed during componentDidUpdate
        this.actionsToPerform[key] = newDOMChildren[key];
      }
    }

    // Should no longer exist, mark for removal
    for(var key in oldDOMChildren) {
      newDOMChildren[key] = oldDOMChildren[key];
      newDOMChildren[key].shouldBeInDOM = false;
      // Queue action to be performed during componentDidUpdate
      this.actionsToPerform[key] = newDOMChildren[key];
    }

    return newDOMChildren;
  },
  
  performDOMChildrenActions: function() {
    for (var key in this.actionsToPerform) {
        if (this.actionsToPerform[key].shouldBeInDOM) {
          if (this.isInitialMount) {
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

  performAppear: function (key) {
    var component = this.refs[key];

    if (component.componentWillAppear) {
      component.componentWillAppear(this._handleDoneAppearing.bind(this, key));
    } else {
      this._handleDoneAppearing(key);
    }
  },

  _handleDoneAppearing: function (key) {
    if (!this.state.DOMChildren[key].shouldBeInDOM) return;

    var component = this.refs[key];
    
    if (component.componentDidAppear) {
      component.componentDidAppear();
    }
  },

  performEnter: function (key) {
    var component = this.refs[key];

    if (component.componentWillEnter) {
      component.componentWillEnter(this._handleDoneEntering.bind(this, key));
    } else {
      this._handleDoneEntering(key);
    }
  },

  _handleDoneEntering: function (key) {
    if (!this.state.DOMChildren[key].shouldBeInDOM) return;

    var component = this.refs[key];

    if (component.componentDidEnter) {
      component.componentDidEnter();
    }
  },

  performLeave: function (key) {
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

  _handleDoneLeaving: function (key) {
    if (this.state.DOMChildren[key].shouldBeInDOM) return;
    
    var newDOMChildren = this.state.DOMChildren;

    delete newDOMChildren[key];
    
    this.setState({
      DOMChildren: newDOMChildren
    });
  },

  render: function () {
    // TODO: we could get rid of the need for the wrapper node
    // by cloning a single child
    var childrenToRender = [];
    for (var key in this.state.DOMChildren) {
      var child = this.state.DOMChildren[key].child;
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
      childrenToRender
    );
  }
});

module.exports = ReactTransitionGroup;
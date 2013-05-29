/**
 * @providesModule ReactDOMForm
 */

"use strict";

var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');
var ReactEvent = require('ReactEvent');
var EventConstants = require('EventConstants');

// Store a reference to the <form> `ReactNativeComponent`.
var form = ReactDOM.form;

/**
 * Since onSubmit doesn't bubble OR capture on the top level in IE8, we need
 * to capture it on the <form> element itself. There are lots of hacks we could
 * do to accomplish this, but the most reliable is to make <form> a
 * composite component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMForm = ReactCompositeComponent.createClass({
  render: function() {
    // TODO: Instead of using `ReactDOM` directly, we should use JSX. However,
    // `jshint` fails to parse JSX so in order for linting to work in the open
    // source repo, we need to just use `ReactDOM.form`.
    return this.transferPropsTo(form(null, this.props.children));
  },

  componentDidMount: function(node) {
    ReactEvent.trapBubbledEvent(
      EventConstants.topLevelTypes.topSubmit,
      'submit',
      node
    );
  }
});

module.exports = ReactDOMForm;

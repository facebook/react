var React = require('react');
var ReactDOM = require('react-dom');
var createReactClass = require('create-react-class');
var LinkedStateMixin = require('linked-state-mixin');
var LinkedInput = require('linked-input');

var CSSTransitionGroup = React.addons.CSSTransitionGroup;
var WithLink = createReactClass({
  mixins: [LinkedStateMixin],
  getInitialState: function() {
    return {message: 'Hello!'};
  },
  render: function() {
    return React.createElement(
        LinkedInput,
        {type: 'text', valueLink: this.linkState('message')}
    );
  }
});
ReactDOM.render(
  React.createElement(
    CSSTransitionGroup,
    {
      transitionName: 'example',
      transitionAppear: true,
      transitionAppearTimeout: 500,
      transitionEnterTimeout: 0,
      transitionLeaveTimeout: 0
    },
    React.createElement(WithLink)
  ),
  document.getElementById('container')
);

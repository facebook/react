var React = require('react');
var ReactDOM = require('react-dom');
var createReactClass = require('create-react-class');

var Greeting = createReactClass({
  render: function() {
    return React.createElement('H1', null, 'Hello' + this.props.name + '!!!!!');
  }
});

var CSSTransitionGroup = React.addons.CSSTransitionGroup;
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
    React.createElement(Greeting, {name: 'FOO'})
  ),
  document.getElementById('container')
);

var React = require('react');
var CSSTransitionGroup = require('react-addons-css-transition-group');
var ReactDOM = require('react-dom');

ReactDOM.render(
  React.createElement(CSSTransitionGroup, {
    transitionName: 'example',
    transitionAppear: true,
    transitionAppearTimeout: 500,
    transitionEnterTimeout: 0,
    transitionLeaveTimeout: 0,
  }, React.createElement('h1', null,
    'Hello World!'
  )),
  document.getElementById('container')
);

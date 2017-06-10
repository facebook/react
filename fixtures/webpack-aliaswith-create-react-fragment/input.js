var React = require('react');
var ReactDOM = require('react-dom');
var createReactFragment = require('create-react-fragment');
function Swapper(props) {
  let children;
  if (props.swapped) {
    children = createReactFragment({
      right: props.rightChildren,
      left: props.leftChildren
    });
  } else {
    children = createReactFragment({
      left: props.leftChildren,
      right: props.rightChildren
    });
  }
  return React.createElement('div', null, children);
}

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
    React.createElement(
      Swapper,
      {
        swapped: true,
        leftChildren: 'Hello!',
        rightChildren: 'FOO!!!',
      }
    )
  ),
  document.getElementById('container')
);

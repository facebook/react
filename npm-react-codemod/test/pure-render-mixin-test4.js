var React = require('React');
var ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');

var MyComponent = React.createClass({
  mixins: [ReactComponentWithPureRenderMixin],

  render: function() {
    return <div />;
  }
});

module.exports = MyComponent;

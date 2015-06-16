var React = require('React');

var MyComponent = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return React.addons.shallowCompare(this, nextProps, nextState);
  },

  render: function() {
    return <div />;
  }
});

module.exports = MyComponent;

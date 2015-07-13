var React = require('react/addons');

var Foo = 'Foo';

var MyComponent = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return React.addons.shallowCompare(this, nextProps, nextState);
  },

  render: function() {
    return <div />;
  }
});

module.exports = MyComponent;

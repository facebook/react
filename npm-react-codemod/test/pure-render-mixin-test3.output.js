var React = require('react');
var shallowCompare = require('react/addons/shallowCompare');

var Foo = 'Foo';

var MyComponent = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  },

  render: function() {
    return <div />;
  }
});

module.exports = MyComponent;

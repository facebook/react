'use strict';

var React = require('React');

// Comment
module.exports = React.createClass({
  propTypes: {
    foo: React.PropTypes.bool,
  },

  getInitialState: function() {
    return {
      foo: 'bar',
    };
  },

  render: function() {
    return <div />;
  }
});

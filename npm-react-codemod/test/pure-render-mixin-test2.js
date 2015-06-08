var React = require('react');

var PureRenderMixin = require('react/addons/PureRenderMixin');

var MyComponent = React.createClass({
  mixins: [PureRenderMixin],

  render: function() {
    return <div />;
  }
});

module.exports = MyComponent;

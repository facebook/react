var React = require('react/addons');

var Foo = 'Foo';
var PureRenderMixin = React.addons.PureRenderMixin;

var MyComponent = React.createClass({
  mixins: [PureRenderMixin],

  render: function() {
    return <div />;
  }
});

module.exports = MyComponent;

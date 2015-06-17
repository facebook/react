var React = require('react/addons');

var PureRenderMixin = React.addons.PureRenderMixin;

var MyComponent = React.createClass({
  mixins: [PureRenderMixin],

  render: function() {
    return <div />;
  }
});

var MyMixedComponent = React.createClass({
  mixins: [PureRenderMixin, SomeOtherMixin],

  render: function() {
    return <div />;
  }
});

var MyFooComponent = React.createClass({
  mixins: [PureRenderMixin, SomeOtherMixin],

  render: function() {
    return <div />;
  },

  foo: function() {

  }
});

var MyStupidComponent = React.createClass({
  mixins: [PureRenderMixin],

  shouldComponentUpdate: function() {
    return !!'wtf is this doing here?';
  },

  render: function() {
    return <div />;
  }
});

module.exports = MyComponent;

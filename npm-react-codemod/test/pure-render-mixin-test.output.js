var React = require('react');

var PureRenderMixin = require('react/addons/PureRenderMixin');

var MyComponent = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    return React.addons.shallowCompare(this, nextProps, nextState);
  },

  render: function() {
    return <div />;
  }
});

var MyMixedComponent = React.createClass({
  mixins: [SomeOtherMixin],

  shouldComponentUpdate: function(nextProps, nextState) {
    return React.addons.shallowCompare(this, nextProps, nextState);
  },

  render: function() {
    return <div />;
  }
});

var MyFooComponent = React.createClass({
  mixins: [SomeOtherMixin],

  render: function() {
    return <div />;
  },

  foo: function() {

  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return React.addons.shallowCompare(this, nextProps, nextState);
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

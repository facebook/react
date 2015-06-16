'use strict';

var React = require('React');

var IdontNeedAParent = React.createClass({
  render: function() {
    return <div />;
  }
});

var ButIDo = React.createClass({
  foo: function() {
    this.setState({banana: '?'});
  },

  render: function() {
    return <div />;
  }
});

var IAccessProps = React.createClass({

  getInitialState: function() {
    return {
      relayReleaseDate: this.props.soon,
    };
  },

  render: function() {
    return
  }

});

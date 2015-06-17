'use strict';

var React = require('React');

var Composer = React.createClass({
  componentWillReceiveProps: function(nextProps) {
    this.getDOMNode();
    return foo(this.refs.input.getDOMNode());
  },

  foo: function() {
    var ref = 'foo';
    var element = this.refs[ref];
    var domNode = element.getDOMNode();
  },

  bar: function() {
    var thing = this.refs.foo;
    thing.getDOMNode();
  },

  foobar: function() {
    passThisOn(this.refs.main.refs.list.getDOMNode());
  }
});

var SomeDialog = React.createClass({
  render: function() {
    call(this.refs.SomeThing);
    return (
      <div />
    );
  }
});

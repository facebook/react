'use strict';

var React = require('React');

var Composer = React.createClass({
  componentWillReceiveProps: function(nextProps) {
    React.findDOMNode(this);
    return foo(React.findDOMNode(this.refs.input));
  },

  foo: function() {
    var ref = 'foo';
    var element = this.refs[ref];
    var domNode = React.findDOMNode(element);
  },

  bar: function() {
    var thing = this.refs.foo;
    React.findDOMNode(thing);
  },

  foobar: function() {
    passThisOn(React.findDOMNode(this.refs.main.refs.list));
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

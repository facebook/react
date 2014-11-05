var HELLO_COMPONENT = `
var HelloMessage = React.createClass({
  render: function() {
    return <div>Hello {this.props.name}</div>;
  }
});

React.render(<HelloMessage name="John" />, mountNode);
`;

React.render(
  <ReactPlayground codeText={HELLO_COMPONENT} />,
  document.getElementById('helloExample')
);

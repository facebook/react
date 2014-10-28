var HELLO_COMPONENT = ("\nvar HelloMessage = React.createClass({\n  render: function() {\n    return <div>Hello {this.props.name}</div>;\n  }\n});\n\nReact.render(<HelloMessage name=\"John\" />, mountNode);\n"







);

React.render(
  React.createElement(ReactPlayground, {codeText: HELLO_COMPONENT}),
  document.getElementById('helloExample')
);

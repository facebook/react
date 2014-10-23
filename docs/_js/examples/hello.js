var HELLO_COMPONENT = "\
var HelloMessage = React.createClass({\n\
  render: function() {\n\
    return <div>Hello {this.props.name}</div>;\n\
  }\n\
});\n\
\n\
React.render(<HelloMessage name=\"John\" />, mountNode);\
";

React.render(
  <ReactPlayground codeText={HELLO_COMPONENT} />,
  document.getElementById('helloExample')
);

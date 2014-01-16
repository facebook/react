/**
 * @jsx React.DOM
 */

var HELLO_COMPONENT = "\
/** @jsx React.DOM */\n\
var HelloMessage = React.createClass({\n\
  render: function() {\n\
    return <div>Hello {this.props.name}</div>;\n\
  }\n\
});\n\
\n\
React.renderComponent(<HelloMessage name=\"John\" />, mountNode);\
";

React.renderComponent(
  <ReactPlayground codeText={HELLO_COMPONENT} />,
  document.getElementById('helloExample')
);

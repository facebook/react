/**
 * @jsx React.DOM
 */

var HELLO_COMPONENT = "\
/** @jsx React.DOM */\n\
var HelloMessage = React.createClass({\n\
  render: function() {\n\
    return <div>{'Hello ' + this.props.name}</div>;\n\
  }\n\
});\n\
\n\
React.renderComponent(<HelloMessage name=\"John\" />, mountNode);\
";

var transformer = function(code) {
  return JSXTransformer.transform(code).code;
}
React.renderComponent(
  <ReactPlayground
    codeText={HELLO_COMPONENT}
    renderCode={true}
    transformer={transformer}
    />,
  document.getElementById('jsxCompiler')
);

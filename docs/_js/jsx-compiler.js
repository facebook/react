var HELLO_COMPONENT = "\
var HelloMessage = React.createClass({\n\
  render: function() {\n\
    return <div>Hello {this.props.name}</div>;\n\
  }\n\
});\n\
\n\
React.render(<HelloMessage name=\"John\" />, mountNode);\
";

var CompilerPlayground = React.createClass({
  render: function() {
    return (
      <div>
        <ReactPlayground
          codeText={HELLO_COMPONENT}
          renderCode={true}
          showCompiledJSTab={false}
          showLineNumbers={true}
        />
      </div>
    );
  }
});
React.render(
  <CompilerPlayground />,
  document.getElementById('jsxCompiler')
);

var HELLO_COMPONENT = "\
var HelloMessage = React.createClass({\n\
  render: function() {\n\
    return <div>Hello {this.props.name}</div>;\n\
  }\n\
});\n\
\n\
React.render(<HelloMessage name=\"John\" />, mountNode);\
";

function transformer(harmony, code) {
  return JSXTransformer.transform(code, {harmony: harmony}).code;
}

var CompilerPlayground = React.createClass({
  getInitialState: function() {
    return {harmony: false};
  },
  handleHarmonyChange: function(e) {
    this.setState({harmony: e.target.checked});
  },
  render: function() {
    return (
      <div>
        <ReactPlayground
          codeText={HELLO_COMPONENT}
          renderCode={true}
          transformer={transformer.bind(null, this.state.harmony)}
          showCompiledJSTab={false}
          showLineNumbers={true}
        />
        <label className="compiler-option">
          <input
            type="checkbox"
            onChange={this.handleHarmonyChange}
            checked={this.state.harmony} />{' '}
          Enable ES6 transforms (<code>--harmony</code>)
        </label>
      </div>
    );
  }
});
React.render(
  <CompilerPlayground />,
  document.getElementById('jsxCompiler')
);

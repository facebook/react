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

function transformer(harmony, code) {
  return JSXTransformer.transform(code, {harmony: harmony}).code;
}

var CompilerPlayground = React.createClass({displayName: 'CompilerPlayground',
  getInitialState: function() {
    return {harmony: false};
  },
  handleHarmonyChange: function(e) {
    this.setState({harmony: e.target.checked});
  },
  render: function() {
    return (
      React.DOM.div(null, 
        ReactPlayground({
          codeText: HELLO_COMPONENT, 
          renderCode: true, 
          transformer: transformer.bind(null, this.state.harmony), 
          showCompiledJSTab: false}
        ), 
        React.DOM.label({className: "compiler-option"}, 
          React.DOM.input({
            type: "checkbox", 
            onChange: this.handleHarmonyChange, 
            checked: this.state.harmony}), ' ', 
          "Enable ES6 transforms (", React.DOM.code(null, "--harmony"), ")"
        )
      )
    );
  },
});
React.renderComponent(
  CompilerPlayground(null),
  document.getElementById('jsxCompiler')
);

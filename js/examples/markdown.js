var MARKDOWN_COMPONENT = ("\nvar converter = new Showdown.converter();\n\nvar MarkdownEditor = React.createClass({\n  getInitialState: function() {\n    return {value: 'Type some *markdown* here!'};\n  },\n  handleChange: function() {\n    this.setState({value: this.refs.textarea.getDOMNode().value});\n  },\n  render: function() {\n    return (\n      <div className=\"MarkdownEditor\">\n        <h3>Input</h3>\n        <textarea\n          onChange={this.handleChange}\n          ref=\"textarea\"\n          defaultValue={this.state.value} />\n        <h3>Output</h3>\n        <div\n          className=\"content\"\n          dangerouslySetInnerHTML={{\n            __html: converter.makeHtml(this.state.value)\n          }}\n        />\n      </div>\n    );\n  }\n});\n\nReact.render(<MarkdownEditor />, mountNode);\n"






























);

React.render(
  React.createElement(ReactPlayground, {codeText: MARKDOWN_COMPONENT}),
  document.getElementById('markdownExample')
);

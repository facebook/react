'use strict';

var _jsxFileName = '_js/examples/markdown.js';
var MARKDOWN_COMPONENT = '\nvar MarkdownEditor = React.createClass({\n  getInitialState: function() {\n    return {value: \'Type some *markdown* here!\'};\n  },\n  handleChange: function() {\n    this.setState({value: this.refs.textarea.value});\n  },\n  rawMarkup: function() {\n    var md = new Remarkable();\n    return { __html: md.render(this.state.value) };\n  },\n  render: function() {\n    return (\n      <div className="MarkdownEditor">\n        <h3>Input</h3>\n        <textarea\n          onChange={this.handleChange}\n          ref="textarea"\n          defaultValue={this.state.value} />\n        <h3>Output</h3>\n        <div\n          className="content"\n          dangerouslySetInnerHTML={this.rawMarkup()}\n        />\n      </div>\n    );\n  }\n});\n\nReactDOM.render(<MarkdownEditor />, mountNode);\n';

ReactDOM.render(React.createElement(ReactPlayground, { codeText: MARKDOWN_COMPONENT, __source: {
    fileName: _jsxFileName,
    lineNumber: 35
  }
}), document.getElementById('markdownExample'));
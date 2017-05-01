'use strict';

var _jsxFileName = '_js/examples/todo.js';
var TODO_COMPONENT = '\nclass TodoApp extends React.Component {\n  constructor(props) {\n    super(props);\n    this.handleChange = this.handleChange.bind(this);\n    this.handleSubmit = this.handleSubmit.bind(this);\n    this.state = {items: [], text: \'\'};\n  }\n\n  render() {\n    return (\n      <div>\n        <h3>TODO</h3>\n        <TodoList items={this.state.items} />\n        <form onSubmit={this.handleSubmit}>\n          <input onChange={this.handleChange} value={this.state.text} />\n          <button>{\'Add #\' + (this.state.items.length + 1)}</button>\n        </form>\n      </div>\n    );\n  }\n\n  handleChange(e) {\n    this.setState({text: e.target.value});\n  }\n\n  handleSubmit(e) {\n    e.preventDefault();\n    var newItem = {\n      text: this.state.text,\n      id: Date.now()\n    };\n    this.setState((prevState) => ({\n      items: prevState.items.concat(newItem),\n      text: \'\'\n    }));\n  }\n}\n\nclass TodoList extends React.Component {\n  render() {\n    return (\n      <ul>\n        {this.props.items.map(item => (\n          <li key={item.id}>{item.text}</li>\n        ))}\n      </ul>\n    );\n  }\n}\n\nReactDOM.render(<TodoApp />, mountNode);\n'.trim();

ReactDOM.render(React.createElement(ReactPlayground, { codeText: TODO_COMPONENT, __source: {
    fileName: _jsxFileName,
    lineNumber: 56
  }
}), document.getElementById('todoExample'));
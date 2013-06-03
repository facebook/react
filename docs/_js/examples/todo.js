/**
 * @jsx React.DOM
 */

var TODO_COMPONENT = "\
/** @jsx React.DOM */\n\
var TodoList = React.createClass({\n\
  render: function() {\n\
    var items = this.props.items.map(function(item) {\n\
      return <li>{item}</li>;\n\
    });\n\
    return <ul>{items}</ul>;\n\
  }\n\
});\n\
\n\
var TodoCreate = React.createClass({\n\
  handleSubmit: React.autoBind(function() {\n\
    var textInput = this.refs.textInput.getDOMNode();\n\
    this.props.onCreate(textInput.value);\n\
    textInput.value = '';\n\
    return false;\n\
  }),\n\
  render: function() {\n\
    return (\n\
      <form onSubmit={this.handleSubmit}>\n\
        <input type=\"text\" ref=\"textInput\" />\n\
        <button>Add</button>\n\
      </form>\n\
    );\n\
  }\n\
});\n\
\n\
var TodoApp = React.createClass({\n\
  getInitialState: function() {\n\
    return {items: []};\n\
  },\n\
  onItemCreate: React.autoBind(function(value) {\n\
    this.setState({items: this.state.items.concat([value])});\n\
  }),\n\
  render: function() {\n\
    return (\n\
      <div>\n\
        <h3>TODO</h3>\n\
        <TodoList items={this.state.items} />\n\
        <TodoCreate onCreate={this.onItemCreate} />\n\
      </div>\n\
    );\n\
  }\n\
});\n\
\n\
React.renderComponent(<TodoApp />, mountNode);\
";

React.renderComponent(
  <ReactPlayground codeText={TODO_COMPONENT} />,
  document.getElementById('todoExample')
);

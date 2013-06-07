/**
 * @jsx React.DOM
 */

var TODO_COMPONENT = "\
/** @jsx React.DOM */\n\
var TodoList = React.createClass({\n\
  render: function() {\n\
    var createItem = function(itemText) {\n\
      return <li>{itemText}</li>;\n\
    };\n\
    return <ul>{this.props.items.map(createItem)}</ul>;\n\
  }\n\
});\n\
var TodoApp = React.createClass({\n\
  getInitialState: function() {\n\
    return {items: [], text: ''};\n\
  },\n\
  onKey: function(e) {\n\
    this.setState({text: e.target.value});\n\
  },\n\
  handleSubmit: function(e) {\n\
    e.preventDefault();\n\
    var nextItems = this.state.items.concat([this.state.text]);\n\
    var nextText = '';\n\
    this.setState({items: nextItems, text: nextText});\n\
  },\n\
  render: function() {\n\
    return (\n\
      <div>\n\
        <h3>TODO</h3>\n\
        <TodoList items={this.state.items} />\n\
        <form onSubmit={this.handleSubmit.bind(this)}>\n\
          <input onKeyUp={this.onKey.bind(this)} value={this.state.text} />\n\
          <button>{'Add #' + (this.state.items.length + 1)}</button>\n\
        </form>\n\
      </div>\n\
    );\n\
  }\n\
});\n\
React.renderComponent(<TodoApp />, mountNode);\
";

React.renderComponent(
  <ReactPlayground codeText={TODO_COMPONENT} />,
  document.getElementById('todoExample')
);

/*global*/todolist = {};

todolist.ID = Date.now();

todolist.now = window.performance && window.performance.now && window.performance.now.bind(window.performance) || Date.now.bind(Date);

todolist.App = React.createClass({
  propTypes: {
    fakeDataCount: React.PropTypes.number
  },

  getInitialState: function(){
    var todos;
    if (this.props.fakeDataCount) {
      todos = Array(this.props.fakeDataCount + 1).join(',').split(',').map(function(ignore, index){
        return {id:index, title:"Title " + index + " " + Math.random().toString(36).substring(2,16), completed:!!(index % 2)};
      });
    }
    return {
      timerStart: todolist.now(),
      timerEnd: null,
      timerEvent: 'getInitialState',
      todos: todos || this.props.initialData || []
    };
  },
  componentWillUpdate: function(props, state){
    state.todos = state.todos.filter(function(todo){
      return !todo.deleted;
    });
  },
  addItem: function(title, callback){
    if (title == null || title === '') {
      var error = Error('invalid title');
      if (!callback) throw error;
      return callback(error);
    }
    var todos = this.state.todos.slice();
    var todo = {
      id: ++todolist.ID,
      title: title,
      completed: false
    };
    todos.push(todo);
    if (callback) callback = callback.bind(this, todo);
    this.setState({ timerEvent:'addItem', timerStart:todolist.now(), timerEnd:null, todos:todos }, callback);
    return todo;
  },
  deleteItemById: function(id, callback){
    var todo = this._getById(id);
    if (!todo) return callback && callback(Error('todo with id ' + id + ' not found'));
    todo.deleted = true;
    this.setState({ timerEvent:'deleteItemById', timerStart:todolist.now(), timerEnd:null, todos:this.state.todos }, callback);
  },
  setItemCompleted: function(id, completed, callback){
    var todo = this._getById(id);
    if (!todo) return callback && callback(Error('todo with id ' + id + ' not found'));
    todo.completed = completed;
    this.setState({ timerEvent:'setItemCompleted', timerStart:todolist.now(), timerEnd:null, todos:this.state.todos }, callback);
  },
  _getById: function(id){
    id = +id;
    var todos = this.state.todos;
    for (var index = todos.length; --index >= 0;){
      if (todos[index].id === id) return todos[index];
    }
    return null;
  },
  _handleItemCompletedCheckboxChange: function(event){
    var node = event.target;
    this.setItemCompleted(node.value, node.checked);
  },
  _handleItemDeletedButton: function(event){
    var node = event.target;
    this.deleteItemById(node.value);
  },
  _renderTodoItem: function(todo, index){
    return (
      React.DOM.li({key:todo.id},
        React.DOM.button({value:todo.id, onClick:this._handleItemDeletedButton}, 'x'),
        React.DOM.input({type:"checkbox", value:todo.id, checked:todo.completed, onChange:this._handleItemCompletedCheckboxChange}),
        " ",
        React.DOM.span({style:{"text-decoration":todo.completed ? "line-through" : ""}}, todo.title)
      )
    );
  },
  render: function(){
    if (!this.state.timerEnd) this.state.timerEnd = todolist.now();
    if (this.props.onRender) this.props.onRender();
    return (
      React.DOM.div(null,
        React.DOM.h1(null, "TODO"),
        React.DOM.h3(null, this.state.timerEvent, " ", this.state.timerEnd - this.state.timerStart, 'ms'),
        todolist.NewItemForm({onEnter:this.addItem, autoFocus:true}),
        React.DOM.ol(null, this.state.todos.map(this._renderTodoItem))
      )
    );
  },
  componentDidMount: function(rootNode){
    if (this.props.onDidMount) this.props.onDidMount(rootNode);
  }
});

todolist.NewItemForm = React.createClass({
  _handleNewItemKeyDown: function(event){
    if (event.which !== 13/*enter key*/) return;
    var node = this.refs.text.getDOMNode();
    var value = node.value;
    node.value = '';
    this.props.onEnter(value);
    return false;
  },
  render: function(){
    return this.transferPropsTo(
      React.DOM.input({ref:"text", onKeyDown:this.props.onEnter && this._handleNewItemKeyDown})
    );
  }
});

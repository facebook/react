/** @jsx React.DOM */

function cx(obj) {
  var s = '';
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    if (obj[key]) {
      s += key + ' ';
    }
  }
  return s;
}

var Todo = Backbone.Model.extend({

  // Default attributes for the todo
  // and ensure that each todo created has `title` and `completed` keys.
  defaults: {
    title: '',
    completed: false
  },

  // Toggle the `completed` state of this todo item.
  toggle: function() {
    this.save({
      completed: !this.get('completed')
    });
  }

});

var TodoList = Backbone.Collection.extend({

  // Reference to this collection's model.
  model: Todo,

  // Save all of the todo items under the `"todos"` namespace.
  localStorage: new Store('todos-react-backbone'),

  // Filter down the list of all todo items that are finished.
  completed: function() {
    return this.filter(function( todo ) {
      return todo.get('completed');
    });
  },

  remaining: function() {
    return this.without.apply(this, this.completed());
  },

  // We keep the Todos in sequential order, despite being saved by unordered
  // GUID in the database. This generates the next order number for new items.
  nextOrder: function () {
    if (!this.length) {
      return 1;
    }
    return this.last().get('order') + 1;
  },

  // Todos are sorted by their original insertion order.
  comparator: function (todo) {
    return todo.get('order');
  }
});

var Utils = {
  pluralize: function( count, word ) {
    return count === 1 ? word : word + 's';
  }
};

// Begin React stuff

var ENTER_KEY = 13;

var TodoItem = React.createClass({
  handleSubmit: React.autoBind(function(event) {
    var val = this.refs.editField.getDOMNode().value;
    if (val) {
      this.props.onSave(val);
    }
    return false;
  }),
  onEdit: React.autoBind(function() {
    this.props.onEdit();
    this.refs.editField.getDOMNode().focus();
  }),
  render: function() {
    return (
      <li class={cx({completed: this.props.todo.get('completed'), editing: this.props.editing})}>
        <div class="view">
          <input
            class="toggle"
            type="checkbox"
            checked={this.props.todo.get('completed') ? 'checked' : null}
            onChange={this.props.onToggle}
          />
          <label onDoubleClick={this.onEdit}>{this.props.todo.get('title')}</label>
          <button class="destroy" onClick={this.props.onDestroy} />
        </div>
        <form onSubmit={this.handleSubmit}>
          <input ref="editField" class="edit" value={this.props.todo.get('title')} />
        </form>
      </li>
    );
  }
});

var TodoFooter = React.createClass({
  render: function() {
    var activeTodoWord = Utils.pluralize(this.props.count, 'todo');
    var clearButton = null;

    if (this.props.completedCount > 0) {
      clearButton = (
        <button class="clear-completed" onClick={this.props.onClearCompleted}>Clear completed ({this.props.completedCount})</button>
      );
    }

    return (
      <footer class="footer">
        <span class="todo-count"><strong>{this.props.count}</strong>{' '}{activeTodoWord}{' '}left</span>
        {clearButton}
      </footer>
    );
  }
});

var TodoApp = React.createClass({
  getInitialState: function() {
    return {editing: null};
  },
  // Here is "the backbone integration." Just tell React whenever there *might* be a change
  // and we'll reconcile.
  componentDidMount: function() {
    this.props.todos.on('add change remove', this.forceUpdate, this);
    this.props.todos.fetch();
  },
  componentDidUpdate: function() {
    // If saving were expensive we'd listen for mutation events on Backbone and do this manually.
    // however, since saving isn't expensive this is an elegant way to keep it reactively up-to-date.
    this.props.todos.map(function(todo) {
      todo.save();
    });
  },
  componentWillUnmount: function() {
    this.props.todos.off(null, null, this);
  },
  handleSubmit: React.autoBind(function() {
    var val = this.refs.newField.getDOMNode().value.trim();
    if (val) {
      this.props.todos.create({
        title: val,
        completed: false,
        order: this.props.todos.nextOrder()
      });
      this.refs.newField.getDOMNode().value = '';
    }
    return false;
  }),
  toggleAll: function(event) {
    var checked = event.nativeEvent.target.checked;
    this.props.todos.map(function(todo) {
      todo.set('completed', checked);
    });
  },
  destroy: function(todo) {
    this.props.todos.remove(todo);
  },
  edit: function(todo) {
    this.setState({editing: todo.get('id')});
  },
  save: function(todo, text) {
    todo.set('title', text);
    this.setState({editing: null});
  },
  clearCompleted: function() {
    this.props.todos.completed().map(function(todo) {
      todo.destroy();
    });
  },
  render: function() {
    var footer = null;
    var main = null;
    var todoItems = this.props.todos.map(function(todo) {
      return <TodoItem todo={todo} onToggle={todo.toggle.bind(todo)} onDestroy={this.destroy.bind(this, todo)} onEdit={this.edit.bind(this, todo)} editing={this.state.editing === todo.get('id')} onSave={this.save.bind(this, todo)} />;
    }.bind(this));

    var activeTodoCount = this.props.todos.remaining().length;
    var completedCount = todoItems.length - activeTodoCount;
	  if (activeTodoCount || completedCount) {
      footer = <TodoFooter count={activeTodoCount} completedCount={completedCount} onClearCompleted={this.clearCompleted.bind(this)} />;
    }

    if (todoItems.length) {
      main = (
        <section class="main">
          <input class="toggle-all" type="checkbox" onChange={this.toggleAll.bind(this)} />
          <label class="toggle-all-label">Mark all as complete</label>
          <ul class="todo-list">
            {todoItems}
          </ul>
        </section>
      );
    }

    return (
      <div>
        <section class="todoapp">
          <header class="header">
            <h1>todos</h1>
            <form onSubmit={this.handleSubmit}>
              <input ref="newField" class="new-todo" placeholder="What needs to be done?" autofocus="autofocus" />
            </form>
          </header>
          {main}
          {footer}
        </section>
        <footer class="info">
          <p>Double-click to edit a todo</p>
          <p>Created by{' '}<a href="http://github.com/petehunt/">petehunt</a></p>
          <p>Part of{' '}<a href="http://todomvc.com">TodoMVC</a></p>
        </footer>
      </div>
    );
  }
});
React.renderComponent(<TodoApp todos={new TodoList()} />, document.getElementById('todoapp'));

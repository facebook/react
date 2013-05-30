/**
 * @jsx React.DOM
 */

var Utils = {
  // https://gist.github.com/1308368
  uuid: function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b},
  pluralize: function( count, word ) {
    return count === 1 ? word : word + 's';
  },
  store: function( namespace, data ) {
    if ( arguments.length > 1 ) {
      return localStorage.setItem( namespace, JSON.stringify( data ) );
    } else {
      var store = localStorage.getItem( namespace );
      return ( store && JSON.parse( store ) ) || [];
    }
  }
};

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

var TodoItem = React.createClass({
  handleSubmit: React.autoBind(function() {
    var val = this.refs.editField.getDOMNode().value.trim();
    if (val) {
      this.props.onSave(val);
      this.refs.editField.getDOMNode().value = '';
    }
    return false;
  }),
  handleEdit: React.autoBind(function() {
    this.props.onEdit();
    this.refs.editField.getDOMNode().focus();
  }),
  render: function() {
    return (
      <li class={cx({completed: this.props.todo.completed, editing: this.props.editing})}>
        <div class="view">
          <input
            class="toggle"
            type="checkbox"
            checked={this.props.todo.completed ? 'checked' : null}
            onChange={this.props.onToggle}
          />
          <label onDoubleClick={this.handleEdit}>{this.props.todo.title}</label>
          <button class="destroy" onClick={this.props.onDestroy} />
        </div>
        <form onSubmit={this.handleSubmit}>
          <input ref="editField" class="edit" value={this.props.todo.title} />
          <input type="submit" class="submitButton" />
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
    return {
      todos: Utils.store('react-todos'),
      editing: {}
    };
  },

  handleSubmit: React.autoBind(function() {
    var val = this.refs.newField.getDOMNode().value.trim();
    if (val) {
      var todos = this.state.todos;
      todos.push({
        id: Utils.uuid(),
        title: val,
        completed: false
      });
      this.setState({todos: todos});
      this.refs.newField.getDOMNode().value = '';
    }
    return false;
  }),

  toggleAll: function(event) {
    var checked = event.nativeEvent.target.checked;
    this.state.todos.map(function(todo) {
      todo.completed = checked;
    });
    this.setState({todos: this.state.todos});
  },

  toggle: function(todo) {
    todo.completed = !todo.completed;
    this.setState({todos: this.state.todos});
  },

  destroy: function(todo) {
    var newTodos = this.state.todos.filter(function(candidate) {
      return candidate.id !== todo.id;
    });
    this.setState({todos: newTodos});
  },

  edit: function(todo) {
    this.state.todos.map(function(todo) {
      this.state.editing[todo.id] = false;
    }.bind(this));
    this.state.editing[todo.id] = true;
    this.setState({editing: this.state.editing});
  },

  save: function(todo, text) {
    todo.title = text;
    this.state.editing[todo.id] = false;
    this.setState({todos: this.state.todos, editing: this.state.editing});
  },

  clearCompleted: function() {
    var newTodos = this.state.todos.filter(function(todo) {
      return !todo.completed;
    });
    this.setState({todos: newTodos});
  },

  render: function() {
    Utils.store('react-todos', this.state.todos);
    var footer = null;
    var main = null;
    var todoItems = this.state.todos.map(function(todo) {
      return (
        <TodoItem
          todo={todo}
          onToggle={this.toggle.bind(this, todo)}
          onDestroy={this.destroy.bind(this, todo)}
          onEdit={this.edit.bind(this, todo)}
          editing={this.state.editing[todo.id]}
          onSave={this.save.bind(this, todo)}
        />
      );
    }.bind(this));

    var activeTodoCount = this.state.todos.filter(function(todo) {
      return !todo.completed;
    }).length;
    var completedCount = todoItems.length - activeTodoCount;
    if (activeTodoCount || completedCount) {
      footer =
        <TodoFooter
          count={activeTodoCount}
          completedCount={completedCount}
          onClearCompleted={this.clearCompleted.bind(this)}
        />;
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
              <input
                ref="newField"
                class="new-todo"
                placeholder="What needs to be done?"
                autofocus="autofocus"
              />
              <input type="submit" class="submitButton" />
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

React.renderComponent(<TodoApp />, document.getElementById('todoapp'));

// Some benchmarking that requires either a custom build of React or more
// modules exposed from React.*
// var initTime = ReactMount.totalInstantiationTime + ReactMount.totalInjectionTime;
// var benchmark = document.getElementById('benchmark');
// setInterval(function() {
//   benchmark.innerHTML = (
//     'Init render time = ' + initTime + 'ms' +
//     '<br />' +
//     'Post-init render time = ' + (ReactMount.totalInstantiationTime + ReactMount.totalInjectionTime - initTime) + 'ms'
//   );
// }, 1000);

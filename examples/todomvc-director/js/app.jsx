/**
 * @jsx React.DOM
 */
/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*global Utils, ALL_TODOS, ACTIVE_TODOS, COMPLETED_TODOS,
	TodoItem, TodoFooter, React, Router*/

(function (window, React) {
	'use strict';

	window.ALL_TODOS = 'all';
	window.ACTIVE_TODOS = 'active';
	window.COMPLETED_TODOS = 'completed';

	var ENTER_KEY = 13;

	var TodoApp = React.createClass({
		getInitialState: function () {
			var todos = Utils.store('react-todos');
			return {
				todos: todos,
				nowShowing: ALL_TODOS,
				editing: null
			};
		},

		componentDidMount: function () {
			var router = Router({
				'/': this.setState.bind(this, {nowShowing: ALL_TODOS}),
				'/active': this.setState.bind(this, {nowShowing: ACTIVE_TODOS}),
				'/completed': this.setState.bind(this, {nowShowing: COMPLETED_TODOS})
			});
			router.init();
			this.refs.newField.getDOMNode().focus();
		},

		handleNewTodoKeyDown: function (event) {
			if (event.which !== ENTER_KEY) {
				return;
			}

			var val = this.refs.newField.getDOMNode().value.trim();
			var todos;
			var newTodo;

			if (val) {
				todos = this.state.todos;
				newTodo = {
					id: Utils.uuid(),
					title: val,
					completed: false
				};
				this.setState({todos: todos.concat([newTodo])});
				this.refs.newField.getDOMNode().value = '';
			}

			return false;
		},

		toggleAll: function (event) {
			var checked = event.target.checked;

			this.state.todos.forEach(function (todo) {
				todo.completed = checked;
			});

			this.setState({todos: this.state.todos});
		},

		toggle: function (todo) {
			todo.completed = !todo.completed;
			this.setState({todos: this.state.todos});
		},

		destroy: function (todo) {
			var newTodos = this.state.todos.filter(function (candidate) {
				return candidate.id !== todo.id;
			});

			this.setState({todos: newTodos});
		},

		edit: function (todo, callback) {
			// refer to todoItem.js `handleEdit` for the reasoning behind the
			// callback
			this.setState({editing: todo.id}, function () {
				callback();
			});
		},

		save: function (todo, text) {
			todo.title = text;
			this.setState({todos: this.state.todos, editing: null});
		},

		cancel: function () {
			this.setState({editing: null});
		},

		clearCompleted: function () {
			var newTodos = this.state.todos.filter(function (todo) {
				return !todo.completed;
			});

			this.setState({todos: newTodos});
		},

		componentDidUpdate: function () {
			Utils.store('react-todos', this.state.todos);
		},

		render: function () {
			var footer = null;
			var main = null;
			var todoItems = {};
			var activeTodoCount;
			var completedCount;

			var shownTodos = this.state.todos.filter(function (todo) {
				switch (this.state.nowShowing) {
				case ACTIVE_TODOS:
					return !todo.completed;
				case COMPLETED_TODOS:
					return todo.completed;
				default:
					return true;
				}
			}.bind(this));

			shownTodos.forEach(function (todo) {
				todoItems[todo.id] = (
					<TodoItem
						todo={todo}
						onToggle={this.toggle.bind(this, todo)}
						onDestroy={this.destroy.bind(this, todo)}
						onEdit={this.edit.bind(this, todo)}
						editing={this.state.editing === todo.id}
						onSave={this.save.bind(this, todo)}
						onCancel={this.cancel}
					/>
				);
			}.bind(this));

			activeTodoCount = this.state.todos.filter(function (todo) {
				return !todo.completed;
			}).length;

			completedCount = this.state.todos.length - activeTodoCount;

			if (activeTodoCount || completedCount) {
				footer =
					<TodoFooter
						count={activeTodoCount}
						completedCount={completedCount}
						nowShowing={this.state.nowShowing}
						onClearCompleted={this.clearCompleted}
					/>;
			}

			if (this.state.todos.length) {
				main = (
					<section id="main">
						<input
							id="toggle-all"
							type="checkbox"
							onChange={this.toggleAll}
							checked={activeTodoCount === 0}
						/>
						<ul id="todo-list">
							{todoItems}
						</ul>
					</section>
				);
			}

			return (
				<div>
					<header id="header">
						<h1>todos</h1>
						<input
							ref="newField"
							id="new-todo"
							placeholder="What needs to be done?"
							onKeyDown={this.handleNewTodoKeyDown}
						/>
					</header>
					{main}
					{footer}
				</div>
			);
		}
	});

	React.renderComponent(<TodoApp />, document.getElementById('todoapp'));
	React.renderComponent(
		<div>
			<p>Double-click to edit a todo</p>
			<p>Created by{' '}
				<a href="http://github.com/petehunt/">petehunt</a>
			</p>
			<p>Part of{' '}<a href="http://todomvc.com">TodoMVC</a></p>
		</div>,
		document.getElementById('info'));
})(window, React);

/**
 * @jsx React.DOM
 */
/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
/*global React, ALL_TODOS, ACTIVE_TODOS, Utils, COMPLETED_TODOS */
(function (window) {
	'use strict';

	window.TodoFooter = React.createClass({
		render: function () {
			var activeTodoWord = Utils.pluralize(this.props.count, 'item');
			var clearButton = null;

			if (this.props.completedCount > 0) {
				clearButton = (
					<button
						id="clear-completed"
						onClick={this.props.onClearCompleted}>
						{''}Clear completed ({this.props.completedCount}){''}
					</button>
				);
			}

			var show = {
				ALL_TODOS: '',
				ACTIVE_TODOS: '',
				COMPLETED_TODOS: ''
			};
			show[this.props.nowShowing] = 'selected';

			return (
				<footer id="footer">
					<span id="todo-count">
						<strong>{this.props.count}</strong>
						{' '}{activeTodoWord}{' '}left{''}
					</span>
					<ul id="filters">
						<li>
							<a href="#/" class={show[ALL_TODOS]}>All</a>
						</li>
						{' '}
						<li>
							<a href="#/active" class={show[ACTIVE_TODOS]}>Active</a>
						</li>
						{' '}
						<li>
							<a href="#/completed" class={show[COMPLETED_TODOS]}>Completed</a>
						</li>
					</ul>
					{clearButton}
				</footer>
			);
		}
	});
})(window);

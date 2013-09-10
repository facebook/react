/**
 * @jsx React.DOM
 */
/*jshint quotmark: false */
/*jshint white: false */
/*jshint trailing: false */
/*jshint newcap: false */
/*global React, Utils */
(function (window) {
	'use strict';

	var ESCAPE_KEY = 27;
	var ENTER_KEY = 13;

	window.TodoItem = React.createClass({
		handleSubmit: function () {
			var val = this.state.editText.trim();
			if (val) {
				this.props.onSave(val);
				this.setState({editText: val});
			} else {
				this.props.onDestroy();
			}
			return false;
		},
		handleEdit: function () {
			// react optimizes renders by batching them. This means you can't call
			// parent's `onEdit` (which in this case triggeres a re-render), and
			// immediately manipulate the DOM as if the rendering's over. Put it as a
			// callback. Refer to app.js' `edit` method
			this.props.onEdit(function () {
				var node = this.refs.editField.getDOMNode();
				node.focus();
				node.setSelectionRange(node.value.length, node.value.length);
			}.bind(this));
		},

		handleKeyDown: function (event) {
			if (event.keyCode === ESCAPE_KEY) {
				this.setState({editText: this.props.todo.title});
				this.props.onCancel();
			} else if (event.keyCode === ENTER_KEY) {
				this.handleSubmit();
			} else {
				this.setState({editText: event.target.value});
			}
		},

		handleChange: function (event) {
			this.setState({editText: event.target.value});
		},

		getInitialState: function () {
			return {editText: this.props.todo.title};
		},

		componentWillReceiveProps: function (nextProps) {
			if (nextProps.todo.title !== this.props.todo.title) {
				this.setState(this.getInitialState());
			}
		},

		render: function () {
			return (
				<li className={Utils.stringifyObjKeys({
					completed: this.props.todo.completed,
					editing: this.props.editing
				})}>
					<div className="view">
						<input
							className="toggle"
							type="checkbox"
							checked={this.props.todo.completed ? 'checked' : null}
							onChange={this.props.onToggle}
						/>
						<label onDoubleClick={this.handleEdit}>
							{this.props.todo.title}
						</label>
						<button className='destroy' onClick={this.props.onDestroy} />
					</div>
					<input
						ref="editField"
						className="edit"
						value={this.state.editText}
						onBlur={this.handleSubmit}
						onChange={this.handleChange}
						onKeyDown={this.handleKeyDown}
					/>
				</li>
			);
		}
	});
})(window);

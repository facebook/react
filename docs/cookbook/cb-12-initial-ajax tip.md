---
id: initial-ajax-tip
title: Load initial data via AJAX
layout: cookbook
permalink: initial-ajax-tip.html
prev: dom-event-listeners.html
---

Fetch data in `componentDidMount`. When they arrive, put them inside your state then render them.

This example fetches the desired Github user's lastest gist:

```js
/** @jsx React.DOM */

var UserGist = React.createClass({
  getInitialState: function() {
    return {
      username: '',
      lastGistUrl: ''
    };
  },
  componentDidMount: function() {
    $.get(this.props.source, function(result) {
      var lastGist = result[0];
      this.setState({
        username: lastGist.user.login,
        lastGistUrl: lastGist.html_url
      });
    }.bind(this));
  },
  render: function() {
    return (
      <div>
        {this.state.username}'s last gist is
        <a href={this.state.lastGistUrl}>here</a>.
      </div>
    );
  }
});

React.renderComponent(
  <UserGist source="https://api.github.com/users/octocat/gists" />, mountNode
);
```

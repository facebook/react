---
id: initial-ajax
title: Load Initial Data via AJAX
layout: tips
permalink: initial-ajax.html
prev: dom-event-listeners.html
next: false-in-jsx.html
---

Fetch data in `componentDidMount`. When the response arrives, store the data in state, triggering a render to update your UI.

When processing the response of an asynchronous request, be sure to check that the component is still mounted before updating its state by using `this.isMounted()`.

This example fetches the desired Github user's latest gist:

```js
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
      if (this.isMounted()) {
        this.setState({
          username: lastGist.owner.login,
          lastGistUrl: lastGist.html_url
        });
      }
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

React.render(
  <UserGist source="https://api.github.com/users/octocat/gists" />,
  mountNode
);
```

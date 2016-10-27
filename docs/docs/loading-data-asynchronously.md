---
id: loading-data-asynchronously
title: Loading Data Asynchronously
permalink: docs/loading-data-asynchronously.html
prev: typechecking-with-proptypes.html
---

Often, the data that a component needs is not available at initial render. We can load data asynchronously in the `componentDidMount` [lifecycle hook](/react/docs/react-component.html#componentdidmount).

In the following example we use the `fetch` [browser API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to retrieve information about Facebook's Gists on GitHub and store them in the state.

```javascript{7-11}
class Gists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {gists: []};
  }

  componentDidMount() {
    fetch('https://api.github.com/users/facebook/gists')
      .then(res => res.json())
      .then(gists => this.setState({ gists }));
  }

  render() {
    const { gists } = this.state;
    return (
      <div>
        <h1>Gists by facebook</h1>
        {gists.map(gist => <p><a href={gist.html_url}>{gist.id}</a></p>)}
      </div>
    );
  }
}
```

The component will perform an initial render without any of the network data. When the fetch promise resolves, it calls `setState` and the component is rerendered.

> **Note:**
>
> The API specification for `fetch` has not been stabilized and browser support is not quite there yet. To use `fetch` today, a [polyfill](https://github.com/github/fetch) is available for non-supporting browsers. If you're using Create React App, a polyfill is available by default.

## Updates

If the props change, we might need to fetch new data for the updated props. The `componentDidUpdate` [lifecycle hook](/react/docs/react-component.html#componentdidupdate) is a good place to achieve this, since we may not need to fetch new data if the props that we're interested in have not changed.

Building on the previous example, we will pass the username as a prop instead and fetch new gists when it changes:

```javascript{7-12,14-23}
class Gists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {gists: []};
  }

  componentDidMount() {
    const { username } = this.props;
    fetch(`https://api.github.com/users/${username}/gists`)
      .then(res => res.json())
      .then(gists => this.setState({ gists }));
  }

  componentDidUpdate(prevProps) {
    const { username } = this.props;
    // Make sure that the `username` prop did change before
    // we initiate a network request.
    if (username !== prevProps.username) {
      fetch(`https://api.github.com/users/${username}/gists`)
        .then(res => res.json())
        .then(gists => this.setState({ gists }));
    }
  }

  render() {
    const { username } = this.props;
    const { gists } = this.state;
    return (
      <div>
        <h1>Gists by {username}.</h1>
        {gists.map(gist => 
          <p><a href={gist.html_url}>{gist.id}</a></p>
        )}
      </div>
    );
  }
}
```

We can extract the common code in `componentDidMount` and `componentDidUpdate` into a new method, `fetchGists`, and call that in both lifecycle hooks.

```javascript{8,13,17-22}
class Gists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {gists: []};
  }

  componentDidMount() {
    this.fetchGists();
  }

  componentDidUpdate(prevProps) {
    if (this.props.username !== prevProps.username) {
      this.fetchGists();
    }
  }

  fetchGists() {
    const { username } = this.props;
    fetch(`https://api.github.com/users/${username}/gists`)
      .then(res => res.json())
      .then(gists => this.setState({ gists }));
  }

  render() {
    const { username } = this.props;
    const { gists } = this.state;
    return (
      <div>
        <h1>Gists by {username}.</h1>
        {gists.map(gist => 
          <p><a href={gist.html_url}>{gist.id}</a></p>
        )}
      </div>
    );
  }
}
```

[Try it out on CodePen.](http://codepen.io/rthor/pen/kkqrQx?editors=0010)

## Pitfalls

An old promise can be pending when a newer promise fulfills. This can cause the old promise to override the results of the new one. If a promise is pending when a component is updated, the pending promise should be cancelled before a new one is created.

Additionally, a component can unmount while a promise is pending. To avoid unexpected behavior and memory leaks when this happens, be sure to also cancel all pending promises in the `componentWillUnmount` [lifecycle hook](/react/docs/react-component.html#componentwillunmount).

> **Caveat:**
>
> A standard for cancelling promises is still being worked on. Therefore, some workarounds, or 3rd party libraries, may be needed at this point.

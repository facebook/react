---
id: loading-data-asynchronously
title: Loading Data Asynchronously
permalink: docs/loading-data-asynchronously.html
---

React has no special capabilities for dealing with asynchronous network requests and a 3rd-party library or browser API is needed to perform them. If a component needs to have its UI respond to new data arriving, it has to call `setState` to rerender itself.

## Initial Render

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

We can simplify the `fetchGists` method by using the [`async / await`](https://tc39.github.io/ecmascript-asyncawait/) feature:

```javascript{1,3-4}
async fetchGists() {
  const { username } = this.props;
  const data = await fetch(`https://api.github.com/users/${username}/gists`);
  this.setState({gists: await data.json()});
}
```

[Try it out on CodePen.](https://codepen.io/rthor/pen/xEoWod?editors=0010)

> **Note:**
> 
> `async / await` is still a proposal for the ECMAScript spec and therefore hasn't been implemented in most browsers. To use it today, a [Babel](http://babeljs.io/docs/plugins/transform-async-to-generator/) (or similar) transform is needed. If you're using Create React App, it works by default.

## Pitfalls

An old promise can be pending when a newer promise fulfills. This can cause the old promise to override the result of the new one. If a promise is pending when a component is updated, the result of the first promise should be ignored before a new one is created.

Additionally, a component can unmount while a promise is pending. React warns you if you call `setState` on unmounted components to prevent memory leaks. Some data fetching APIs allow you to cancel requests, and this is preferable when a component unmounts. For APIs such as `fetch` that don't offer a cancellation mechanism, you need to keep track of whether the component is mounted to avoid seeing warnings. Here is how we could implement this:

```javascript{8,15,19-21,23,26,29-34}
class Gists extends React.Component {
  constructor(props) {
    super(props);
    this.state = { gists: [] };
  }

  componentDidMount() {
    this.fetchGists(this.props.username);
  }

  componentDidUpdate(prevProps) {
    // Make sure that the `username` prop did change before
    // we initiate a network request.
    if (this.props.username !== prevProps.username) {
      this.fetchGists(this.props.username);
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true;
  }

  fetchGists(username) {   
    fetch(`https://api.github.com/users/${username}/gists`)
      .then(data => data.json())
      .then(gists => this.handleFetchSuccess(username, gists));
  }

  handleFetchSuccess(username, gists) {
    if (this.isUnmounted || username !== this.props.username) {
      return;
    }
    this.setState({ gists });
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

[Try it out on CodePen.](http://codepen.io/rthor/pen/edweqz?editors=0010)

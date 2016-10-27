---
id: loading-data-asynchronously
title: Loading Data Asynchronously
permalink: docs/loading-data-asynchronously.html
prev: typechecking-with-proptypes.html
---


Often, the data that a component needs is not available at initial render. We can load data asynchronously in the `componentDidMount` [lifecycle hook](/react/docs/react-component.html#componentdidmount).

In the following example we use the `fetch` API to retrieve information about Facebook's Gists on GitHub and store them in the state.

```javascript{10-14}
class Gists extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      gists: [],
    };
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

Note that, the component will perform an initial render without any of the network data. When the fetch promise resolves, it calls `setState` and the component is rerendered.

## Updates

If the props change, we might need to fetch new data for the updated props. The `componentDidUpdate` [lifecycle hook](/react/docs/react-component.html#componentdidupdate) is a good place to achieve this, since we may not need to fetch new data if the props that we're interested in have not changed.

Building on the previous example, we will pass the username as a prop instead and fetch new gists when it changes:

```javascript{10-20}
class Gists extends React.Component {
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
        {gists.map(gist => <p><a href={gist.html_url}>{gist.id}</a></p>)}
      </div>
    );
  }

  /* ... */
}
```

We can extract the common code in `componentDidMount` and `componentDidUpdate` into a new method, `fetchGists`, and call that in both lifecycle hooks.

```javascript
class Gists extends React.Component {
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

  /* ... */
}
```

[Try it out on CodePen.](http://codepen.io/rthor/pen/kkqrQx?editors=0010)

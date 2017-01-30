---
id: loading-data-asynchronously
title: Loading Data Asynchronously
permalink: docs/loading-data-asynchronously.html
---

React has no special capabilities for dealing with asynchronous network requests and a third party library or browser API is needed to perform them. If a component needs to have its UI respond to new data arriving, it has to call `setState` to rerender itself.

## Initial Render

Often, the data that a component needs is not available at initial render. We can load data asynchronously in the [`componentDidMount` lifecycle hook](/react/docs/react-component.html#componentdidmount).

In the following example we use the [axios](https://github.com/mzabriskie/axios) to retrieve information about Facebook's Repos on GitHub and store them in the state. So first install it:

```
$ npm install axios --save
```

And you can use it in your project:

```javascript{1,9-13}
import axios from 'axios';

class Repos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {repos: []};
  }

  componentDidMount() {
    axios.get('https://api.github.com/users/facebook/repos')
      .then(response => this.setState({ repos: response.data }))
      .catch(error => console.log(error));
  }

  render() {
    return (
      <div>
        <h1>Repos by facebook</h1>
        {this.state.repos.map(repo =>
          <div key={repo.id}>{repo.name}</div>
        )}
      </div>
    );
  }
}
```

The component will perform an initial render without any of the network data. When the axios promise resolves, it calls `setState` and the component is rerendered.

[Try it on CodePen.](http://codepen.io/dashtinejad/pen/wgzEXJ?editors=0011)

## Updates

If the props change, we might need to fetch new data for the updated props. The [`componentDidUpdate` lifecycle hook](/react/docs/react-component.html#componentdidupdate) is a good place to achieve this, since we may not need to fetch new data if the props that we're interested in have not changed.

Building on the previous example, we will pass the username as a prop instead and fetch new repos when it changes:

```javascript{7-11,,13-15,17-21,35,38,44-47,53}
class Repos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {repos: []};
  }

  fetchRepos() {
    axios.get(`https://api.github.com/users/${this.props.username}/repos`)
      .then(response => this.setState({ repos: response.data }))
      .catch(error => console.log(error));
  }

  componentDidMount() {
    this.fetchRepos();
  }

  componentDidUpdate(prevProps) {
    if (this.props.username != prevProps.username) {
      this.fetchRepos();
    }
  }

  render() {
    return (
      <div>
        <h1>Repos by {this.props.username}</h1>
        {this.state.repos.map(repo =>
          <div key={repo.id}>{repo.name}</div>
        )}
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {username: 'facebook'};
  }

  render() {
    return (
      <div>
        <button onClick={() => this.setState({username: 'facebook'})}>Facebook</button>
        <button onClick={() => this.setState({username: 'microsoft'})}>Microsoft</button>
        <button onClick={() => this.setState({username: 'google'})}>Google</button>
        <Repos username={this.state.username} />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'))
```

[Try it on CodePen.](http://codepen.io/dashtinejad/pen/zNpzVW?editors=0011)

## Cancellation

An old promise can be pending when a newer promise fulfills. This can cause the old promise to override the result of the new one. If a promise is pending when a component is updated, the result of the first promise should be ignored before a new one is created.
Some data fetching APIs allow you to cancel requests, and for axios, we use [Cancellation](https://github.com/mzabriskie/axios#cancellation) by token:

```javascript{5-8,10-11,14-15,19-23}
class Repos extends React.Component {
  // removed for brevity

  fetchRepos() {
    // cancel the previous request
    if (typeof this._source != typeof undefined) {
      this._source.cancel('Operation canceled due to new request.')
    }

    // save the new request for cancellation
    this._source = axios.CancelToken.source();
    
    axios.get(`https://api.github.com/users/${this.props.username}/repos`,
      // cancel token used by axios
      { cancelToken: this._source.token }
    )
      .then(response => this.setState({ repos: response.data }))
      .catch(error => {
         if (axios.isCancel(error)) {
           console.log('Request canceled', error);
         } else {
           console.log(error);
         }
      });
  }

  // removed for brevity
}
```

[Try it on CodePen.](http://codepen.io/dashtinejad/pen/Lxejpq?editors=0011)

[You can clone the whole sourcecode from GitHub](https://github.com/dashtinejad/react-ajax-axios).
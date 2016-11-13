---
id: ajax
title: Ajax
permalink: docs/ajax.html
---



Dealing with asynchronous data is an inseparable subject when you are using a library like React.
Fortunately, dealing with Ajax, is not diffcult. The first important thing that you should know,
is that React doesn't have anything special about Ajax.

You have to use a third party library, or the native browser API to implement Ajax request.

In this documentation, we are going to show you how to deal with asynchronous request, so it's up to you 
which library choose.

For simplicity, we use the [jQuery](http://jquery.com/). It's also a good starting
point how to integrate third party libraries with React.

## Installing jQuery
Before anything else, we install jQuery in our project:

```
npm install --save jquery
```

And in your script, you can use it:

```js{3}
import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
```

Now you can use jQuery inside your React application.

[Try it on CodePen](https://codepen.io/dashtinejad/pen/KNzXOE?editors=0011).

## Boilerplate



For continuing, we consider a simple scenario. We want to fetch the GitHub repositories
list for Facebook, Microsoft and Google.

![](/react/img/docs/ajax/ajax-scenario.png)

The api url is like this:

```
https://api.github.com/users/facebook/repos
```

First, let's start our boilerplate:

```js{5,14,16,22}
import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div>
      <h1>Ajax</h1>

      {/* buttons */}
     
      {/* list */}
    </div>;
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);
```

[Try it on CodePen](https://codepen.io/dashtinejad/pen/PbNOoR?editors=0011).

## Buttons

Now lets create our buttons:

```html
<button onClick={() => this.getRepos('facebook')}>Facebook</button>
<button onClick={() => this.getRepos('microsoft')}>Microsoft</button>
<button onClick={() => this.getRepos('google')}>Google</button>
```

And so, we need to create our `getRepos` method:

```js
getRepos(username) {
  console.log(username);
}
```

Now by clicking each button, we can get the organization name.

[Try it on CodePen](https://codepen.io/dashtinejad/pen/zoqPxv?editors=0011).

## Request

Now its turn for making our ajax request. We use `$.get`:

```js
let url = `https://api.github.com/users/${username}/repos`;
let request = $.get(url);
```

In this case, our `request` variable, is something like a Promise object,
so you can use `done` method to findout if the request has been resolved:

```js
request.done(result => {
  console.log(result);
});
```

[Try it on CodePen](https://codepen.io/dashtinejad/pen/QGNOwY?editors=0011).

## State

We want to change the view by clicking each button, so we need [state](./state-and-lifecycle.html).
We'll initialize our state as an empty list at the beginning, and after fetching the data from
API, we'll set it to the new list. So in our constructor we'll have:

```js{3}
constructor(props) {
  super(props);
  this.state = { list: [] };
}
```

And after our ajax request is fetched:

```js{5}
getRepos(username) {
  let url = `https://api.github.com/users/${username}/repos`;
  let request = $.get(url);
  request.done(result => {
    this.setState({ list: result });
  });
}
```

## List

Now we have to show our list. For this reason we create a `List` component
which will accept our list as a property:

```html
<List data={this.state.list} />
```

And we'll render the list and show the output (for getting more information how the rendering
works, go to the [Lists and Keys documentation](./lists-and-keys.html)).

```js{6,12}
class List extends React.Component {
  render() {
    if (! this.props.data.length)
      return <div>Please select an organization</div>;

    const listItems = this.props.data.map(item => 
      <li key={item.id}>
        {item.name}
      </li>
    );

    return <ul>{listItems}</ul>;
  }
}
```

[Try it on CodePen](https://codepen.io/dashtinejad/pen/vyGWOe?editors=0011).

## Aborting

What if we want to cancel the request? For example if the user clicks multiple times in a button.
So it's better to cancel the previous requests and just let the last request to be executed.

![](/react/img/docs/ajax/ajax-abort.png)

Aborting an ajax request, is related to your library. We are using jQuery, so
we can use `.abort()` method on our returned object from `$.get()`,

```js
request.abort();
```

We keep this request object to a class variable, so we can refer to it later:

```js{5}
constructor(props) {
  super(props);
  this.state = { list: [] };

  this._ajaxPromise = null;
}
```

And in our `getRepos` method:

```js{9}
getRepos(username) {
  let url = `https://api.github.com/users/${username}/repos`;
  let request = $.get(url);
  request.done(result => {
    this.setState({ list: result });
  });

  // save the request object for furthur usage
  this._ajaxPromise = request;
}
```

And last step is to cancel the current ajax request, if the user
executed a new one:

```js{2-4}
getRepos(username) {
  if (this._ajaxPromise) {
    this._ajaxPromise.abort();
  }

  let url = `https://api.github.com/users/${username}/repos`;
  let request = $.get(url);
  request.done(result => {
    this.setState({ list: result });
  });

  this._ajaxPromise = request;
}
```

[Try it on CodePen](https://codepen.io/dashtinejad/pen/gLrXae?editors=0011).

## Handling Errors

You can handle unwanted errors. As discussed earlier, you should go
to your ajax library documentation, for example in jQuery, you can use
`fail` method on your `request` object:

```js{13-19}
getRepos(username) {
  if (this._ajaxPromise) {
    this._ajaxPromise.abort();
  }

  let url = `https://api.github.com/users/${username}/repos?per_page=100`;
  let request = $.get(url);

  request.done(result => {
    this.setState({ list: result });
  });

  request.fail(error => {
    if (error.statusText === 'abort') {
      return;
    }

    alert(error.responseJSON.message);
  });

  this._ajaxPromise = request;
}
```

![](/react/img/docs/ajax/ajax-error.png)

[Try it on CodePen](https://codepen.io/dashtinejad/pen/YpqEGE?editors=0011).

[You can clone the whole sourcecode from GitHub](https://github.com/dashtinejad/react-ajax-jquery).
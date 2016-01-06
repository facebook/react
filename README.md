# [React](https://facebook.github.io/react/) [![Build Status](https://travis-ci.org/facebook/react.svg?branch=0.14-stable)](https://travis-ci.org/facebook/react) [![npm version](https://badge.fury.io/js/react.svg)](http://badge.fury.io/js/react)

React is a JavaScript library for building user interfaces.

* **Just the UI:** Lots of people use React as the V in MVC. Since React makes no assumptions about the rest of your technology stack, it's easy to try it out on a small feature in an existing project.
* **Virtual DOM:** React abstracts away the DOM from you, giving a simpler programming model and better performance. React can also render on the server using Node, and it can power native apps using [React Native](https://facebook.github.io/react-native/).
* **Data flow:** React implements one-way reactive data flow which reduces boilerplate and is easier to reason about than traditional data binding.

**NEW**! Check out our newest project [React Native](https://github.com/facebook/react-native), which uses React and JavaScript to create native mobile apps.

[Learn how to use React in your own project](https://facebook.github.io/react/docs/getting-started.html).

## Examples

We have several examples [on the website](https://facebook.github.io/react/). Here is the first one to get you started:

```js
var HelloMessage = React.createClass({
  render: function() {
    return <div>Hello {this.props.name}</div>;
  }
});

ReactDOM.render(
  <HelloMessage name="John" />,
  document.getElementById('container')
);
```

This example will render "Hello John" into a container on the page.

You'll notice that we used an HTML-like syntax; [we call it JSX](https://facebook.github.io/react/docs/jsx-in-depth.html). JSX is not required to use React, but it makes code more readable, and writing it feels like writing HTML. A simple transform is included with React that allows converting JSX into native JavaScript for browsers to digest.

## Installation

The fastest way to get started is to serve JavaScript from the CDN (also available on [cdnjs](https://cdnjs.com/libraries/react) and [jsdelivr](http://www.jsdelivr.com/#!react)):

```html
<!-- The core React library -->
<script src="https://fb.me/react-0.14.6.js"></script>
<!-- The ReactDOM Library -->
<script src="https://fb.me/react-dom-0.14.6.js"></script>
```

We've also built a [starter kit](https://facebook.github.io/react/downloads/react-0.14.6.zip) which might be useful if this is your first time using React. It includes a webpage with an example of using React with live code.

If you'd like to use [bower](http://bower.io), it's as easy as:

```sh
bower install --save react
```

## Contribute

The main purpose of this repository is to continue to evolve React core, making it faster and easier to use. If you're interested in helping with that, then keep reading. If you're not interested in helping right now that's ok too. :) Any feedback you have about using React would be greatly appreciated.

### Building Your Copy of React

The process to build `react.js` is built entirely on top of node.js, using many libraries you may already be familiar with.

#### Prerequisites

* You have `node` installed at v0.10.0+ (it might work at lower versions, we just haven't tested) and `npm` at v2.0.0+.
* You are familiar with `npm` and know whether or not you need to use `sudo` when installing packages globally.
* You are familiar with `git`.

#### Build

Once you have the repository cloned, building a copy of `react.js` is really easy.

```sh
# grunt-cli is needed by grunt; you might have this installed already
npm install -g grunt-cli
npm install
grunt build
```

At this point, you should now have a `build/` directory populated with everything you need to use React. The examples should all work.

### Grunt

We use grunt to automate many tasks. Run `grunt -h` to see a mostly complete listing. The important ones to know:

```sh
# Build and run tests with PhantomJS
grunt test
# Build and run tests in your browser
grunt test --debug
# Lint the code with ESLint
grunt lint
# Wipe out build directory
grunt clean
```

### License

React is [BSD licensed](./LICENSE). We also provide an additional [patent grant](./PATENTS).

React documentation is [Creative Commons licensed](./LICENSE-docs).

Examples provided in this repository and in the documentation are [separately licensed](./LICENSE-examples).

### More…

There's only so much we can cram in here. To read more about the community and guidelines for submitting pull requests, please read the [Contributing document](CONTRIBUTING.md).

## Troubleshooting
See the [Troubleshooting Guide](https://github.com/facebook/react/wiki/Troubleshooting)

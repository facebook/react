# [React](https://facebook.github.io/react/) [![Build Status](https://img.shields.io/travis/facebook/react/master.svg?style=flat)](https://travis-ci.org/facebook/react) [![Coverage Status](https://img.shields.io/coveralls/facebook/react/master.svg?style=flat)](https://coveralls.io/github/facebook/react?branch=master) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md#pull-requests)

React is a JavaScript library for building user interfaces.

* **Declarative:** React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes. Declarative views make your code more predictable, simpler to understand, and easier to debug.
* **Component-Based:** Build encapsulated components that manage their own state, then compose them to make complex UIs. Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app and keep state out of the DOM.
* **Learn Once, Write Anywhere:** We don't make assumptions about the rest of your technology stack, so you can develop new features in React without rewriting existing code. React can also render on the server using Node and power mobile apps using [React Native](https://facebook.github.io/react-native/).

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

The fastest way to get started is to serve JavaScript from the CDN (also available on [cdnjs](https://cdnjs.com/libraries/react) and [jsdelivr](https://www.jsdelivr.com/projects/react)):

```html
<!-- The core React library -->
<script src="https://fb.me/react-15.3.0.js"></script>
<!-- The ReactDOM Library -->
<script src="https://fb.me/react-dom-15.3.0.js"></script>
```

We've also built a [starter kit](https://facebook.github.io/react/downloads/react-15.3.0.zip) which might be useful if this is your first time using React. It includes a webpage with an example of using React with live code.

If you'd like to use [bower](http://bower.io), it's as easy as:

```sh
bower install --save react
```

And it's just as easy with [npm](http://npmjs.com):

```sh
npm i --save react
```

## Contribute

The main purpose of this repository is to continue to evolve React core, making it faster and easier to use. If you're interested in helping with that, then keep reading. If you're not interested in helping right now that's ok too. :) Any feedback you have about using React would be greatly appreciated.

### Building Your Copy of React

The process to build `react.js` is built entirely on top of node.js, using many libraries you may already be familiar with.

#### Prerequisites

* You have `node` installed at v4.0.0+ and `npm` at v2.0.0+.
* You have `gcc` installed or are comfortable installing a compiler if needed. Some of our `npm` dependencies may require a compliation step. On OS X, the Xcode Command Line Tools will cover this. On Ubuntu, `apt-get install build-essential` will install the required packages. Similar commands should work on other Linux distros. Windows will require some additional steps, see the [`node-gyp` installation instructions](https://github.com/nodejs/node-gyp#installation) for details.
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
# Lint the code with ESLint
grunt lint
# Wipe out build directory
grunt clean
```

### Good First Bug
To help you get your feet wet and get you familiar with our contribution process, we have a list of [good first bugs](https://github.com/facebook/react/labels/good%20first%20bug) that contain bugs which are fairly easy to fix.  This is a great place to get started.


### License

React is [BSD licensed](./LICENSE). We also provide an additional [patent grant](./PATENTS).

React documentation is [Creative Commons licensed](./LICENSE-docs).

Examples provided in this repository and in the documentation are [separately licensed](./LICENSE-examples).

### More…

There's only so much we can cram in here. To read more about the community and guidelines for submitting pull requests, please read the [Contributing document](CONTRIBUTING.md).

## Troubleshooting
See the [Troubleshooting Guide](https://github.com/facebook/react/wiki/Troubleshooting)

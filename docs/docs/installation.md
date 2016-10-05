---
id: installation
title: Installation
permalink: docs/installation.html
redirect_from: "docs/index.html"
redirect_from: "downloads.html"
next: hello-world.html
---

React is flexible and can be used in a variety of projects. You can create new apps with it, but you can also gradually introduce it into an existing codebase without doing a rewrite.

## Trying Out React

If you're just interested in playing around with React, you can use JSFiddle. Try starting from [this Hello World example code](https://jsfiddle.net/cnguj5va/). You don't need to install anything; you can just modify the code and click "Run" to see if it works.

If you prefer to use your own text editor, you can also download [this HTML file](/react/downloads/single-file-example.html), edit it, and open it from the local filesystem in your browser. It does a slow runtime code transformation, so don't use it in production.

## Creating a Single Page Application

[Create React App](http://github.com/facebookincubator/create-react-app) is the best way to starting building a new React single page application. It sets up your development environment so that you can use the latest JavaScript features, provides a nice developer experience, and optimizes your app for production.

```bash
npm install -g create-react-app
create-react-app hello-world
cd hello-world
npm start
```

Create React App doesn't handle backend logic or databases; it just creates a frontend build pipeline, so you can use it with any backend you want. It uses Webpack, Babel and ESLint under the hood, but configures them for you.

## Adding React to an Existing Application

### Using npm

We recommend using React from npm with a bundler like [browserify](http://browserify.org/) or [webpack](https://webpack.github.io/). If you use npm for client package management, you can install React with:

```bash
npm install --save react react-dom
```

and import it from your code with something like:

```js
import React from 'react';
import ReactDOM from 'react-dom';

class App extends React.Component {
  render() {
    return <div>Hello world!</div>;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
```

This code renders into an HTML element with the id of `root` so you need `<div id="root"></div>` somewhere in your HTML file. When you use React in this way, you should be transpiling your JavaScript using `babel` with the `es2015` and `react` presets.

If you use Bower, React is available via the `react` package.

### Enabling ES6 and JSX

We recommend using React with Babel to let you use ES6 and JSX in your JavaScript code. ES6 is a set of modern JavaScript features that make development easier, and JSX is an extension to the JavaScript language that works nicely with React. The [Babel setup instructions](https://babeljs.io/docs/setup/) explain how to configure Babel in many different build environments. Make sure you install `babel-preset-react` and `babel-preset-es2015` and enable them in your `.babelrc`, and you're good to go.

### Using a CDN

If you don't want to use npm to manage client packages, the `react` and `react-dom` npm packages also provide UMD distributions in `dist` folders, which are hosted on a CDN:

```html
<script src="https://unpkg.com/react@15/dist/react.js"></script>
<script src="https://unpkg.com/react-dom@15/dist/react-dom.js"></script>
```

To load a specific version of `react` and `react-dom`, replace `15` with the version number.

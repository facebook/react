---
id: getting-started
title: Getting Started
permalink: docs/getting-started.html
next: tutorial.html
redirect_from: "docs/index.html"
redirect_from: "downloads.html"
---

There are several different ways to use React. The right one for you depends on how you're using it.

## Trying Out React

If you're just interested in playing around with React, you can use JSFiddle. Try starting from [this Hello World example code](https://jsfiddle.net/o9gspf3e/). You don't need to install anything; you can just modify the code and click "Run" to see if it works.

## Creating a New Application

[`create-react-app`](http://github.com/facebookincubator/create-react-app) is the best way to starting building a new React single page application. It handles webpack, babel, and live reloading, so you don't have to think about them.

```bash
npm install -g create-react-app
create-react-app hello-world
cd hello-world
npm start
```

`create-react-app` doesn't handle backend logic or databases; it just creates a frontend build pipeline, so you can use it with any backend you want.

## Adding React to an Existing Application

We recommend using React from npm with a bundler like [browserify](http://browserify.org/) or [webpack](https://webpack.github.io/). If you already have npm in your build pipeline, you can install it with:

```bash
npm install --save react react-dom
```

and import it from your code with:

```js
var React = require('react');
var ReactDOM = require('react-dom');
ReactDOM.render(<App />, document.getElementById('the-element-id'));
```

If you use Bower, React is available via the `react` package:

```bash
bower install --save react
```

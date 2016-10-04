---
id: getting-started
title: Getting Started
permalink: docs/getting-started.html
next: tutorial.html
redirect_from: "docs/index.html"
redirect_from: "downloads.html"
---

React is flexible and can be used in a variety of projects. You can create new apps with it, but you can also gradually introduce it into an existing codebase without doing a rewrite.

## Trying Out React

If you're just interested in playing around with React, you can use JSFiddle. Try starting from [this Hello World example code](https://jsfiddle.net/o9gspf3e/). You don't need to install anything; you can just modify the code and click "Run" to see if it works.

## Creating a New Application

[Create React App](http://github.com/facebookincubator/create-react-app) is the best way to starting building a new React single page application. It handles webpack, babel, and live reloading, so you don't have to think about them.

```bash
npm install -g create-react-app
create-react-app hello-world
cd hello-world
npm start
```

Create React App doesn't handle backend logic or databases; it just creates a frontend build pipeline, so you can use it with any backend you want.

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

## Using React From A CDN

If you don't have any build pipeline set up, you can still use React directly from a CDN. You also need to load `babel` from a CDN and load your scripts with type `text/babel` so that they can get transformed. This code works as a single html file:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React World!</title>
    <script src="https://unpkg.com/react@15.3.2/dist/react.js"></script>
    <script src="https://unpkg.com/react-dom@15.3.2/dist/react-dom.js"></script>
    <script src="https://unpkg.com/babel-core@5.8.38/browser.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">

      class Hello extends React.Component {
        render() {
          return <h1>Hello, world!</h1>;
        }
      }

      ReactDOM.render(
        <Hello />,
        document.getElementById('root')
      );

    </script>
  </body>
</html>
```

This setup is inefficient, because it's transforming your code at runtime. We don't recommend it in any production environment.

---
id: installation
title: Installation
permalink: docs/installation.html
redirect_from:
  - "download.html"
  - "downloads.html"
  - "docs/tooling-integration.html"
  - "docs/package-management.html"
  - "docs/language-tooling.html"
  - "docs/environments.html"
next: hello-world.html
---
<style>
.tab-hidden {
    display: none;
}
.toggler a {
    display: inline-block;
    padding: 10px 5px;
    margin: 2px;
    border: 1px solid #05A5D1;
    border-radius: 3px;
    text-decoration: none !important;
  }
</style>

React is flexible and can be used in a variety of projects. You can create new apps with it, but you can also gradually introduce it into an existing codebase without doing a rewrite.

<div class="toggler">
  <style>
    .toggler a {
      display: inline-block;
      padding: 10px 5px;
      margin: 2px;
      border: 1px solid #05A5D1;
      border-radius: 3px;
      text-decoration: none !important;
      color: #05A5D1;
    }
    .display-target-fiddle .toggler .button-fiddle,
    .display-target-newapp .toggler .button-newapp,
    .display-target-existingapp .toggler .button-existingapp {
      background-color: #05A5D1;
      color: white;
    }
    block {
      display: none;
    }
    .display-target-fiddle .fiddle,
    .display-target-newapp .newapp,
    .display-target-existingapp .existingapp {
      display: block;
    }
  </style>
  <script>
    document.querySelector('.toggler').parentElement.className += ' display-target-fiddle';
  </script>
  <span>Which of these options best describes what you want to do?</span>
  <br />
  <br />
  <a href="javascript:void(0);" class="button-fiddle" onclick="display('target', 'fiddle')">Try React</a>
  <a href="javascript:void(0);" class="button-newapp" onclick="display('target', 'newapp')">Create a New App</a>
  <a href="javascript:void(0);" class="button-existingapp" onclick="display('target', 'existingapp')">Add React to an Existing App</a>
</div>

<block class="fiddle" />

## Trying Out React

If you're just interested in playing around with React, you can use CodePen. Try starting from [this Hello World example code](http://codepen.io/gaearon/pen/rrpgNB?editors=0010). You don't need to install anything; you can just modify the code and see if it works.

If you prefer to use your own text editor, you can also <a href="/react/downloads/single-file-example.html" download="hello.html">download this HTML file</a>, edit it, and open it from the local filesystem in your browser. It does a slow runtime code transformation, so don't use it in production.

If you want to use it for a full application, there are two popular ways to get started with React: using Create React App, or adding it to an existing application.

<block class="newapp" />

## Creating a New Application

[Create React App](http://github.com/facebookincubator/create-react-app) is the best way to start building a new React single page application. It sets up your development environment so that you can use the latest JavaScript features, provides a nice developer experience, and optimizes your app for production.

```bash
npm install -g create-react-app
create-react-app my-app

cd my-app
npm start
```

Create React App doesn't handle backend logic or databases; it just creates a frontend build pipeline, so you can use it with any backend you want. It uses build tools like Babel and webpack under the hood, but works with zero configuration.

<block class="existingapp" />

## Adding React to an Existing Application

You don't need to rewrite your app to start using React.

We recommend adding React to a small part of your application, such as an individual widget, so you can see if it works well for your use case.

While React [can be used](/react/docs/react-without-es6.html) without a build pipeline, we recommend setting it up so you can be more productive. A modern build pipeline typically consists of:

* A **package manager**, such as [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/). It lets you take advantage of a vast ecosystem of third-party packages, and easily install or update them.
* A **bundler**, such as [webpack](https://webpack.js.org/) or [Browserify](http://browserify.org/). It lets you write modular code and bundle it together into small packages to optimize load time.
* A **compiler** such as [Babel](http://babeljs.io/). It lets you write modern JavaScript code that still works in older browsers.

### Installing React

We recommend using [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/) for managing front-end dependencies. If you're new to package managers, the [Yarn documentation](https://yarnpkg.com/en/docs/getting-started) is a good place to get started.

To install React with Yarn, run:

```bash
yarn init
yarn add react react-dom
```

To install React with npm, run:

```bash
npm init
npm install --save react react-dom
```

Both Yarn and npm download packages from the [npm registry](http://npmjs.com/).

### Enabling ES6 and JSX

We recommend using React with [Babel](http://babeljs.io/) to let you use ES6 and JSX in your JavaScript code. ES6 is a set of modern JavaScript features that make development easier, and JSX is an extension to the JavaScript language that works nicely with React.

The [Babel setup instructions](https://babeljs.io/docs/setup/) explain how to configure Babel in many different build environments. Make sure you install [`babel-preset-react`](http://babeljs.io/docs/plugins/preset-react/#basic-setup-with-the-cli-) and [`babel-preset-es2015`](http://babeljs.io/docs/plugins/preset-es2015/#basic-setup-with-the-cli-) and enable them in your [`.babelrc` configuration](http://babeljs.io/docs/usage/babelrc/), and you're good to go.

### Hello World with ES6 and JSX

We recommend using a bundler like [webpack](https://webpack.js.org/) or [Browserify](http://browserify.org/) so you can write modular code and bundle it together into small packages to optimize load time.

The smallest React example looks like this:

```js
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('root')
);
```

This code renders into a DOM element with the id of `root` so you need `<div id="root"></div>` somewhere in your HTML file.

Similarly, you can render a React component inside a DOM element somewhere inside your existing app written with any other JavaScript UI library.

### Development and Production Versions

By default, React includes many helpful warnings. These warnings are very useful in development. However, they make React larger and slower so you should make sure to use the production version when you deploy the app.

#### Brunch

To create an optimized production build with Brunch, just add the `-p` flag to the build command. See the [Brunch docs](http://brunch.io/docs/commands) for more details.

#### Browserify

Run Browserify with `NODE_ENV` environment variable set to `production` and use [UglifyJS](https://github.com/mishoo/UglifyJS) as the last build step so that development-only code gets stripped out.

#### Create React App

If you use [Create React App](https://github.com/facebookincubator/create-react-app), `npm run build` will create an optimized build of your app in the `build` folder.

#### Rollup

Use [rollup-plugin-replace](https://github.com/rollup/rollup-plugin-replace) plugin together with [rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-commonjs) (in that order) to remove development-only code. [See this gist](https://gist.github.com/Rich-Harris/cb14f4bc0670c47d00d191565be36bf0) for a complete setup example.

#### Webpack

Include both `DefinePlugin` and `UglifyJsPlugin` into your production Webpack configuration as described in [this guide](https://webpack.js.org/guides/production-build/).

### Using a CDN

If you don't want to use npm to manage client packages, the `react` and `react-dom` npm packages also provide single-file distributions in `dist` folders, which are hosted on a CDN:

```html
<script src="https://unpkg.com/react@15/dist/react.js"></script>
<script src="https://unpkg.com/react-dom@15/dist/react-dom.js"></script>
```

The versions above are only meant for development, and are not suitable for production. Minified and optimized production versions of React are available at:

```html
<script src="https://unpkg.com/react@15/dist/react.min.js"></script>
<script src="https://unpkg.com/react-dom@15/dist/react-dom.min.js"></script>
```

To load a specific version of `react` and `react-dom`, replace `15` with the version number.

If you use Bower, React is available via the `react` package.

<script>
/**
 * The code below is based on a snippet from React Native Getting Started page.
 */

// Convert <div>...<span><block /></span>...</div>
// Into <div>...<block />...</div>
var blocks = document.getElementsByTagName('block');
for (var i = 0; i < blocks.length; ++i) {
  var block = blocks[i];
  var span = blocks[i].parentNode;
  var container = span.parentNode;
  container.insertBefore(block, span);
  container.removeChild(span);
}
// Convert <div>...<block />content<block />...</div>
// Into <div>...<block>content</block><block />...</div>
blocks = document.getElementsByTagName('block');
for (var i = 0; i < blocks.length; ++i) {
  var block = blocks[i];
  while (block.nextSibling && block.nextSibling.tagName !== 'BLOCK') {
    block.appendChild(block.nextSibling);
  }
}
function display(type, value) {
  var container = document.getElementsByTagName('block')[0].parentNode;
  container.className = 'display-' + type + '-' + value + ' ' +
    container.className.replace(RegExp('display-' + type + '-[a-z]+ ?'), '');
}

// If we are coming to the page with a hash in it (i.e. from a search, for example), try to get
// us as close as possible to the correct platform and dev os using the hashtag and block walk up.
var foundHash = false;
if (window.location.hash !== '' && window.location.hash !== 'content') { // content is default
  // Hash links are added a bit later so we wait for them.
  window.addEventListener('DOMContentLoaded', selectTabForHashLink);
}

function selectTabForHashLink() {
  var hashLinks = document.querySelectorAll('a.hash-link');
  for (var i = 0; i < hashLinks.length && !foundHash; ++i) {
    if (hashLinks[i].hash === window.location.hash) {
      var parent = hashLinks[i].parentElement;
      while (parent) {
        if (parent.tagName === 'BLOCK') {
          var target = null;
          if (parent.className.indexOf('fiddle') > -1) {
            target = 'fiddle';
          } else if (parent.className.indexOf('newapp') > -1) {
            target = 'newapp';
          } else if (parent.className.indexOf('existingapp') > -1) {
            target = 'existingapp';
          } else {
            break; // assume we don't have anything.
          }
          display('target', target);
          foundHash = true;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }
}
</script>
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
</style>

React is flexible and can be used in a variety of projects. You can create new apps with it, but you can also gradually introduce it into an existing codebase without doing a rewrite.

<div class="toggler">
  <style>
    .toggler li {
       display: inline-block;
       position: relative;
       top: 1px;
       padding: 10px;
       margin: 0px 2px 0px 2px;
       border: 1px solid #05A5D1;
       border-bottom-color: transparent;
       border-radius: 3px 3px 0px 0px;
       color: #05A5D1;
       background-color: transparent;
       font-size: 0.99em;
       cursor: pointer;
    }
    .toggler li:first-child {
      margin-left: 0;
    }
    .toggler li:last-child {
      margin-right: 0;
    }
    .toggler ul {
      display: inline-block;
      list-style-type: none;
      margin: 0;
      border-bottom: 1px solid #05A5D1;
      cursor: default;
    }
    @media screen and (max-width: 960px) {
      .toggler li,
      .toggler li:first-child,
      .toggler li:last-child {
        display: block;
        border-bottom-color: #05A5D1;
        border-radius: 3px;
        margin: 2px 0px 2px 0px;
      }
      .toggler ul {
        border-bottom: 0;
      }
    }
    .display-target-fiddle .toggler .button-fiddle:focus,
    .display-target-newapp .toggler .button-newapp:focus,
    .display-target-existingapp .toggler .button-existingapp:focus {
      background-color: #046E8B;
      color: white;
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
   <ul role="tablist" >
      <li id="fiddle" class="button-fiddle" aria-selected="false" role="tab" tabindex="0" aria-controls="fiddletab"
          onclick="display('target', 'fiddle')" onkeyup="keyToggle(event, 'fiddle', 'existingapp', 'newapp')">
        Try React
      </li>
      <li id="newapp" class="button-newapp" aria-selected="false" role="tab" tabindex="-1" aria-controls="newapptab"
          onclick="display('target', 'newapp')" onkeyup="keyToggle(event, 'newapp', 'fiddle', 'existingapp')">
        Create a New App
      </li>
      <li id="existingapp" class="button-existingapp" aria-selected="false" role="tab" tabindex="-1" aria-controls="existingapptab"
          onclick="display('target', 'existingapp')" onkeyup="keyToggle(event, 'existingapp', 'newapp', 'fiddle')">
        Add React to an Existing App
      </li>
    </ul>
</div>

<block id="fiddletab" role="tabpanel" class="fiddle"  />

## Trying Out React

If you're just interested in playing around with React, you can use CodePen. Try starting from [this Hello World example code](http://codepen.io/gaearon/pen/rrpgNB?editors=0010). You don't need to install anything; you can just modify the code and see if it works.

If you prefer to use your own text editor, you can also <a href="/react/downloads/single-file-example.html" download="hello.html">download this HTML file</a>, edit it, and open it from the local filesystem in your browser. It does a slow runtime code transformation, so don't use it in production.

If you want to use it for a full application, there are two popular ways to get started with React: using Create React App, or adding it to an existing application.

<block id="newapptab" role="tabpanel" class="newapp" />

## Creating a New Application

[Create React App](http://github.com/facebookincubator/create-react-app) is the best way to start building a new React single page application. It sets up your development environment so that you can use the latest JavaScript features, provides a nice developer experience, and optimizes your app for production.

```bash
npm install -g create-react-app
create-react-app my-app

cd my-app
npm start
```

Create React App doesn't handle backend logic or databases; it just creates a frontend build pipeline, so you can use it with any backend you want. It uses build tools like Babel and webpack under the hood, but works with zero configuration.

When you're ready to deploy to production, running `npm run build` will create an optimized build of your app in the `build` folder. You can learn more about Create React App [from its README](https://github.com/facebookincubator/create-react-app#create-react-app-) and the [User Guide](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#table-of-contents).

<block id="existingapptab" role="tabpanel" class="existingapp" />

## Adding React to an Existing Application

You don't need to rewrite your app to start using React.

We recommend adding React to a small part of your application, such as an individual widget, so you can see if it works well for your use case.

While React [can be used](/react/docs/react-without-es6.html) without a build pipeline, we recommend setting it up so you can be more productive. A modern build pipeline typically consists of:

* A **package manager**, such as [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/). It lets you take advantage of a vast ecosystem of third-party packages, and easily install or update them.
* A **bundler**, such as [webpack](https://webpack.js.org/) or [Browserify](http://browserify.org/). It lets you write modular code and bundle it together into small packages to optimize load time.
* A **compiler** such as [Babel](http://babeljs.io/). It lets you write modern JavaScript code that still works in older browsers.

### Installing React

>**Note:**
>
>Once installed, we strongly recommend setting up a [production build process](/react/docs/optimizing-performance.html) to ensure you're using the fast version of React in production.

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

[Learn more about integrating React with existing code.](/react/docs/integrating-with-other-libraries.html#integrating-with-other-view-libraries)

### Development and Production Versions

By default, React includes many helpful warnings. These warnings are very useful in development.

**However, they make the development version of React larger and slower so you should use the production version when you deploy the app.**

Learn [how to tell if your website is serving the right version of React](/react/docs/optimizing-performance.html#use-the-production-build), and how to configure the production build process most efficiently:

* [Creating a Production Build with Create React App](/react/docs/optimizing-performance.html#create-react-app)
* [Creating a Production Build with Single-File Builds](/react/docs/optimizing-performance.html#single-file-builds)
* [Creating a Production Build with Brunch](/react/docs/optimizing-performance.html#brunch)
* [Creating a Production Build with Browserify](/react/docs/optimizing-performance.html#browserify)
* [Creating a Production Build with Rollup](/react/docs/optimizing-performance.html#rollup)
* [Creating a Production Build with Webpack](/react/docs/optimizing-performance.html#webpack)

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

function setSelected(value){
  var tabs = document.querySelectorAll('li[role="tab"]');
  for (var i = 0; i < tabs.length; ++i) {
    var tab = tabs[i];
    if (tab.className === 'button-' + value) {
      tabs[i].setAttribute('aria-selected', 'true');
      tabs[i].setAttribute('tabindex', '0');
    } else {
      tabs[i].setAttribute('aria-selected', 'false');
      tabs[i].setAttribute('tabindex', '-1');
    }
  }
}

function keyToggle(e, value, prevTab, nextTab){
  if (e.keyCode === 37) {
    document.getElementById(prevTab).focus();
    display('target', prevTab);
  }
  if (e.keyCode === 39) {
    document.getElementById(nextTab).focus();
    display('target', nextTab);
  }
}

function display(type, value) {
  setSelected(value);
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

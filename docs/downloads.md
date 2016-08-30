---
id: downloads
title: Downloads
layout: single
permalink: downloads.html
---
Download the starter kit to get everything you need to
[get started with React](/react/docs/getting-started.html). The starter kit includes React and some simple example apps.

<div class="buttons-unit downloads">
  <a href="/react/downloads/react-{{site.react_version}}.zip" class="button">
    Download Starter Kit {{site.react_version}}
  </a>
</div>

## Development vs. Production Builds

We provide two versions of React: an uncompressed version for development and a minified version for production. The development version includes extra warnings about common mistakes, whereas the production version includes extra performance optimizations and strips all error messages.

If you're just starting out, make sure to use the development version.

## Individual Downloads

#### React {{site.react_version}} (development)
The uncompressed, development version of [react.js](https://unpkg.com/react@{{site.react_version}}/dist/react.js) and [react-dom.js](https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js) with inline documentation (you need both files).

```html
<script src="https://unpkg.com/react@{{site.react_version}}/dist/react.js"></script>
<script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js"></script>
```

#### React {{site.react_version}} (production)
The compressed, production version of [react.js](https://unpkg.com/react@{{site.react_version}}/dist/react.min.js) and [react-dom.js](https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.min.js) (you need both).

```html
<script src="https://unpkg.com/react@{{site.react_version}}/dist/react.min.js"></script>
<script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.min.js"></script>
```

#### React with Add-Ons {{site.react_version}} (development)
The uncompressed, development version of React with [optional add-ons](/react/docs/addons.html).

```html
<script src="https://unpkg.com/react@{{site.react_version}}/dist/react-with-addons.js"></script>
<script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.js"></script>
```

#### React with Add-Ons {{site.react_version}} (production)
The compressed, production version of React with [optional add-ons](/react/docs/addons.html).

```html
<script src="https://unpkg.com/react@{{site.react_version}}/dist/react-with-addons.min.js"></script>
<script src="https://unpkg.com/react-dom@{{site.react_version}}/dist/react-dom.min.js"></script>
```

> Note:
>
> We're using [unpkg](https://unpkg.com) to serve these files. This is a free service with the goal to provide a hassle-free CDN for npm package authors. React is also available on other free CDNs including [cdnjs](https://cdnjs.com/libraries/react/) and [jsDelivr](https://www.jsdelivr.com/projects/react). If you have concerns with relying on an external host, we always recommend that you download React and serve it from your own servers.

## npm

We recommend using React from npm with a bundler like [browserify](http://browserify.org/) or [webpack](https://webpack.github.io/). You can use the `react` and `react-dom` packages. After installing it using `npm install --save react react-dom`, you can use:

```js
var React = require('react');
var ReactDOM = require('react-dom');
ReactDOM.render(<App />, ...);
```

Each of the [add-ons](/react/docs/addons.html) lives in its own package.

**Note:** by default, React will be in development mode. To use React in production mode, set the environment variable `NODE_ENV` to `production` (using envify or webpack's DefinePlugin). A minifier that performs dead-code elimination such as [UglifyJS](https://github.com/mishoo/UglifyJS2) is recommended to completely remove the extra code present in development mode.

## Bower

```sh
$ bower install --save react
```

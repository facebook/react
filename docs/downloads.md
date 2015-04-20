---
id: downloads
title: Downloads
layout: single
---
Download the starter kit to get everything you need to
[get started with React](/react/docs/getting-started.html). The starter kit includes React, the in-browser JSX transformer, and some simple example apps.

<div class="buttons-unit downloads">
  <a href="/react/downloads/react-{{site.react_version}}.zip" class="button">
    Download Starter Kit {{site.react_version}}
  </a>
</div>

## Development vs. Production Builds

We provide two versions of React: an uncompressed version for development and a minified version for production. The development version includes extra warnings about common mistakes, whereas the production version includes extra performance optimizations and strips all error messages.

If you're just starting out, make sure to use the development version.

## Individual Downloads

#### <a href="https://fb.me/react-{{site.react_version}}.js">React {{site.react_version}} (development)</a>
The uncompressed, development version of React core with inline documentation.

```html
<script src="https://fb.me/react-{{site.react_version}}.js"></script>
```

#### <a href="https://fb.me/react-{{site.react_version}}.min.js">React {{site.react_version}} (production)</a>
The compressed, production version of React core.

```html
<script src="https://fb.me/react-{{site.react_version}}.min.js"></script>
```

#### <a href="https://fb.me/react-with-addons-{{site.react_version}}.js">React with Add-Ons {{site.react_version}} (development)</a>
The uncompressed, development version of React with [add-ons](/react/docs/addons.html).

```html
<script src="https://fb.me/react-with-addons-{{site.react_version}}.js"></script>
```

#### <a href="https://fb.me/react-with-addons-{{site.react_version}}.min.js">React with Add-Ons {{site.react_version}} (production)</a>
The compressed, production version of React with [add-ons](/react/docs/addons.html).

```html
<script src="https://fb.me/react-with-addons-{{site.react_version}}.min.js"></script>
```

#### <a href="https://fb.me/JSXTransformer-{{site.react_version}}.js">JSX Transformer</a>
The JSX transformer used to support [XML syntax](/react/docs/jsx-in-depth.html) in JavaScript.

```html
<script src="https://fb.me/JSXTransformer-{{site.react_version}}.js"></script>
```

All scripts are also available via [CDNJS](https://cdnjs.com/libraries/react/).

## npm

To install the JSX transformer on your computer, run:

```sh
$ npm install -g react-tools
```

For more info about the `jsx` binary, see the [Getting Started](/react/docs/getting-started.html#offline-transform) guide.

If you're using an npm-compatible packaging system like browserify or webpack, you can use the `react` package. After installing it using `npm install react` or adding `react` to `package.json`, you can use React:

```js
var React = require('react');
React.render(...);
```

If you'd like to use any [add-ons](/react/docs/addons.html), use `var React = require('react/addons');` instead.

**Note:** by default, React will be in development mode. To use React in production mode, set the environment variable `NODE_ENV` to `production`. A minifier that performs dead-code elimination such as [UglifyJS](https://github.com/mishoo/UglifyJS2) is recommended to completely remove the extra code present in development mode.

## Bower

```sh
$ bower install --save react
```

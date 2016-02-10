---
id: downloads
title: Downloads
layout: single
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
The uncompressed, development version of [react.js](https://fb.me/react-{{site.react_version}}.js) and [react-dom.js](https://fb.me/react-dom-{{site.react_version}}.js) with inline documentation (you need both files).

```html
<script src="https://fb.me/react-{{site.react_version}}.js"  integrity="sha384-xQae1pUPdAKUe0u0KUTNt09zzdwheX4VSUsV8vatqM+t6X7rta01qOzessL808ox" crossorigin="anonymous"></script>
<script src="https://fb.me/react-dom-{{site.react_version}}.js" integrity="sha384-A1t0GCrR06cTHvMjaxeSE8XOiz6j7NvWdmxhN/9z748wEvJTVk13Rr8gMzTUnd8G" crossorigin="anonymous"></script>
```

#### React {{site.react_version}} (production)
The compressed, production version of [react.js](https://fb.me/react-{{site.react_version}}.min.js) and [react-dom.js](https://fb.me/react-dom-{{site.react_version}}.min.js) (you need both).

```html
<script src="https://fb.me/react-{{site.react_version}}.min.js" integrity="sha384-zTm/dblzLXQNp3CgY+hfaC/WJ6h4XtNrePh2CW2+rO9GPuNiPb9jmthvAL+oI/dQ" crossorigin="anonymous"></script>
<script src="https://fb.me/react-dom-{{site.react_version}}.min.js" integrity="sha384-ntqCsHbLdMxT352UbhPbT7fqjE8xi4jLmQYQa8mYR+ylAapbXRfdsDweueDObf7m" crossorigin="anonymous"></script>
```

#### React with Add-Ons {{site.react_version}} (development)
The uncompressed, development version of React with [optional add-ons](/react/docs/addons.html).

```html
<script src="https://fb.me/react-with-addons-{{site.react_version}}.js" integrity="sha384-I5TF2q2QDmB31aN5lcClArdUo+WJH/Yi3hcH3PBVXFe5DYtYCFh7Jx/dmpba12zn" crossorigin="anonymous"></script>
<script src="https://fb.me/react-dom-{{site.react_version}}.js" integrity="sha384-A1t0GCrR06cTHvMjaxeSE8XOiz6j7NvWdmxhN/9z748wEvJTVk13Rr8gMzTUnd8G" crossorigin="anonymous"></script>
```

#### React with Add-Ons {{site.react_version}} (production)
The compressed, production version of React with [optional add-ons](/react/docs/addons.html).

```html
<script src="https://fb.me/react-with-addons-{{site.react_version}}.min.js" integrity="sha384-KPHTQfiYMhtsIRbZcY4ri1lBYZQbj4ePsSdzODR2Bu5L5ts3APVyqwKPBThO5Hgc" crossorigin="anonymous"></script>
<script src="https://fb.me/react-dom-{{site.react_version}}.min.js" integrity="sha384-ntqCsHbLdMxT352UbhPbT7fqjE8xi4jLmQYQa8mYR+ylAapbXRfdsDweueDObf7m" crossorigin="anonymous"></script>
```

All scripts are also available via [CDNJS](https://cdnjs.com/libraries/react/).

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

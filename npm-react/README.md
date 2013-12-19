# react

An npm package to get you immediate access to [React](http://facebook.github.io/react/),
without also requiring the JSX transformer. This is especially useful for cases where you
want to [`browserify`](https://github.com/substack/node-browserify) your module using
`React`.

## The `react` npm package has recently changed!

If you're looking for jeffbski's [React.js](https://github.com/jeffbski/react) project, it's now in `npm` as `autoflow` rather than `react`.

## Example Usage

```js

// Previously, you might access React with react-tools.
var React = require('react-tools').React;

// Now you can access React directly with react-core.
var React = require('react');

// You can also access ReactWithAddons.
var React = require('react/addons');
```


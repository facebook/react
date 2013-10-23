# react-core

An npm package to get you immediate access to `React`, without also requiring
the JSX transformer. This is especially useful for cases where you want to
[`browserify`](https://github.com/substack/node-browserify) your module using
`React`.

## Example Usage

```js

// Previously, you might access React with react-tools.
var React = require('react-tools').React;

// Now you can access React directly with react-core.
var React = require('react-core');

// You can also access ReactWithAddons.
var React = require('react-core/addons');
```


# react-core

An npm package to get you immediate access to `React`, without also requiring the JSX transformer. This is especially useful for cases where you want to [`browserify`](https://github.com/substack/node-browserify) your module using `React`.

## An Example

```js
// react-tools-test.js
var React = require('react-tools').React;
```

```js
// react-core-test.js
var React = require('react-core').React;
```

After being packaged with `browserify`, the `react-tools` test package is 645K, while the `react-core` test package is 330K. Minification & gzip bring those package sizes down further, but the `react-core` test package is consistently 50+% smaller.

# react-tools

This package compliments the usage of React. It ships with tools that are often used in conjunction.

## JSX

This package installs a `jsx` executable that can be used to transform JSX into vanilla JS. This is often used as part of a build step. This transform is also exposed as an API.

## Usage

### Command Line

```sh
jsx input > output
```

### API

```js
var reactTools = require('react-tools');

reactTools.transform(string, options);
```

# `react-dom`

This package serves as the entry point to the DOM and server renderers for React. It is intended to be paired with the generic React package, which is shipped as `react` to npm.

## Installation

```sh
npm install react react-dom
```

## Usage

### In the browser

```js
var React = require('react');
var ReactDOM = require('react-dom');

function MyComponent() {
  return <div>Hello World</div>;
}

ReactDOM.render(<MyComponent />, node);
```

### On the server

```js
var React = require('react');
var ReactDOMServer = require('react-dom/server');

function MyComponent() {
  return <div>Hello World</div>;
}

ReactDOMServer.renderToString(<MyComponent />);
```

## API

### `react-dom`

- `findDOMNode`
- `render`
- `unmountComponentAtNode`

### `react-dom/server`

- `renderToString`
- `renderToStaticMarkup`

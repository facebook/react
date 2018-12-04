# react-stream

This is an experimental package for creating custom React streaming server renderers.

**Its API is not as stable as that of React, React Native, or React DOM, and does not follow the common versioning scheme.**

**Use it at your own risk.**

## API

```js
var Renderer = require('react-stream');

var HostConfig = {
  // You'll need to implement some methods here.
  // See below for more information and examples.
};

var MyRenderer = Renderer(HostConfig);

var RendererPublicAPI = {
};

module.exports = RendererPublicAPI;
```

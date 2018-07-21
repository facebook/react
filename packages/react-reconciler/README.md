# react-reconciler

This is an experimental package for creating custom React renderers.

**Its API is not as stable as that of React, React Native, or React DOM, and does not follow the common versioning scheme.**

**Use it at your own risk.**

## API

```js
var Reconciler = require('react-reconciler');

var HostConfig = {
  // You'll need to implement some methods here.
  // See below for more information and examples.
};

var MyRenderer = Reconciler(HostConfig);

var RendererPublicAPI = {
  render(element, container, callback) {
    // Call MyRenderer.updateContainer() to schedule changes on the roots.
    // See ReactDOM, React Native, or React ART for practical examples.
  }
};

module.exports = RendererPublicAPI;
```

## Practical Examples

A "host config" is an object that you need to provide, and that describes how to make something happen in the "host" environment (e.g. DOM, canvas, console, or whatever your rendering target is). It looks like this:

```js
var HostConfig = {
  createInstance(type, props) {
    // e.g. DOM renderer returns a DOM node
  },
  // ...
  supportsMutation: true, // it works by mutating nodes
  appendChild(parent, child) {
    // e.g. DOM renderer would call .appendChild() here
  },
  // ...
};
```

**For an introduction to writing a very simple custom renderer, check out this article series:**

* **[Building a simple custom renderer to DOM](https://medium.com/@agent_hunt/hello-world-custom-react-renderer-9a95b7cd04bc)**
* **[Building a simple custom renderer to native](https://medium.com/@agent_hunt/introduction-to-react-native-renderers-aka-react-native-is-the-java-and-react-native-renderers-are-828a0022f433)**

The full list of supported methods [can be found here](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/forks/ReactFiberHostConfig.custom.js). For their signatures, we recommend looking at specific examples below.

The React repository includes several renderers. Each of them has its own host config.

The examples in the React repository are declared a bit differently than a third-party renderer would be. In particular, the `HostConfig` object mentioned above is never explicitly declared, and instead is a *module* in our code. However, its exports correspond directly to properties on a `HostConfig` object you'd need to declare in your code:

* [React ART](https://github.com/facebook/react/blob/master/packages/react-art/src/ReactART.js) and its [host config](https://github.com/facebook/react/blob/master/packages/react-art/src/ReactARTHostConfig.js)
* [React DOM](https://github.com/facebook/react/blob/master/packages/react-dom/src/client/ReactDOM.js) and its [host config](https://github.com/facebook/react/blob/master/packages/react-dom/src/client/ReactDOMHostConfig.js)
* [React Native](https://github.com/facebook/react/blob/master/packages/react-native-renderer/src/ReactNativeRenderer.js) and its [host config](https://github.com/facebook/react/blob/master/packages/react-native-renderer/src/ReactNativeHostConfig.js)

If these links break please file an issue and we’ll fix them. They intentionally link to the latest versions since the API is still evolving. If you have more questions please file an issue and we’ll try to help!

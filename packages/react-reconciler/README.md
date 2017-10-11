# react-reconciler

This is an experimental package for creating custom React renderers.

**Its API is not as stable as that of React, React Native, or React DOM, and does not follow the common versioning scheme.**

**Use it at your own risk.**

## API

```js
var Reconciler = require('react-reconciler');

var ReconcilerConfig = {
  // You'll need to implement some methods here.
  // See below for more information and examples.
};

var MyRenderer = Reconciler(ReconcilerConfig);

var RendererPublicAPI = {
  render(element, container, callback) {
    // Call MyRenderer.updateContainer() to schedule changes on the roots.
    // See ReactDOM, React Native, or React ART for practical examples.
  }
};

module.exports = RendererPublicAPI;
```

## Practical Examples

* [React ART](https://github.com/facebook/react/blob/master/src/renderers/art/ReactARTFiberEntry.js)
* [React DOM](https://github.com/facebook/react/blob/master/src/fb/ReactDOMFiberFBEntry.js)
* [React Native](https://github.com/facebook/react/blob/master/src/renderers/native/ReactNativeFiberRenderer.js)

If these links break please file an issue and we’ll fix them. They intentionally link to the latest versions since the API is still evolving.

This [third-party tutorial](https://github.com/nitin42/Making-a-custom-React-renderer) is relatively up-to-date and may be helpful.

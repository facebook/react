# react-reconciler

An npm package to let you create custom reconcilers.

## Example Usage

```js
var Reconciler = require('react-reconciler');

var ReconcilerConfig = { /* ... */ };
var Renderer = Reconciler(ReconcilerConfig);
var RendererPublicAPI = {
  render(
    element: React$Element<any>,
    container: DOMContainer,
    callback: ?Function,
  ) {
    let root = container._reactRootContainer;
    if (!root) {
      const newRoot = Renderer.createContainer(container);
      root = container._reactRootContainer = newRoot;
      // Initial mount should not be batched.
      Renderer.unbatchedUpdates(() => {
        Renderer.updateContainer(element, newRoot, null, callback);
      });
    } else {
      Renderer.updateContainer(element, root, null, callback);
    }
  }
};

module.exports = RendererPublicAPI;
```

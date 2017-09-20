# react-reconciler

An npm package to let you create custom reconcilers.

## Example Usage

```js
var createReconciler = require('react-reconciler');

var ReconcilerConfig = { /* ... */ };
var Reconciler = createReconciler(ReconcilerConfig);
var Renderer = {
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

module.exports = Renderer;
```

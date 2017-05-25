---
id: shallow-renderer
title: Shallow Renderer
permalink: docs/shallow-renderer.html
layout: docs
category: Reference
---

**Importing**

```javascript
import ReactShallowRenderer from 'react-test-renderer/shallow'; // ES6
var ReactShallowRenderer = require('react-test-renderer/shallow'); // ES5 with npm
```
### Shallow Rendering

When writing unit tests for React, shallow rendering can be helpful. Shallow rendering lets you render a component "one level deep" and assert facts about what its render method returns, without worrying about the behavior of child components, which are not instantiated or rendered. This does not require a DOM.

 - [`shallowRenderer.render()`](#shallowrenderer.render)
 - [`shallowRenderer.getRenderOutput()`](#shallowrenderer.getrenderoutput)

You can think of the shallowRenderer as a "place" to render the component you're testing, and from which you can extract the component's output.

[`shallowRenderer.render()`](#shallowrenderer.render) is similar to [`ReactDOM.render()`](/react/docs/react-dom.html#render) but it doesn't require DOM and only renders a single level deep. This means you can test components isolated from how their children are implemented.

After `shallowRenderer.render()` has been called, you can use [`shallowRenderer.getRenderOutput()`](#shallowrenderer.getrenderoutput) to get the shallowly rendered output.

You can then begin to assert facts about the output. For example, if you have the following component:

```javascript
function MyComponent() {
  return (
    <div>
      <span className="heading">Title</span>
      <Subcomponent foo="bar" />
    </div>
  );
}
```

Then you can assert:

```javascript
const ReactShallowRenderer = require('react-test-renderer/shallow');
const shallowRenderer = new ReactShallowRenderer();
shallowRenderer.render(<MyComponent />);
const result = shallowRenderer.getRenderOutput();

expect(result.type).toBe('div');
expect(result.props.children).toEqual([
  <span className="heading">Title</span>,
  <Subcomponent foo="bar" />
]);
```

Shallow testing currently has some limitations, namely not supporting refs.

We also recommend checking out Enzyme's [Shallow Rendering API](http://airbnb.io/enzyme/docs/api/shallow.html). It provides a nicer higher-level API over the same functionality.


---
id: shallow-renderer
title: Shallow Renderer
permalink: docs/shallow-renderer.html
layout: docs
category: Reference
---

**Importing**

```javascript
import ShallowRenderer from 'react-test-renderer/shallow'; // ES6
var ShallowRenderer = require('react-test-renderer/shallow'); // ES5 with npm
```

## Overview

When writing unit tests for React, shallow rendering can be helpful. Shallow rendering lets you render a component "one level deep" and assert facts about what its render method returns, without worrying about the behavior of child components, which are not instantiated or rendered. This does not require a DOM.

For example, if you have the following component:

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
import ShallowRenderer from 'react-test-renderer/shallow';

// in your test:
const renderer = new ShallowRenderer();
renderer.render(<MyComponent />);
const result = renderer.getRenderOutput();

expect(result.type).toBe('div');
expect(result.props.children).toEqual([
  <span className="heading">Title</span>,
  <Subcomponent foo="bar" />
]);
```

Shallow testing currently has some limitations, namely not supporting refs.

> Note:
>
> We also recommend checking out Enzyme's [Shallow Rendering API](http://airbnb.io/enzyme/docs/api/shallow.html). It provides a nicer higher-level API over the same functionality.

## Reference

### `shallowRenderer.render()`

You can think of the shallowRenderer as a "place" to render the component you're testing, and from which you can extract the component's output.

`shallowRenderer.render()` is similar to [`ReactDOM.render()`](/docs/react-dom.html#render) but it doesn't require DOM and only renders a single level deep. This means you can test components isolated from how their children are implemented.

### `shallowRenderer.getRenderOutput()`

After `shallowRenderer.render()` has been called, you can use `shallowRenderer.getRenderOutput()` to get the shallowly rendered output.

You can then begin to assert facts about the output.

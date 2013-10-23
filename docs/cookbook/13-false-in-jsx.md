---
id: false-in-jsx
title: False in JSX
layout: cookbook
permalink: initial-ajax.html
prev: initial-ajax.html
---

### Problem
How does `undefined` and `false` behave as attribute value and as child component?

### Solution
Renders as `id="false"`:
```js
/** @jsx React.DOM */
React.renderComponent(<div id={false} />, mountNode);
```

String "false" as input value:
```js
/** @jsx React.DOM */
React.renderComponent(<input value={false} />, mountNode);
```

No child:
```js
/** @jsx React.DOM */
React.renderComponent(<div>{false}</div>, mountNode);
```

### Discussion
The reason why the last one doesn't render as the string `"false"` as a `div` child is to allow the more common use-case: `<div>{x > 1 && You have more than one item}</div>`.

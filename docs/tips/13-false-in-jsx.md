---
id: false-in-jsx
title: False in JSX
layout: tips
permalink: false-in-jsx.html
prev: initial-ajax.html
---

Here's how `false` renders in different contexts:

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

The reason why this one doesn't render as the string `"false"` as a `div` child is to allow the more common use-case: `<div>{x > 1 && You have more than one item}</div>`.

---
id: false-in-jsx
title: False in JSX
layout: tips
permalink: false-in-jsx.html
prev: initial-ajax.html
next: communicate-between-components.html
---

Here's how `false` renders in different situations:

Renders as `id="false"`:

```js
React.render(<div id={false} />, mountNode);
```

String `"false"` as input value:

```js
React.render(<input value={false} />, mountNode);
```

No child:

```js
React.render(<div>{false}</div>, mountNode);
```

The reason why this one doesn't render as the string `"false"` as a `div` child is to allow the more common use-case: `<div>{x > 1 && 'You have more than one item'}</div>`.

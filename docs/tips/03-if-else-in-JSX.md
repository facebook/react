---
id: if-else-in-JSX
title: If-Else in JSX
layout: tips
permalink: if-else-in-JSX.html
prev: inline-styles.html
next: self-closing-tag.html
---

`if-else` statements don't work inside JSX. This is because JSX is just syntactic sugar for function calls and object construction. Take this basic example:

```js
/** @jsx React.DOM */

// This JSX:
React.renderComponent(<div id="msg">Hello World!</div>, mountNode);

// Is transformed to this JS:
React.renderComponent(React.DOM.div({id:"msg"}, "Hello World!"), mountNode);
```

This means that `if` statements don't fit in. Take this example:

```js
/** @jsx React.DOM */

// This JSX:
<div id={if (condition) { 'msg' }}>Hello World!</div>

// Is transformed to this JS:
React.DOM.div({id: if (condition) { 'msg' }}, "Hello World!");
```

That's not valid JS. You probably want to make use of a ternary expression:

```js
/** @jsx React.DOM */

React.renderComponent(<div id={condition ? 'msg' : ''}>Hello World!</div>, mountNode);
```

Try using it today with the [JSX compiler](/react/jsx-compiler.html).

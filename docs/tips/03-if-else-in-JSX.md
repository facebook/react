---
id: if-else-in-JSX
title: If-Else in JSX
layout: tips
permalink: if-else-in-JSX.html
prev: inline-styles.html
next: self-closing-tag.html
---

`if-else` statements don't work inside JSX, since JSX is really just sugar for functions:

```js
/** @jsx React.DOM */

// this
React.renderComponent(<div id="msg">Hello World!</div>, mountNode);
// is the same as this
React.renderComponent(React.DOM.div({id:"msg"}, "Hello World!"), mountNode);
```

Which means `<div id={if (true){ 'msg' }}>Hello World!</div>` doesn't make sense, as (if it worked) it would be compiled down to something like this `React.DOM.div({id: if (true){ 'msg' }}, "Hello World!")`, which isn't valid JS.

What you're searching for is ternary expression:

```js
/** @jsx React.DOM */

React.renderComponent(<div id={true ? 'msg' : ''}>Hello World!</div>, mountNode);
```

Try the [JSX compiler](/react/jsx-compiler.html).

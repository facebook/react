---
id: if-else-in-JSX
title: If-Else in JSX
layout: docs
permalink: if-else-in-JSX.html
---

### Problem
You want to use conditionals in JSX.

### Solution
Don't forget that JSX is really just sugar for functions:

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

### Discussion
Try the [JSX compiler](http://facebook.github.io/react/jsx-compiler.html).

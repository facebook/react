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
// This JSX:
React.render(<div id="msg">Hello World!</div>, mountNode);

// Is transformed to this JS:
React.render(React.createElement("div", {id:"msg"}, "Hello World!"), mountNode);
```

This means that `if` statements don't fit in. Take this example:

```js
// This JSX:
<div id={if (condition) { 'msg' }}>Hello World!</div>

// Is transformed to this JS:
React.createElement("div", {id: if (condition) { 'msg' }}, "Hello World!");
```

That's not valid JS. You probably want to make use of a ternary expression:

```js
React.render(<div id={condition ? 'msg' : ''}>Hello World!</div>, mountNode);
```

You can also use ternary expression to determine which tags or components should be used.

```js
var loginButton = isLoggedIn ? (
    <cite>Hello!</cite>
) : (
    <strong>Log in, please...</strong>
);

var signupButton = isLoggedIn ? null : <SignUpButton/>;

return (
  <nav>
    {loginButton}
    {signupButton}
  </nav>
);
```

Try using it today with the [JSX compiler](/react/jsx-compiler.html).

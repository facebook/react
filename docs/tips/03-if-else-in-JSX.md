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

If a ternary expression isn't robust enough, you can use `if` statements to determine which
components should be used.

```js
var loginButton;
if (loggedIn) {
  loginButton = <LogoutButton />;
} else {
  loginButton = <LoginButton />;
}

return (
  <nav>
    <Home />
    {loginButton}
  </nav>
)
```

Try using it today with the [JSX compiler](/react/jsx-compiler.html).

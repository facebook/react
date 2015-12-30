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
ReactDOM.render(<div id="msg">Hello World!</div>, mountNode);

// Is transformed to this JS:
ReactDOM.render(React.createElement("div", {id:"msg"}, "Hello World!"), mountNode);
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
ReactDOM.render(<div id={condition ? 'msg' : null}>Hello World!</div>, mountNode);
```

If a ternary expression isn't robust enough, you can use `if` statements outside of your JSX to determine which components should be used:

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
);
```

Or if you prefer a more "inline" aesthetic, define [immediately-invoked function expressions](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression) _inside_ your JSX:

```js
return (
  <section>
    <h1>Color</h1>
    <h3>Name</h3>
    <p>{this.state.color || "white"}</p>
    <h3>Hex</h3>
    <p>
      {(() => {
        switch (this.state.color) {
          case "red":   return "#FF0000";
          case "green": return "#00FF00";
          case "blue":  return "#0000FF";
          default:      return "#FFFFFF";
        }
      })()}
    </p>
  </section>
);
```

> Note:
>
> In the example above, an ES6 [arrow function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) is utilized to lexically bind the value of `this`.

Try using it today with the [Babel REPL](https://babeljs.io/repl/).

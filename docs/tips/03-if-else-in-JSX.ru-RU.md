---
id: if-else-in-JSX-ru-RU
title: If-Else в JSX
layout: tips
permalink: tips/if-else-in-JSX-ru-RU.html
prev: inline-styles-ru-RU.html
next: self-closing-tag-ru-RU.html
---

Некоторые конструкции, такие как `if-else`, нельзя использовать внутри JSX, так как JSX в результате преобразуется в вызов функции JS, как показано в примере:

```js
// JSX:
ReactDOM.render(<div id="msg">Hello World!</div>, mountNode);

// Преобразованный в JS:
ReactDOM.render(React.createElement("div", {id:"msg"}, "Hello World!"), mountNode);
```

Это означает что оператор `if` нельзя встроить таким образом:

```js
// JSX:
<div id={if (condition) { 'msg' }}>Hello World!</div>

// Преобразованный в JS:
React.createElement("div", {id: if (condition) { 'msg' }}, "Hello World!");
```

В результате преобразования получается неверный JS код. В таких случаях используется тернарный условный оператор:

```js
ReactDOM.render(<div id={condition ? 'msg' : null}>Hello World!</div>, mountNode);
```

Если тернарного оператора недостаточно, вы можете вынести оператор `if`, определяющий выбор компонентов, вне JSX:

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

Также вы можете обернуть код в [немедленно вызываемую функцию](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression) и расположить её _внутри_ JSX.

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

> Примечание:
>
> В приведенном выше примере, используется [функция-стрелка](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) из ES6 для связи со значением `this`.

Вы можете попробовать этот синтаксис внутри [Babel REPL](https://babeljs.io/repl/).

---
id: if-else-in-JSX-ko-KR
title: JSX에서 If-Else
layout: tips
permalink: if-else-in-JSX-ko-KR.html
prev: inline-styles-ko-KR.html
next: self-closing-tag-ko-KR.html
---

JSX 안에서는 `if-else` 구문이 작동하지 않습니다. 왜냐하면 JSX가 그저 함수 호출과 객체 생성의 편의 문법이기 때문입니다. 다음의 기본적인 예제를 살펴봅시다.

```js
// 이 JSX 코드는
ReactDOM.render(<div id="msg">Hello World!</div>, mountNode);

// 다음의 JS 코드로 변환됩니다.
ReactDOM.render(React.createElement("div", {id:"msg"}, "Hello World!"), mountNode);
```

그렇기 때문에 `if` 구문을 넣을 수 없습니다. 다음 예제를 봅시다.

```js
// 이 JSX 코드는
<div id={if (condition) { 'msg' }}>Hello World!</div>

// 다음의 JS 코드로 변환됩니다.
React.createElement("div", {id: if (condition) { 'msg' }}, "Hello World!");
```

이는 올바른 JS가 아닙니다. 대신 삼항 연산자를 사용할 수 있습니다.

```js
ReactDOM.render(<div id={condition ? 'msg' : ''}>Hello World!</div>, mountNode);
```

삼항 연산자가 충분하지 않다면 JSX구문 밖에서 `if` 문을 사용해 어떤 컴포넌트가 사용될 지 결정할 수 있습니다.

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

"inline"을 좀더 선호한다면, JSX _안에_ [즉시 평가되는 함수 표현식](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression)을 선언하세요.

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

> 주의:
>
> 위의 예제에 있는 ES6 [화살표 함수](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)는 `this`의 값을 구문적으로 바인드하기위해 사용되었습니다.

[Babel REPL](https://babeljs.io/repl/)로 지금 바로 사용해보세요.

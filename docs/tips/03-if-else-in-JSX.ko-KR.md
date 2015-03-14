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
React.render(<div id="msg">Hello World!</div>, mountNode);

// 다음의 JS 코드로 변환됩니다.
React.render(React.createElement("div", {id:"msg"}, "Hello World!"), mountNode);
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
React.render(<div id={condition ? 'msg' : ''}>Hello World!</div>, mountNode);
```

삼항 연산자가 충분하지 않다면 `if` 문을 사용해 어떤 컴포넌트가 사용될 지 결정할 수 있습니다.

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

[JSX 컴파일러](/react/jsx-compiler.html)로 지금 바로 사용해보세요.

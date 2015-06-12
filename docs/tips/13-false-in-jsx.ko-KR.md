---
id: false-in-jsx-ko-KR
title: JSX에서 False
layout: tips
permalink: false-in-jsx-ko-KR.html
prev: initial-ajax-ko-KR.html
next: communicate-between-components-ko-KR.html
---

`false` 렌더링이 여러 상황에서 어떻게 다뤄지는지 봅시다.

`id="false"`로 렌더링

```js
React.render(<div id={false} />, mountNode);
```

문자열 `"false"`를 입력값으로

```js
React.render(<input value={false} />, mountNode);
```

자식 없음

```js
React.render(<div>{false}</div>, mountNode);
```

`div` 자식으로 쓰인 문자열 `"false"`를 렌더링하지 않은 것은 더 일반적인 사용 사례를 허용하기 위함입니다. `<div>{x > 1 && '하나 이상의 아이템을 가졌습니다.'}</div>`

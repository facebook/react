---
id: controlled-input-null-value-ko-KR
title: 제어되는 input 내의 null 값
layout: tips
permalink: controlled-input-null-value-ko-KR.html
prev: children-props-type-ko-KR.html
next: componentWillReceiveProps-not-triggered-after-mounting-ko-KR.html
---

[제어되는 컴포넌트들](/react/docs/forms-ko-KR.html)의 `value` 속성 값을 지정하면 유저에 의해 입력값을 바꿀 수 없습니다.

`value`가 정해져 있는데도 입력값을 변경할 수 있는 문제를 겪고 있다면 실수로 `value`를 `undefined`나 `null`로 설정한 것일 수 있습니다.

아래 짧은 예제가 있습니다; 렌더링 후, 잠시 뒤에 텍스트를 고칠 수 있는 상태가 되는 것을 확인 하실 수 있습니다.

```js
React.render(<input value="hi" />, mountNode);

setTimeout(function() {
  React.render(<input value={null} />, mountNode);
}, 1000);
```

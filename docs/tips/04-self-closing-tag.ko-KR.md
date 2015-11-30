---
id: self-closing-tag-ko-KR
title: 자기 자신을 닫는 태그
layout: tips
permalink: self-closing-tag-ko-KR.html
prev: if-else-in-JSX-ko-KR.html
next: maximum-number-of-jsx-root-nodes-ko-KR.html
---

JSX에서 `<MyComponent>`는 유효하지 않고 `<MyComponent />`만 유효합니다. 모든 태그는 닫혀야 합니다. 자기 자신을 닫는 형식을 사용하거나 대응되는 닫는 태그(`</MyComponent>`)가 필요합니다.

> 주의:
>
> 모든 React 컴포넌트는 자기 자신을 닫을 수 있습니다: `<div />`. `<div></div>`와 동일합니다.

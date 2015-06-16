---
id: maximum-number-of-jsx-root-nodes-ko-KR
title: JSX 루트 노드의 최대 갯수
layout: tips
permalink: maximum-number-of-jsx-root-nodes-ko-KR.html
prev: self-closing-tag-ko-KR.html
next: style-props-value-px-ko-KR.html
---

현재 컴포넌트의 `render`는 한 노드만 리턴할 수 있습니다. 만약 `div` 배열을 리턴하려면, `div`, `span`과 같은 다른 컴포넌트로 한 번 더 싸주어야 합니다. 

JSX는 일반 JS로 컴파일 함을 잊지말아야 합니다. 두개의 함수를 리턴하는 것은 문법적으로 맞지 않습니다. 이와 마찬가지로, 한 삼항 연산자 안에 한개 이상의 자식 컴포넌트를 넣으면 안됩니다.

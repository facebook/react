---
id: componentWillReceiveProps-not-triggered-after-mounting-ko-KR
title: 마운트 후에는 componentWillReceiveProps가 실행되지 않음.
layout: tips
permalink: componentWillReceiveProps-not-triggered-after-mounting-ko-KR.html
prev: controlled-input-null-value-ko-KR.html
next: props-in-getInitialState-as-anti-pattern-ko-KR.html
---

`componentWillReceiveProps`는 노드가 더해진 후엔 실행되지 않습니다. 이는 설계에 의한 것입니다. [다른 생명주기 메소드](/react/docs/component-specs-ko-KR.html)에서 요구사항에 적합한 것을 찾아보세요.

이러한 이유는 `componentWillReceiveProps`에 종종 예전 props와 액션의 차이를 비교하는 로직이 들어가기 때문입니다. 마운트할 때 트리거되지 않으면, (예전 props가 없다고 해도) 메소드의 형태를 구별하는 데 도움이 됩니다.


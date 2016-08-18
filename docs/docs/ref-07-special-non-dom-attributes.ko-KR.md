---
id: special-non-dom-attributes-ko-KR
title: DOM이 아닌 특별한 어트리뷰트
permalink: docs/special-non-dom-attributes-ko-KR.html
prev: dom-differences-ko-KR.html
next: reconciliation-ko-KR.html
---

[DOM 차이점](/react/docs/dom-differences-ko-KR.html)처럼, React는 DOM에는 존재하지 않는 몇몇 어트리뷰트도 제공합니다.

- `key`: 선택적인 고유 식별자. 컴포넌트가 `render` 과정에서 섞일 때, diff 알고리즘에 의해 파괴되고, 다시 생성될 수 있습니다. 컴포넌트에 영속적인(persists) 키를 할당하면 컴포넌트가 확실히 유지되게 할 수 있습니다. 더 자세한 것은 [여기](/react/docs/multiple-components-ko-KR.html#동적-자식)에서 보세요.
- `ref`: [여기](/react/docs/more-about-refs-ko-KR.html)를 보세요.
- `dangerouslySetInnerHTML`: 생(raw) HTML을 넣을 수 있게 합니다. 주로 DOM 문자열 관리 라이브러리와의 협력하기 위해 사용합니다. 더 자세한 것은 [여기](/react/tips/dangerously-set-inner-html.html)를 보세요.

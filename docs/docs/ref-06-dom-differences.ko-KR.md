---
id: dom-differences-ko-KR
title: DOM과의 차이점
permalink: docs/dom-differences-ko-KR.html
prev: events-ko-KR.html
next: special-non-dom-attributes-ko-KR.html
---

React는 성능과 크로스 브라우저 호환성을 이유로 브라우저에 독립적인 이벤트와 DOM 시스템으로 구현되었습니다. 브라우저 DOM 구현의 일관성없는 부분들을 정리할 기회를 가졌습니다.

* 모든 DOM 프로퍼티와 어트리뷰트는 (이벤트 핸들러를 포함해) 표준 JavaScript 스타일과 일치하도록 카멜케이스를 사용해야 합니다. **하지만**, `data-*` 와 `aria-*` 어트리뷰트는 [사양을 준수해](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes#data-*) 소문자만 사용해야 합니다.
* `style` 어트리뷰트는 CSS 문자열 대신에 카멜케이스로 된 프로퍼티를 가지는 JavaScript 객체를 받습니다. 이는 DOM `style` JavaScript 프로퍼티와 일치하면서도 좀 더 효율적이며, XSS 보안 취약점을 예방할 수 있습니다.
* 모든 이벤트 객체는 W3C 사양을 준수하고, 모든 이벤트(submit을 포함해)는 W3C 사양에 따라 일으킵(bubble)니다. 좀 더 자세한 정보는 [이벤트 시스템](/react/docs/events-ko-KR.html)을 보세요.
* `onChange` 이벤트는 기대대로 동작합니다. 이 이벤트는 일관성없이 blur시점에서 발생하지 않고 폼 필드가 변경될 때만 발생합니다.[^1] 우리는 의도적으로 기존 브라우저 동작을 차단했습니다. `onChange`는 이름과 실제 동작이 다르고, React는 실시간으로 사용자 입력에 반응할 때 이 이벤트에 의존하기 때문입니다. 더 자세한 정보는 [폼](/react/docs/forms-ko-KR.html)을 보세요.
* `value`와 `checked` 폼 input 어트리뷰트, `textarea`. [자세히 보기](/react/docs/forms-ko-KR.html).

[^1]: **역주**: 일관성 없다는 표현에 대해 부연 설명하자면, 네이티브의 onChange는 변경뿐만 아니라 blur에서도 반응합니다.

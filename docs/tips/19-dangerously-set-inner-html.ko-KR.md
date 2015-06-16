---
id: dangerously-set-inner-html-ko-KR
title: Dangerously Set innerHTML
layout: tips
permalink: dangerously-set-inner-html-ko-KR.html
prev: children-undefined-ko-KR.html
---

부적절히 `innerHTML`를 사용하면 [사이트 간 스크립팅 (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) 공격에 노출됩니다. 화면의 사용자 입력을 정제하다(sanitize) 오류를 내기 쉬우며, 적절하게 사용자의 입력을 정제하지 못하면 인터넷 상 [웹 취약점의 원인](https://owasptop10.googlecode.com/files/OWASP%20Top%2010%20-%202013.pdf)이 됩니다.

우리 설계철학은 안전을 "쉽게" 얻는 것입니다. 개발자는 그들의 의도를 명시적으로 알려야만 "안전하지 않는" 연산을 할 수 있습니다. `dangerouslySetInnerHTML` prop의 이름은 의도적으로 무섭게 만든 것인데, prop 값은 문자열이 아닌 객체이고 정제된 데이터를 지정하는데 쓸 수 있습니다.

보안 영향을 완전히 이해했다면, 데이터에서 나쁜 부분을 완전히 제거하고 `__html` 키와 정제된 값을 담은 새로운 객체를 만듭시다. 여기에 JSX 문법을 쓴 예제가 있습니다.

```js
function createMarkup() { return {__html: 'First &middot; Second'}; };
<div dangerouslySetInnerHTML={createMarkup()} />
```

부주의하게 `<div dangerouslySetInnerHTML={getUsername()} />`를 쓰면 `getUsername()`가 `{__html: ''}` 객체 대신 순수 `문자열`을 반환하기 때문에 렌더링이 안되는 것이 요점입니다. `{__html:...}` 문장 속의 의도는 "type/taint" 같이 숙고하는 것입니다. 함수는 이 래퍼 객체를 사용하여 정제된 객체를 반환할 수 있는 데 뒤 따라오는 `dangerouslySetInnerHTML`에 표시할 데이터를 전달합니다. 이런 이유로 `<div dangerouslySetInnerHTML={{'{{'}}__html: getMarkup()}} />`의 형태의 코드를 작성하는 것은 추천하지 않습니다.

이 기능성은 주로 DOM 문자열을 다루는 라이브러리와 협동하기 위한 목적으로 제공하며, 포함할 HTML은 잘 정제되어야 합니다. (예: XML 검증을 통과)

더 완벽한 사용 예제를 보려면 [대문](/react/)의 최신 예제를 참조하세요.

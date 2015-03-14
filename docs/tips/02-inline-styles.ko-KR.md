---
id: inline-styles-ko-KR
title: 인라인 스타일
layout: tips
permalink: inline-styles-ko-KR.html
next: if-else-in-JSX-ko-KR.html
prev: introduction-ko-KR.html
---

React에서는 인라인 스타일을 문자열로 지정하지 않습니다. 대신 스타일 이름을 camelCased 형식으로 바꾼 키와 스타일의 값(주로 문자열입니다 - [자세히 알아보기](/react/tips/style-props-value-px-ko-KR.html))을 가진 객체로 지정됩니다.

```js
var divStyle = {
  color: 'white',
  backgroundImage: 'url(' + imgUrl + ')',
  WebkitTransition: 'all', // 'W'가 대문자임에 주의하세요
  msTransition: 'all' // 'ms'는 유일한 소문자 벤더 프리픽스(vendor prefix)입니다
};

React.render(<div style={divStyle}>Hello World!</div>, mountNode);
```

스타일 키는 JS에서 DOM 노드의 프로퍼티에 접근하는 것과 일관성있도록 camelCased 형식입니다. (예를 들어 `node.style.backgroundImage`) [`ms`를 제외한](http://www.andismith.com/blog/2012/02/modernizr-prefixed/) 벤더 프리픽스는 대문자로 시작해야 합니다. 따라서 `WebkitTransition`은 대문자 "W"를 사용합니다.

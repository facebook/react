---
id: style-props-value-px
title: tips.titles.style-props-value-px
layout: tips
permalink: style-props-value-px.html
prev: maximum-number-of-jsx-root-nodes.html
next: children-props-type.html
---

인라인 `style` prop에서 픽셀 값을 넣을때, React가 자동으로 숫자뒤에 "px"를 붙여줍니다. 다음과 같이 동작합니다:

```js
var divStyle = {height: 10}; // "height:10px" 로 렌더링 됩니다.
ReactDOM.render(<div style={divStyle}>Hello World!</div>, mountNode);
```

더 자세한 이야기는 [Inline Styles](/react/tips/inline-styles-ko-KR.html)를 참고해 주시기 바랍니다.

개발 하다보면 CSS 속성들이 단위 없이 그대로 유지되어야 할 때가 있을 겁니다. 아래의 프로퍼티들은 자동으로 "px"가 붙지 않는 속성 리스트 입니다:

- `animationIterationCount`
- `boxFlex`
- `boxFlexGroup`
- `boxOrdinalGroup`
- `columnCount`
- `fillOpacity`
- `flex`
- `flexGrow`
- `flexPositive`
- `flexShrink`
- `flexNegative`
- `flexOrder`
- `fontWeight`
- `lineClamp`
- `lineHeight`
- `opacity`
- `order`
- `orphans`
- `stopOpacity`
- `strokeDashoffset`
- `strokeOpacity`
- `strokeWidth`
- `tabSize`
- `widows`
- `zIndex`
- `zoom`

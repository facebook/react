---
id: style-props-value-px
title: Краткая форма значений в пикселях для атрибута style
layout: tips
permalink: tips/style-props-value-px-ru-RU.html
prev: maximum-number-of-jsx-root-nodes-ru-RU.html
next: children-props-type.html
---

React автоматически добавляет "px" для значений, которые указаны в числовом виде и находятся внутри встроенного стиля атрибута `style`, как показано в примере:

```js
var divStyle = {height: 10}; // результат "height:10px"
ReactDOM.render(<div style={divStyle}>Hello World!</div>, mountNode);
```

Подробная информация о [встроенных стилях](/react/tips/inline-styles-ru-RU.html).

В некоторых случаях необходимо оставить значение без указания единицы измерения. Список свойств для которых "px" не добавляется автоматически:

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

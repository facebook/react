---
id: inline-styles
title: Встроенные стили
layout: tips
permalink: tips/inline-styles-ru-RU.html
next: if-else-in-JSX.html
prev: introduction-ru-RU.html
---

В React, встроенные стили не указываются в виде строки. Вместо этого они определяются как объект, ключ которого является camelCase версией названия стиля, а значение которого является значением стиля, обычно строкой ([подробнее об этом далее](/react/tips/style-props-value-px.html)):

```js
var divStyle = {
  color: 'white',
  backgroundImage: 'url(' + imgUrl + ')',
  WebkitTransition: 'all', // обратите внимание на заглавную 'W'
  msTransition: 'all' // 'ms' это единственный префикс в нижнем регистре
};

ReactDOM.render(<div style={divStyle}>Hello World!</div>, mountNode);
```

Ключи стиля указываются в camelCase, в прямом соответствии с названиями свойств DOM-узлов в JS (например, `node.style.backgroundImage`). Префиксы [отличные от `ms`](http://www.andismith.com/blog/2012/02/modernizr-prefixed/) должны начинаться с заглавной буквы. Вот почему у `WebkitTransition` в верхнем регистре "W".

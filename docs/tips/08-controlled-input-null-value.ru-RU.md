---
id: controlled-input-null-value-ru-RU
title: Значение null для управляемого поля ввода
layout: tips
permalink: tips/controlled-input-null-value-ru-RU.html
prev: children-props-type-ru-RU.html
next: componentWillReceiveProps-not-triggered-after-mounting.html
---

Указание атрибута `value` для [управляемых компонентов](/react/docs/forms.html) не дает пользователю изменять значение в поле ввода, если не определить это явно.

Можно столкнуться с проблемой, когда `value` указан, но поле ввода по прежнему редактируется. В этом случае, атрибут `value` вероятно имеет значение `undefined` или `null`.

Фрагмент кода ниже показывает эту особенность. Через секунду текст в поле можно изменять.

```js
ReactDOM.render(<input value="hi" />, mountNode);

setTimeout(function() {
  ReactDOM.render(<input value={null} />, mountNode);
}, 1000);
```

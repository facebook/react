---
id: transferring-props-ru-RU
title: Передача свойств
permalink: transferring-props-ru-RU.html
prev: reusable-components-ru-RU.html
next: forms.html
---

В React распространен шаблон, заключающийся в построении абстракции вокруг компонента. Внешний компонент выставляет единственное свойство для достижения чего-то, что, возможно, имеет сложную внутреннюю реализацию.

Вы можете использовать [расширение атрибутов JSX](/react/docs/jsx-spread-ru-RU.html), чтобы объединить старые свойства с дополнительными значениями:

```javascript
<Component {...this.props} more="values" />
```

Если вы не пользуетесь JSX, вы можете пользоваться любыми вспомогательными методами, такими как `Object.assign` в ES6 или `_.extend` из Underscore:

```javascript
React.createElement(Component, Object.assign({}, this.props, { more: 'values' }));
```

Оставшаяся часть этой статьи объясняет лучшие практики. Здесь используется JSX и экспериментальный синтаксис ECMAScript.

## Передача вручную

Большую часть времени вам следует явно передавать свойства вниз по иерархии. Это гарантирует, что вы выставляете наружу только подмножество внутреннего API, в работоспособности которого вы уверены.

```javascript
function FancyCheckbox(props) {
  var fancyClass = props.checked ? 'FancyChecked' : 'FancyUnchecked';
  return (
    <div className={fancyClass} onClick={props.onClick}>
      {props.children}
    </div>
  );
}
ReactDOM.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Hello world!
  </FancyCheckbox>,
  document.getElementById('example')
);
```

Но что насчет свойства `name`? Или свойства `title`? Или `onMouseOver`?

## Передача с помощью `...` в JSX

> ЗАМЕЧАНИЕ:
>
> Синтаксис `...` является частью предложения об оставшихся свойствах и расширении свойств объектов. Это предложение на пути к тому, чтобы стать стандартом. Обратитесь к главе [Оставшиеся свойства и расширение свойств ...](/react/docs/transferring-props-ru-RU.html#-----...), чтобы узнать об этом подробнее.

Иногда передавать каждое свойство ненадежно и утомительно. В этом случае вы можете использовать [деструктурирующее присваивание](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) с оставшимися свойствами, чтобы извлечь набор неизвестных свойств.

Перечислите все свойства, которые вы хотите использовать, а следом укажите `...other`.

```javascript
var { checked, ...other } = props;
```

Так вы гарантированно передадите дальше все свойства КРОМЕ тех, которые используете сами.

```javascript
function FancyCheckbox(props) {
  var { checked, ...other } = props;
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  // `other` содержит { onClick: console.log }, но не свойство checked
  return (
    <div {...other} className={fancyClass} />
  );
}
ReactDOM.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Hello world!
  </FancyCheckbox>,
  document.getElementById('example')
);
```

> ЗАМЕЧАНИЕ:
>
> В примере выше свойство `checked` также является корректным DOM-атрибутом. Если бы вы не использовали таким образом деструктурирование, вы бы могли ненароком передать это свойство дальше.

Всегда используйте деструктурирование, когда передаете неизвестные `другие` свойства.

```javascript
function FancyCheckbox(props) {
  var fancyClass = props.checked ? 'FancyChecked' : 'FancyUnchecked';
  // НЕПРАВИЛЬНО: `checked` передалось бы во внутренний компонент
  return (
    <div {...props} className={fancyClass} />
  );
}
```

## Использование и передача одного и того же свойства

Если ваш компонент хочет использовать свойство, но также и передать его дальше, вы можете явно его передать с помощью `checked={checked}`. Это более предпочтительно по сравнению с передачей всего объекта `props`, так как упрощает рефакторинг и использование lint.

```javascript
function FancyCheckbox(props) {
  var { checked, title, ...other } = props;
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  var fancyTitle = checked ? 'X ' + title : 'O ' + title;
  return (
    <label>
      <input {...other}
        checked={checked}
        className={fancyClass}
        type="checkbox"
      />
      {fancyTitle}
    </label>
  );
}
```

> ЗАМЕЧАНИЕ:
>
> Порядок имеет значение. Помещая `{...other}` перед вашими JSX-свойствами, вы гарантируете, что потребитель вашего компонента не сможет их переопределить. В примере выше мы гарантировали, что поле ввода будет иметь тип `"checkbox"`.

## Оставшиеся свойства и расширение свойств `...`

Оставшиеся свойства позволяют вам извлечь остающиеся свойства из объекта в новый объект. Они исключают любые другие свойства, перечисленные в деструктурирующем выражении.

Это экспериментальная реализация [предложения в ECMAScript](https://github.com/sebmarkbage/ecmascript-rest-spread).

```javascript
var { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

> Замечание:
>
> Чтобы трансформировать оставшиеся свойства и расширения свойств с помощью Babel 6, вам необходимо установить пресет [`es2015`](https://babeljs.io/docs/plugins/preset-es2015/), плагин [`transform-object-rest-spread`](https://babeljs.io/docs/plugins/transform-object-rest-spread/) и сконфигурировать их в файле `.babelrc`.


## Передача с помощью Underscore

Если вы не используете JSX, вы можете использовать библиотеку, чтобы достигнуть того же. Underscore поддерживает `_.omit` для фильтрации свойств и `_.extend` для копирования свойств в новый объект.

```javascript
function FancyCheckbox(props) {
  var checked = props.checked;
  var other = _.omit(props, 'checked');
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  return (
    React.DOM.div(_.extend({}, other, { className: fancyClass }))
  );
}
```

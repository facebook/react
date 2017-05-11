---
id: reusable-components-ru-RU
title: Повторно используемые компоненты
permalink: reusable-components-ru-RU.html
prev: multiple-components.html
next: transferring-props.html
---

Проектируя интерфейсы, разбивайте общие элементы дизайна (кнопки, поля форм, компоненты разбивки и т.д.) на повторно используемые компоненты с хорошо определенными интерфейсами. Таким образом, в следующий раз, когда вам понадобится построить пользовательский интерфейс, вам нужно будет написать намного меньше кода. А это означает меньшее время, затраченное на разработку, меньшее количество багов и меньше байтов, переданных по сети.

## Валидация свойств

С ростом вашего приложения полезно удостовериться, что ваши компоненты используются правильно. Для этого мы даем вам возможность указывать `propTypes`. `React.PropTypes` экспортирует ряд валидаторов, с помощью которых можно проверить, что получаемые данные корректны. Когда для свойства передается некорректное значение, в JavaScript-консоли будет показано предупреждение. Заметьте, что для лучшей производительности `propTypes` проверяются только в режиме разработки. Вот пример, документирующий различные предоставляемые валидаторы:

```javascript
React.createClass({
  propTypes: {
    // Вы можете объявить, что свойство является определенным JS-примитивом.
    // По умолчанию все эти свойства опциональны.
    optionalArray: React.PropTypes.array,
    optionalBool: React.PropTypes.bool,
    optionalFunc: React.PropTypes.func,
    optionalNumber: React.PropTypes.number,
    optionalObject: React.PropTypes.object,
    optionalString: React.PropTypes.string,
    optionalSymbol: React.PropTypes.symbol,

    // Все, что может быть отрисовано: числа, строки, элементы либо массив
    // (или фрагмент), содержащий эти типы.
    optionalNode: React.PropTypes.node,

    // React-элемент.
    optionalElement: React.PropTypes.element,

    // Вы также можете объявить, что свойство является экземпляром класса.
    // Здесь используется JS-оператор instanceof.
    optionalMessage: React.PropTypes.instanceOf(Message),

    // Вы можете гарантировать, что ваше свойство ограничено заданным набором
    // значений, рассматривая его как перечисление.
    optionalEnum: React.PropTypes.oneOf(['News', 'Photos']),

    // Объект, который может принадлежать к одному из нескольких типов
    optionalUnion: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.instanceOf(Message)
    ]),

    // Массив определенного типа
    optionalArrayOf: React.PropTypes.arrayOf(React.PropTypes.number),

    // Объект со значениями свойств определенного типа
    optionalObjectOf: React.PropTypes.objectOf(React.PropTypes.number),

    // Объект, имеющий конкретную структуру
    optionalObjectWithShape: React.PropTypes.shape({
      color: React.PropTypes.string,
      fontSize: React.PropTypes.number
    }),

    // Вы можете сцепить любой вариант из вышеперечисленных с `isRequired`,
    // чтобы в случае отсутствия свойства показывалось предупреждение.
    requiredFunc: React.PropTypes.func.isRequired,

    // Значение любого типа данных
    requiredAny: React.PropTypes.any.isRequired,

    // Вы можете также указать свой валидатор. Он должен возвращать объект
    // Error, если проверка завершилась неудачно.
    customProp: function(props, propName, componentName) {
      if (!/matchme/.test(props[propName])) {
        return new Error(
          'Invalid prop `' + propName + '` supplied to' +
          ' `' + componentName + '`. Validation failed.'
        );
      }
    },

    // Вы можете также передать свой валидатор в `arrayOf` и `objectOf`.
    // Он должен возвращать объект Error, если проверка завершилась неудачно.
    // Валидатор будет вызван для каждого ключа в массиве или объекте.
    // Первые два аргумента в валидаторе - это сам массив или объект и
    // ключ текущего элемента.
    customArrayProp: React.PropTypes.arrayOf(function(propValue, key, componentName, location, propFullName) {
      if (!/matchme/.test(propValue[key])) {
        return new Error(
          'Invalid prop `' + propFullName + '` supplied to' +
          ' `' + componentName + '`. Validation failed.'
        );
      }
    })
  },
  /* ... */
});
```

### Единственный дочерний элменет

С помощью `React.PropTypes.element` вы можете указать, что только один дочерний элемент может быть передан в компонент.

```javascript
var MyComponent = React.createClass({
  propTypes: {
    children: React.PropTypes.element.isRequired
  },

  render: function() {
    return (
      <div>
        {this.props.children} // Это должен быть ровно один элемент, иначе будет показано предупреждение.
      </div>
    );
  }

});
```

## Значения свойств по умолчанию

React позволяет вам задавать значения по умолчанию для ваших `props` в очень декларативном стиле:

```javascript
var ComponentWithDefaultProps = React.createClass({
  getDefaultProps: function() {
    return {
      value: 'default value'
    };
  }
  /* ... */
});
```

Результат `getDefaultProps()` будет закэширован и использован, чтобы гарантировать значение для `this.props.value`, если таковое не было указано родительским компонентом. Так вы можете спокойно использовать ваши свойства - не прибегая к написанию повторяющегося и хрупкого кода, чтобы самостоятельно все это обрабатывать.

## Передача свойств: короткий путь

Зачастую React-компоненты используются, чтобы расширить базовый HTML-элемент каким-либо простым способом. Вам может понадобиться скопировать во внутренний HTML-элемент любые HTML-атрибуты, переданные в ваш компонент. Чтобы меньше печатать, с этой целью вы можете использовать JSX-синтаксис _расширения_:

```javascript
var CheckLink = React.createClass({
  render: function() {
    // Берет все свойства, передаваемые в CheckLink, и копирует их в <a>
    return <a {...this.props}>{'√ '}{this.props.children}</a>;
  }
});

ReactDOM.render(
  <CheckLink href="/checked.html">
    Click here!
  </CheckLink>,
  document.getElementById('example')
);
```

## Примеси

Компоненты - это наилучший способ повторного использования кода в React, но иногда очень разные компоненты могут разделять общую функциональность. Иногда это называют [сквозными задачами](https://en.wikipedia.org/wiki/Cross-cutting_concern). Для решения этой проблемы React предоставляет `примеси`.

В качестве распространенного примера можно привести компонент, желающий обновлять самого себя по таймеру. Использовать `setInterval()` легко, но важно отменять ваш интервал, когда вы больше в нем не нуждаетесь, чтобы экономить память. React предоставляет [методы жизненного цикла](/react/docs/working-with-the-browser.html#component-lifecycle), которые извещают вас, что компонент сейчас будет создан или уничтожен. Давайте создадим несложную примесь, которая с помощью этих методов предоставляет простую в использовании функцию `setInterval()`, автоматически подчищаемую при уничтожении компонента.

```javascript
var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.forEach(clearInterval);
  }
};

var TickTock = React.createClass({
  mixins: [SetIntervalMixin], // Используем примесь
  getInitialState: function() {
    return {seconds: 0};
  },
  componentDidMount: function() {
    this.setInterval(this.tick, 1000); // Вызываем метод из примеси
  },
  tick: function() {
    this.setState({seconds: this.state.seconds + 1});
  },
  render: function() {
    return (
      <p>
        React has been running for {this.state.seconds} seconds.
      </p>
    );
  }
});

ReactDOM.render(
  <TickTock />,
  document.getElementById('example')
);
```

У примесей есть полезная способность: если компонент использует множество примесей и несколько из них определяют один и тот же метод жизненного цикла (т.е. несколько примесей хотят произвести действия по очистке, когда компонент уничтожается), все эти методы жизненного цикла гарантированно будут вызваны. Методы, определенные в примесях, выполняются в порядке перечисления примесей, а после этого происходит вызов того же метода на самом компоненте.

## Классы ES6

Вы можете также определять ваши React-классы как обычный JavaScript-класс. Например, используя синтаксис классов ES6:

```javascript
class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

Этот API похож на `React.createClass`, за исключением `getInitialState`. Вместо того, чтобы предоставлять отдельный метод `getInitialState`, вы инициализируете свое собственное свойство `state` в конструкторе. Значение, которое вы устанавливаете в `this.state`, будет использовано в качестве начального состояния вашего компонента - подобно значению, возвращаемому из `getInitialState`.

Еще одно отличие состоит в том, что `propTypes` и `defaultProps` определяются как свойства конструктора, а не в теле класса.

```javascript
export class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {count: props.initialCount};
    this.tick = this.tick.bind(this);
  }
  tick() {
    this.setState({count: this.state.count + 1});
  }
  render() {
    return (
      <div onClick={this.tick}>
        Clicks: {this.state.count}
      </div>
    );
  }
}
Counter.propTypes = { initialCount: React.PropTypes.number };
Counter.defaultProps = { initialCount: 0 };
```

### Нет автоматического привязывания

Методы следуют той же семантике, что и обычные классы ES6, а именно: они не привязывают `this` к экземпляру автоматически. Вам придется явно использовать `.bind(this)` или [стрелочные функции](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Functions/Arrow_functions) `=>`:

```javascript
// Можете использовать bind(), чтобы сохранить значение `this`
<div onClick={this.tick.bind(this)}>

// Или использовать стрелочные функции
<div onClick={() => this.tick()}>
```

Мы рекомендуем привязывать ваши обработчики событий в конструкторе, чтобы они привязывались единожды для каждого экземпляра:

```javascript
constructor(props) {
  super(props);
  this.state = {count: props.initialCount};
  this.tick = this.tick.bind(this);
}
```

Теперь вы можете использовать `this.tick` напрямую, так как он уже был привязан один раз в конструкторе:

```javascript
// Он уже привязан в конструкторе
<div onClick={this.tick}>
```

Так лучше для производительности вашего приложения, особенно если вы реализуете [shouldComponentUpdate()](/react/docs/component-specs.html#updating-shouldcomponentupdate) c [неглубокими сравнениями](/react/docs/shallow-compare.html) в дочерних компонентах.

### Нет примесей

К сожалению, ES6 был запущен без какой-либо поддержки примесей. Следовательно, нет поддержки подмешивания и когда вы используете React с классами ES6. Вместо этого мы работаем над тем, чтобы такие сценарии было проще поддерживать, не прибегая к использованию примесей.

## Функции без состояния

Вы также можете определять ваши классы React как обычные функции JavaScript. Например, используя синтаксис функции без состояния:

```javascript
function HelloMessage(props) {
  return <div>Hello {props.name}</div>;
}
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

Или используя новый синтаксис стрелочных функций в ES6:

```javascript
const HelloMessage = (props) => <div>Hello {props.name}</div>;
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

Этот упрощенный API предназначен для компонентов, являющихся чистыми функциями своих свойств. Эти компоненты не должны сохранять внутреннее состояние, не имеют поддерживающих экземпляров и не имеют методов жизненного цикла компонентов. Они являются чистыми функциональными преобразованиями своих входных данных, без какого-либо поддерживающего кода.
Однако, вы все еще можете указывать `.propTypes` и `.defaultProps`, устанавливая их как свойства на функции, точно так же, как вы бы установили их на ES6-классе.

> ЗАМЕЧАНИЕ:
>
> Так как у функций без состояния нет поддерживающего экземпляра, вы не можете прикрепить ref к функциональному компоненту без состояния. Обычно с этим не возникает проблем, так как функции без состояния не предоставляют императивный API. Без императивного API с экземпляром в любом случае можно мало что сделать. Однако, если пользователь хочет найти DOM-узел функционального компонента без состояния, то следует обернуть этот компонент в компонент с состоянием (например, компонент в виде ES6-класса) и прикрепить ref к этому оборачивающему компоненту.

> ЗАМЕЧАНИЕ:
>
> В React v0.14 функциональным компонентам без состояния не позволялось возвращать `null` или `false` (можно было возвращать `<noscript />` в качестве обходного пути). Это было исправлено в React v15, и теперь функциональным компонентам без состояния разрешается возвращать `null`.

В идеальном мире большинство ваших компонентов были бы функциями без состояния, так как в будущем мы сможем совершать оптимизации производительности, специфичные для этих компонентов, избегая ненужных проверок и выделений памяти. Это шаблон, рекомендуемый к использованию по возможности.

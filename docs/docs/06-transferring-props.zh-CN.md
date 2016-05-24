---
id: transferring-props-zh-CN
title: 传递 Props
permalink: transferring-props-zh-CN.html
prev: reusable-components-zh-CN.html
next: forms-zh-CN.html
---

React 里有一个非常常用的模式就是对组件做一层抽象。组件对外公开一个简单的属性（Props）来实现功能，但内部细节可能有非常复杂的实现。

可以使用 [JSX 展开属性](/react/docs/jsx-spread-zh-CN.html) 来合并现有的 props 和其它值：

```javascript
<Component {...this.props} more="values" />
```

如果不使用 JSX，可以使用一些对象辅助方法如 ES6 的 `Object.assign` 或 Underscore `_.extend`。

```javascript
React.createElement(Component, Object.assign({}, this.props, { more: 'values' }));
```

下面的教程介绍一些最佳实践。使用了 JSX 和 试验性的ECMAScript 语法。

## 手动传递

大部分情况下你应该显式地向下传递 props。这样可以确保只公开你认为是安全的内部 API 的子集。

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

但 `name` 这个属性怎么办？还有 `title`、`onMouseOver` 这些 props？

## 在 JSX 里使用 `...` 传递

> 注意:
>
> 在下面的例子中，`--harmony ` 标志是必须的因为这个语法是ES7的实验性语法。如果用浏览器中的JSX转换器，以 `<script type="text/jsx;harmony=true">`简单的打开你脚本就行了。详见[Rest and Spread Properties ...](/react/docs/transferring-props.html#rest-and-spread-properties-...)

有时把所有属性都传下去是不安全或啰嗦的。这时可以使用 [解构赋值](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) 中的剩余属性特性来把未知属性批量提取出来。

列出所有要当前使用的属性，后面跟着 `...other`。

```javascript
var { checked, ...other } = props;
```

这样能确保把所有 props 传下去，*除了* 那些已经被使用了的。

```javascript
function FancyCheckbox(props) {
  var { checked, ...other } = props;
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  // `other` 包含 { onClick: console.log } 但 checked 属性除外
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

> 注意:
>
> 上面例子中，`checked` 属性也是一个有效的 DOM 属性。如果你没有使用解构赋值，那么可能无意中把它传下去。

在传递这些未知的 `other` 属性时，要经常使用解构赋值模式。

```javascript
function FancyCheckbox(props) {
  var fancyClass = props.checked ? 'FancyChecked' : 'FancyUnchecked';
  // 反模式：`checked` 会被传到里面的组件里
  return (
    <div {...props} className={fancyClass} />
  );
}
```

## 使用和传递同一个 Prop

如果组件需要使用一个属性又要往下传递，可以直接使用 `checked={checked}` 再传一次。这样做比传整个 `props` 对象要好，因为更利于重构和语法检查。

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

> 注意:
>
> 顺序很重要，把 `{...other}` 放到 JSX props 前面会使它不被覆盖。上面例子中我们可以保证 input 的 type 是 `"checkbox"`。

## 剩余属性和展开属性 `...`

剩余属性可以把对象剩下的属性提取到一个新的对象。会把所有在解构赋值中列出的属性剔除。

这是 [ECMAScript 草案](https://github.com/sebmarkbage/ecmascript-rest-spread) 中的试验特性。

```javascript
var { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

> 注意:
>
> 要用 Babel 6转换 rest 和 spread 属性，你需要安装 [`es2015`](https://babeljs.io/docs/plugins/preset-es2015/) preset，[`transform-object-rest-spread`](https://babeljs.io/docs/plugins/transform-object-rest-spread/) 插件并在 `.babelrc` 里配置他们.

## 使用 Underscore 来传递

如果不使用 JSX，可以使用一些库来实现相同效果。Underscore 提供 `_.omit` 来过滤属性，`_.extend` 复制属性到新的对象。

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

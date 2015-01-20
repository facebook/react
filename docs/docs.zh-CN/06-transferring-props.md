---
id: transferring-props
title: 传递属性
layout: docs.zh-CN
permalink: transferring-props.html
prev: reusable-components.html
next: forms.html
---

在React里一种常见的模式是对一个组件进行抽象封装。在组件外部暴露出一个简单的属性来做一些或许很复杂的实现细节。

你可以使用 [JSX 扩展属性](/react/docs.zh-CN/jsx-spread.html) 作为附加属性到原有属性上:

```javascript
return <Component {...this.props} more="values" />;
```

如果你不使用JSX，你可以用任何帮助对象像ES6`Object.assign`或者Underscore `_.extend`来实现：

```javascript
return Component(Object.assign({}, this.props, { more: 'values' }));
```

本教程的其余部分介绍的最佳实践，是使用JSX和实验性的ES7语法。

## 手动传递

大部分时候你应该明确的传递属性。同时确保你只是暴露了内部API的一个可以运行的子集。

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var fancyClass = this.props.checked ? 'FancyChecked' : 'FancyUnchecked';
    return (
      <div className={fancyClass} onClick={this.props.onClick}>
        {this.props.children}
      </div>
    );
  }
});
React.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Hello world!
  </FancyCheckbox>,
  document.body
);
```

但是`name`属性会怎么样呢？或者`title`属性?或者`onMouseOver`?

## 在JSX中通过`...`传递

有时候逐个传递每个属性是易错和乏味的。在这个情况下你可以使用[解构赋值](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)来设置一组未知的属性。

可以通过`...other`列出所有你想使用的属性。

```javascript
var { checked, ...other } = this.props;
```

除去你正在使用自己的那些属性，这可以确保您传递下去所有的属性。

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var { checked, ...other } = this.props;
    var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
    // `other` contains { onClick: console.log } but not the checked property
    return (
      <div {...other} className={fancyClass} />
    );
  }
});
React.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Hello world!
  </FancyCheckbox>,
  document.body
);
```

> 注意:
> 
> 在上面的例子中, 这个 `checked` 属性也是一个有效的DOM属性. 如果你不使用结构的方式，你或许在不经意间传递下去。
在传递未知`other`属性时，常用解构模式来做

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var fancyClass = this.props.checked ? 'FancyChecked' : 'FancyUnchecked';
    // ANTI-PATTERN: `checked` would be passed down to the inner component
    return (
      <div {...this.props} className={fancyClass} />
    );
  }
});
```

## 使用和传递相同的属性

如果你的组件需要使用属性但也要传递下去，你可以明确的`checked={checked}`重传下。这是最好的完全传递`this.props`对象的方式，因为它更容易重构和验证。

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var { checked, title, ...other } = this.props;
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
});
```

> 注意:
> 
> 其他问题。 过把`{...other}`放在JSX属性之前，确保您的组件的使用者不能覆盖他们。在上面的例子中，我们已经保证了输入将是类型`“复选框”`的。

## 剩下的和扩展属性 `...`

剩下的属性，可以把对象其余属性提取到一个新的对象。它不包括在解构方式列出的每个其他属性。这是一个[ES7 proposal](https://github.com/sebmarkbage/ecmascript-rest-spread)的实验性实现。

```javascript
var { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

> 注意:
>
> 使用[JSX 命令行工具](http://npmjs.org/package/react-tools) 使用 `--harmony` 标志 来激活实验性ES7语法.

## 通过Underscore传递 

如果你没有使用JSX，你可以使用一个现有的类似模式的库。Underscore支持`_.omit`过滤外部属性和`_.extend`复制属性到一个新的对象上。

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var checked = this.props.checked;
    var other = _.omit(this.props, 'checked');
    var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
    return (
      React.DOM.div(_.extend({}, other, { className: fancyClass }))
    );
  }
});
```

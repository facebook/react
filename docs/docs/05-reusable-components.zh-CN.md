---
id: reusable-components-zh-CN
title: 可复用组件
permalink: docs/reusable-components-zh-CN.html
prev: multiple-components-zh-CN.html
next: transferring-props-zh-CN.html
---

设计接口的时候，把通用的设计元素（按钮，表单框，布局组件等）拆成接口良好定义的可复用的组件。这样，下次开发相同界面程序时就可以写更少的代码，也意义着更高的开发效率，更少的 Bug 和更少的程序体积。

## Prop 验证

随着应用不断变大，保证组件被正确使用变得非常有用。为此我们引入 `propTypes`。`React.PropTypes` 提供很多验证器 (validator) 来验证传入数据的有效性。当向 props 传入无效数据时，JavaScript 控制台会抛出警告。注意为了性能考虑，只在开发环境验证 `propTypes`。下面用例子来说明不同验证器的区别：

```javascript
React.createClass({
  propTypes: {
    // 可以声明 prop 为指定的 JS 基本类型。默认
    // 情况下，这些 prop 都是可传可不传的。
    optionalArray: React.PropTypes.array,
    optionalBool: React.PropTypes.bool,
    optionalFunc: React.PropTypes.func,
    optionalNumber: React.PropTypes.number,
    optionalObject: React.PropTypes.object,
    optionalString: React.PropTypes.string,
    optionalSymbol: React.PropTypes.symbol,

    // 所有可以被渲染的对象：数字，
    // 字符串，DOM 元素或包含这些类型的数组(or fragment) 。
    optionalNode: React.PropTypes.node,

    // React 元素
    optionalElement: React.PropTypes.element,

    // 你同样可以断言一个 prop 是一个类的实例。
    // 用 JS 的 instanceof 操作符声明 prop 为类的实例。
    optionalMessage: React.PropTypes.instanceOf(Message),

    // 你可以用 enum 的方式
    // 确保你的 prop 被限定为指定值。
    optionalEnum: React.PropTypes.oneOf(['News', 'Photos']),

    // 指定的多个对象类型中的一个
    optionalUnion: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.instanceOf(Message)
    ]),

    // 指定类型组成的数组
    optionalArrayOf: React.PropTypes.arrayOf(React.PropTypes.number),

    // 指定类型的属性构成的对象
    optionalObjectOf: React.PropTypes.objectOf(React.PropTypes.number),

    // 特定形状参数的对象
    optionalObjectWithShape: React.PropTypes.shape({
      color: React.PropTypes.string,
      fontSize: React.PropTypes.number
    }),

    // 你可以在任意东西后面加上 `isRequired`
    // 来确保 如果 prop 没有提供 就会显示一个警告。
    requiredFunc: React.PropTypes.func.isRequired,

    // 不可空的任意类型
    requiredAny: React.PropTypes.any.isRequired,

    // 你可以自定义一个验证器。如果验证失败需要返回一个 Error 对象。
    // 不要直接使用 `console.warn` 或抛异常，
    // 因为这在 `oneOfType` 里不起作用。
    customProp: function(props, propName, componentName) {
      if (!/matchme/.test(props[propName])) {
        return new Error('Validation failed!');
      }
    }
  },
  /* ... */
});
```

### Single Child

用  `React.PropTypes.element` 你可以指定仅有一个子级能被传送给组件

```javascript
var MyComponent = React.createClass({
  propTypes: {
    children: React.PropTypes.element.isRequired
  },

  render: function() {
    return (
      <div>
        {this.props.children} // 这里必须是一个元素否则就会警告
      </div>
    );
  }

});
```

## 默认 Prop 值

React 支持以声明式的方式来定义 `props` 的默认值。

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

当父级没有传入 props 时，`getDefaultProps()` 可以保证  `this.props.value` 有默认值，注意 `getDefaultProps` 的结果会被 *缓存*。得益于此，你可以直接使用 props，而不必写手动编写一些重复或无意义的代码。

## 传递 Props：捷径

有一些常用的 React 组件只是对 HTML 做简单扩展。通常，你想复制任何传进你的组件的HTML属性到底层的HTML元素上。为了减少输入，你可以用 JSX _spread_  语法来完成：

```javascript
var CheckLink = React.createClass({
  render: function() {
    // 这样会把 CheckList 所有的 props 复制到 <a>
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

## Mixins

组件是 React 里复用代码的最佳方式，但是有时一些不同的组件间也需要共用一些功能。有时会被称为 [跨切面关注点](https://en.wikipedia.org/wiki/Cross-cutting_concern)。React 使用 `mixins` 来解决这类问题。

一个通用的场景是：一个组件需要定期更新。用 `setInterval()` 做很容易，但当不需要它的时候取消定时器来节省内存是非常重要的。React 提供 [生命周期方法](/react/docs/working-with-the-browser.html#component-lifecycle) 来告知你组件创建或销毁的时间。下面来做一个简单的 mixin，使用 `setInterval()` 并保证在组件销毁时清理定时器。

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
  mixins: [SetIntervalMixin], // 引用 mixin
  getInitialState: function() {
    return {seconds: 0};
  },
  componentDidMount: function() {
    this.setInterval(this.tick, 1000); // 调用 mixin 的方法
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

关于 mixin 值得一提的优点是，如果一个组件使用了多个 mixin，并用有多个 mixin 定义了同样的生命周期方法（如：多个 mixin 都需要在组件销毁时做资源清理操作），所有这些生命周期方法都保证会被执行到。方法执行顺序是：首先按 mixin 引入顺序执行 mixin 里方法，最后执行组件内定义的方法。

## ES6 Classes

你也可以以一个简单的 JavaScript 类来定义你的React classes。使用ES6 class的例子:

```javascript
class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

API近似于 `React.createClass` 除了 `getInitialState`。 你应该在构造函数里设置你的`state`，而不是提供一个单独的  `getInitialState` 方法。就像 `getInitialState` 的返回值，你赋给 `this.state` 的值会被作为组件的初始 state。

另一个不同是 `propTypes` 和 `defaultProps` 是在构造函数里被定义为属性，而不是在 class body 里。

```javascript
export class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {count: props.initialCount};
  }
  tick() {
    this.setState({count: this.state.count + 1});
  }
  render() {
    return (
      <div onClick={this.tick.bind(this)}>
        Clicks: {this.state.count}
      </div>
    );
  }
}
Counter.propTypes = { initialCount: React.PropTypes.number };
Counter.defaultProps = { initialCount: 0 };
```

### 无自动绑定

方法遵循正式的ES6 class的语义，意味着它们不会自动绑定`this`到实例上。你必须显示的使用`.bind(this)` or [箭头函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Arrow_functions) `=>`：

```javascript
// 你可以使用 bind() 来绑定 `this`
<div onClick={this.tick.bind(this)}>

// 或者你可以使用箭头函数
<div onClick={() => this.tick()}>
```

我们建议你在构造函数中绑定事件处理器，这样对于所有实例它们只需绑定一次：

```javascript
constructor(props) {
  super(props);
  this.state = {count: props.initialCount};
  this.tick = this.tick.bind(this);
}
```

现在你可以直接使用 `this.tick` 因为它已经在构造函数里绑定过一次了。

```javascript
// 它已经在构造函数里绑定过了
<div onClick={this.tick}>
```

这对应用的性能有帮助，特别是当你用 [浅层比较](/react/docs/shallow-compare.html) 实现 [shouldComponentUpdate()](/react/docs/component-specs.html#updating-shouldcomponentupdate) 时。

### 没有 Mixins

不幸的是ES6的发布没有任何mixin的支持。因此，当你在ES6 classes下使用React时不支持mixins。作为替代，我们正在努力使它更容易不依靠mixins支持这些用例。

## 无状态函数

你也可以用 JavaScript 函数来定义你的 React 类。例如使用无状态函数语法：

```javascript
function HelloMessage(props) {
  return <div>Hello {props.name}</div>;
}
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

或者使用新的ES6箭头函数:

```javascript
const HelloMessage = (props) => <div>Hello {props.name}</div>;
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

这个简化的组件API旨在用于那些纯函数态的组件 。这些组件必须没有保持任何内部状态，没有备份实例，也没有组件生命周期方法。他们纯粹的函数式的转化他们的输入，没有引用。
然而，你仍然可以以设置函数 properties 的方式来指定 `.propTypes` 和 `.defaultProps`，就像你在ES6类里设置他们那样。

> 注意：
>
> 因为无状态函数没有备份实例，你不能附加一个引用到一个无状态函数组件。 通常这不是问题，因为无状态函数不提供一个命令式的API。没有命令式的API，你就没有任何需要实例来做的事。然而，如果用户想查找无状态函数组件的DOM节点，他们必须把这个组件包装在一个有状态组件里（比如，ES6 类组件） 并且连接一个引用到有状态的包装组件。

在理想世界里，你的大多数组件都应该是无状态函数，因为将来我们可能会用避免不必要的检查和内存分配的方式来对这些组件进行优化。 如果可能，这是推荐的模式。

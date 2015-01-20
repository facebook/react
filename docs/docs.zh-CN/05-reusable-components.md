---
id: reusable-components
title: 可复用的组件
layout: docs.zh-CN
permalink: reusable-components.html
prev: multiple-components.html
next: transferring-props.html
---

在设计界面时，分解出常见的设计元素（按钮，表单字段，布局组件等）成可重用定义良好接口的组件。这样一来，下一次你需要建立一些UI，你可以写更少的代码，这意味着更快的开发时间，减少bug，并下载更少的字节。


## 属性验证

以确保您的组件的正确使用对于你的应用程序的成长是有帮助。为此，我们允许你指定`propTypes`。 `React.PropTypes`暴露了一系列验证器，可用于确保您收到的数据是有效的。当提供了一个属性是无效值，在JavaScript控制台将显示警告。请注意，由于性能原因`propTypes`只在开发模式下进行检查。这里有一个例子记录提供了不同的验证：

```javascript
React.createClass({
  propTypes: {
    // You can declare that a prop is a specific JS primitive. By default, these
    // are all optional.
    optionalArray: React.PropTypes.array,
    optionalBool: React.PropTypes.bool,
    optionalFunc: React.PropTypes.func,
    optionalNumber: React.PropTypes.number,
    optionalObject: React.PropTypes.object,
    optionalString: React.PropTypes.string,

    // Anything that can be rendered: numbers, strings, elements or an array
    // containing these types.
    optionalNode: React.PropTypes.node,

    // A React element.
    optionalElement: React.PropTypes.element,

    // You can also declare that a prop is an instance of a class. This uses
    // JS's instanceof operator.
    optionalMessage: React.PropTypes.instanceOf(Message),

    // You can ensure that your prop is limited to specific values by treating
    // it as an enum.
    optionalEnum: React.PropTypes.oneOf(['News', 'Photos']),

    // An object that could be one of many types
    optionalUnion: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.instanceOf(Message)
    ]),

    // An array of a certain type
    optionalArrayOf: React.PropTypes.arrayOf(React.PropTypes.number),

    // An object with property values of a certain type
    optionalObjectOf: React.PropTypes.objectOf(React.PropTypes.number),

    // An object taking on a particular shape
    optionalObjectWithShape: React.PropTypes.shape({
      color: React.PropTypes.string,
      fontSize: React.PropTypes.number
    }),

    // You can chain any of the above with `isRequired` to make sure a warning
    // is shown if the prop isn't provided.
    requiredFunc: React.PropTypes.func.isRequired,

    // A value of any data type
    requiredAny: React.PropTypes.any.isRequired,

    // You can also specify a custom validator. It should return an Error
    // object if the validation fails. Don't `console.warn` or throw, as this
    // won't work inside `oneOfType`.
    customProp: function(props, propName, componentName) {
      if (!/matchme/.test(props[propName])) {
        return new Error('Validation failed!');
      }
    }
  },
  /* ... */
});
```


## 默认属性值

React提供了十分直白的方式定义`prop`的默认值：

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

`getDefaultProps()`的结果将会被缓存和使用以确保即使在父级组件没有设置也有值。这可以让你安全地只管你的属性，而无需重复编写脆弱的代码来处理自身问题。


## 传递属性: 一种快捷方式

这是一个常见扩展基础HTML的React组件的简单实现方式。通常你会想复制传递HTML属性给你的组件到底层的HTML元素，又想节省打字，你可以使用JSX_spread_语法来实现这一目的：

```javascript
var CheckLink = React.createClass({
  render: function() {
    // This takes any props passed to CheckLink and copies them to <a>
    return <a {...this.props}>{'√ '}{this.props.children}</a>;
  }
});

React.render(
  <CheckLink href="/checked.html">
    Click here!
  </CheckLink>,
  document.getElementById('example')
);
```

## 单个子级

通过`React.PropTypes.element`你可以指定只有单个子级可以被传递到一个组件。

```javascript
var MyComponent = React.createClass({
  propTypes: {
    children: React.PropTypes.element.isRequired
  },

  render: function() {
    return (
      <div>
        {this.props.children} // This must be exactly one element or it will throw.
      </div>
    );
  }

});
```

## mixins

组件在React里面是最好的代码复用方式，但是有时不同的组件或许要共享一些公共的功能。这里有时叫做[横切关注点](http://en.wikipedia.org/wiki/Cross-cutting_concern). React 提供 `mixins` 来解决这类问题.

有一个普通的例子是一个组件想要定时更新自身状态。简单的做法是`setInterval()`，但当你不需要它时，重要的是要取消这个定时来节省内存。React提供了[生命周期方法](/react/docs/working-with-the-browser.html#component-lifecycle)，让你知道当组件将要被创建或销毁。我们来创建一个使用这些方法并提供一个简单的`setInterval()`函数，当你使用这个简单的mixins,在组件被摧毁时，将自动得到清理。

```javascript
var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.map(clearInterval);
  }
};

var TickTock = React.createClass({
  mixins: [SetIntervalMixin], // Use the mixin
  getInitialState: function() {
    return {seconds: 0};
  },
  componentDidMount: function() {
    this.setInterval(this.tick, 1000); // Call a method on the mixin
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

React.render(
  <TickTock />,
  document.getElementById('example')
);
```

mixins的一个很好的功能是，如果一个组件使用多个mixins和一些mixins定义相同的生命周期方法（比如，当组件被销毁，即几个混入也会做一些清理），所有的生命周期方法，保证被调用。在mixins上定义的方法按照mixins的列出顺序运行，然后在组件的方法内调用。

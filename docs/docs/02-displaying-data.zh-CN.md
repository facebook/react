---
id: displaying-data-zh-CN
title: 显示数据
layout: docs
permalink: displaying-data-zh-CN.html
prev: why-react-zh-CN.html
next: jsx-in-depth.html
---

通过用户界面，最基础可以做的事就是显示一些数据。React 让显示数据变得简单，当数据变化的时候，用户界面会自动同步更新。

## 开始

让我们看一个非常简单的例子。新建一个名为 `hello-react.html` 的文件，代码内容如下：

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Hello React</title>
    <script src="http://fb.me/react-{{site.react_version}}.js"></script>
    <script src="http://fb.me/JSXTransformer-{{site.react_version}}.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/jsx">

      // ** 在这里替换成你的代码 **

    </script>
  </body>
</html>
```

在接下去的文档中，我们只关注 JavaScript 代码，假设我们把代码插入到上面那个模板中。用下面的代码替换掉上面用来占位的注释。

```javascript
var HelloWorld = React.createClass({
  render: function() {
    return (
      <p>
        Hello, <input type="text" placeholder="Your name here" />!
        It is {this.props.date.toTimeString()}
      </p>
    );
  }
});

setInterval(function() {
  React.render(
    <HelloWorld date={new Date()} />,
    document.getElementById('example')
  );
}, 500);
```

## 被动更新 (Reactive Updates)

在浏览器中打开 `hello-react.html` ，在输入框输入你的名字。你会发现 React 在用户界面中只改变了时间， 任何你在输入框输入的内容一直保留着，即使你没有写任何代码来完成这个功能。React 为你解决了这个问题，做了正确的事。

我们想到的方法是除非不得不操作 DOM ，React 是不会去操作 DOM 的。**它用一种更快的内置仿造的 DOM 来操作差异，为你计算出出效率最高的 DOM 改变**。

对这个组件的输入称为 `props` - "properties"的缩写。得益于 JSX 语法，它们通过参数传递。你必须知道在组件里，这些属性是不可改变的，也就是说 **`this.props` 是只读的**。

## 组件就像是函数

React 组件非常简单。你可以认为它们就是简单的函数，接受 `props` 和 `state` (后面会讨论) 作为参数，然后渲染出 HTML。正是应为它们是这么的简单，这使得它们非常容易理解。

> 注意:
>
> **只有一个限制**: React 组件只能渲染单个根节点。如果你想要返回多个节点，它们*必须*被包含在同一个节点里。

## JSX 语法

我们坚信组件是正确方法去做关注分离，而不是通过“模板”和“展示逻辑”。我们认为标签和生成它的代码是紧密相连的。此外，展示逻辑通常是很复杂的，通过模板语言实现这些逻辑会产生大量代码。

我们得出解决这个问题最好的方案是通过 JavaScript 直接生成模板，这样你就可以用一个真正语言的所有表达能力去构建用户界面。为了使这变得更简单，我们做了一个非常简单、**可选**类似 HTML 语法 ，通过函数调用即可生成模板的编译器，称为 JSX。

**JSX 让你可以用 HTML 语法去写 JavaScript 函数调用** 为了在 React 生成一个链接，通过纯 JavaScript 你可以这么写： `React.createElement('a', {href: 'http://facebook.github.io/react/'}, 'Hello React!')`。通过 JSX 这就变成了 `<a href="http://facebook.github.io/react/">Hello React!</a>`。我们发现这会使搭建 React 应用更加简单，设计师也偏向用这用语法，但是每个人可以有它们自己的工作流，所以**JSX 不是必须用的。**

JSX 非常小；上面“hello, world”的例子使用了 JSX 所有的特性。想要了解更多，请看 [深入理解 JSX](/react/docs/jsx-in-depth.html)。或者直接使用[在线 JSX 编译器](/react/jsx-compiler.html)观察变化过程。

JSX 类似于 HTML，但不是完全一样。参考[JSX gotchas](/react/docs/jsx-gotchas.html) 学习关键区别。

最简单开始学习 JSX 的方法就是使用浏览器端的 `JSXTransformer`。我们强烈建议你不要在生产环境中使用它。你可以通过我们的命令行工具 [react-tools](http://npmjs.org/package/react-tools) 包来预编译你的代码。

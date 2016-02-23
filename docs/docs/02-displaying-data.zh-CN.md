---
id: displaying-data-zh-CN
title: 显示数据
permalink: displaying-data-zh-CN.html
prev: why-react-zh-CN.html
next: interactivity-and-dynamic-uis-zh-CN.html
---

用户界面能做的最基础的事就是显示一些数据。React 让显示数据变得简单，当数据变化的时候，用户界面会自动同步更新。

## 开始

让我们看一个非常简单的例子。新建一个名为 `hello-react.html` 的文件，代码内容如下：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React</title>
    <script src="https://fb.me/react-{{site.react_version}}.js"></script>
    <script src="https://fb.me/react-dom-{{site.react_version}}.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">

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
  ReactDOM.render(
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

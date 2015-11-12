---
id: tooling-integration-zh-CN
title: 工具集成
permalink: tooling-integration-zh-CN.html
prev: more-about-refs-zh-CN.html
next: addons-zh-CN.html
---

每个项目使用一个不同的系统来建立和部署JavaScript.我们努力使React尽可能环境无关。

## React

### CDN-hosted React

我们提供了CDN-hosted版本的React[在我们的下载页面](/react/downloads.html).这些预构建的文件使用UMD模块格式。将他们放进一个简单的`<script>` 标签将会注入一个`React` 全局变量到你的环境里。这也同样在CommonJS 和 AMD 环境里开箱即用。


### 使用 master

我们[在我们的 GitHub repository](https://github.com/facebook/react)有从`master`构建的说明。我们在`build/modules` 下构建了一个CommonJS模块的树，你可以把它放到任何支持CommonJS的环境或者打包工具里。

## JSX

### 浏览器中的JSX转化

如果你喜欢使用JSX，Babel提供了一个被称为browser.js的[开发用的浏览器中的 ES6 和 JSX 转换器](http://babeljs.io/docs/usage/browser/) ，它可以从`babel-core` npm release 或者[CDNJS](http://cdnjs.com/libraries/babel-core) 中 include。Include `<script type="text/babel">` 标记来使用 JSX 转换器.

> 注意:
>
> 浏览器中的JSX转换器相当大并且导致额外的本可避免的客户端计算。不要在生产环境中使用 - 见下一节。


### 投入生产: 预编译 JSX

如果你有[npm](https://www.npmjs.com/)，你可以运行 `npm install -g babel`. Babel 对React v0.12 和 v0.13 有内建的支持。 标签被自动转化为它们的等价物`React.createElement(...)`, `displayName` 被自动推断并添加到所有的React.createClass 调用。

这个工具会把使用JSX语法的文件转化为简单的可直接在浏览器运行的JavaScript文件。它同样将为你监视目录并自动转化文件当他们变动时；例如：`babel --watch src/ --out-dir lib/`.

默认模式下带有`.js`后缀的JSX文件被转化。运行 `babel --help` 获取更多关于如何使用 Babel 的信息。

输出的例子：

```
$ cat test.jsx
var HelloMessage = React.createClass({
  render: function() {
    return <div>Hello {this.props.name}</div>;
  }
});

ReactDOM.render(<HelloMessage name="John" />, mountNode);
$ babel test.jsx
"use strict";

var HelloMessage = React.createClass({
  displayName: "HelloMessage",

  render: function render() {
    return React.createElement(
      "div",
      null,
      "Hello ",
      this.props.name
    );
  }
});

ReactDOM.render(React.createElement(HelloMessage, { name: "John" }), mountNode);
```


### 有帮助的开源项目

开源社区已经创建了一些集成JSX到数个编辑器和构建系统的工具。参见[JSX integrations](https://github.com/facebook/react/wiki/Complementary-Tools#jsx-integrations) 查看全部列表。

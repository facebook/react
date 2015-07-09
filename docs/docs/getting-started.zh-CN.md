---
id: getting-started-zh-CN
title: 入门教程
permalink: getting-started-zh-CN.html
next: tutorial-zh-CN.html
redirect_from: "docs/index-zh-CN.html"
---

## JSFiddle

开始 Hack React 的最简单的方法是用下面 JSFiddle 的Hello Worlds：

 * **[React JSFiddle](https://jsfiddle.net/reactjs/69z2wepo/)**
 * [React JSFiddle without JSX](https://jsfiddle.net/reactjs/5vjqabv3/)

## 入门教程包 (Starter Kit)

开始先下载入门教程包。

<div class="buttons-unit downloads">
  <a href="/react/downloads/react-{{site.react_version}}.zip" class="button">
    下载入门教程 {{site.react_version}}
  </a>
</div>

在入门教程包的根目录，创建一个含有下面代码的 `helloworld.html`。

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React!</title>
    <script src="build/react.js"></script>
    <script src="build/JSXTransformer.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/jsx">
      React.render(
        <h1>Hello, world!</h1>,
        document.getElementById('example')
      );
    </script>
  </body>
</html>
```

在 JavaScript 代码里写着 XML 格式的代码称为 JSX；可以去 [JSX 语法](/react/docs/jsx-in-depth.html) 里学习更多 JSX 相关的知识。为了把 JSX 转成标准的 JavaScript，我们用 `<script type="text/jsx">` 标签包裹着含有 JSX 的代码，然后引入 `JSXTransformer.js` 库来实现在浏览器里的代码转换。

### 分离文件

你的 React JSX 代码文件可以写在另外的文件里。新建下面的 `src/helloworld.js`。

```javascript
React.render(
  <h1>Hello, world!</h1>,
  document.getElementById('example')
);
```

然后在 `helloworld.html` 引用该文件：

```html{10}
<script type="text/jsx" src="src/helloworld.js"></script>
```

### 离线转换

先安装命令行工具（依赖 [npm](https://www.npmjs.com/)）：

```
npm install -g react-tools
```

然后把你的 `src/helloworld.js` 文件转成标准的 JavaScript:

```
jsx --watch src/ build/

```

只要你修改了， `build/helloworld.js` 文件会自动生成。

```javascript{2}
React.render(
  React.createElement('h1', null, 'Hello, world!'),
  document.getElementById('example')
);
```

对照下面更新你的 HTML 代码

```html{6,10}
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React!</title>
    <script src="build/react.js"></script>
    <!-- 不需要 JSXTransformer！ -->
  </head>
  <body>
    <div id="example"></div>
    <script src="build/helloworld.js"></script>
  </body>
</html>
```


## 想用 CommonJS？

如果你想在 [browserify](http://browserify.org/)，[webpack](https://webpack.github.io/) 或者或其它兼容CommonJS的模块系统里使用 React，只要使用 [`react` npm 包](https://www.npmjs.com/package/react) 即可。而且，`jsx` 转换工具可以很轻松的地集成到大部分打包系统里（不仅仅是 CommonJS）。


## 下一步

去看看[入门教程](/react/docs/tutorial.html) 和入门教程包 `examples` 目录下的其它例子学习更多。

我们还有一个社区开发者共建的 Wiki：[workflows, UI-components, routing, data management etc.](https://github.com/facebook/react/wiki/Complementary-Tools)

恭喜你，欢迎来到 React 的世界。

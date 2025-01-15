# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React 是一个用于构建用户界面的 JavaScript 库。

* **声明式：** React 使创建交互式 UI 变得轻而易举。为应用程序中的每种状态设计简单的视图，当数据发生更改时，React 将高效地更新和渲染正确的组件。声明式视图使你的代码更加可预测、易于理解且易于调试。
* **基于组件：** 构建封装的组件，它们管理自己的状态，然后将它们组合以构建复杂的用户界面。由于组件逻辑是用 JavaScript 编写的，而不是模板，因此你可以轻松地在应用程序中传递丰富的数据，并将状态与 DOM 分离。
* **一次学习，到处编写：** 我们不会对你的技术栈的其余部分做出假设，因此你可以在不重写现有代码的情况下在 React 中开发新功能。React 还可以使用 [Node](https://nodejs.org/en) 在服务器端渲染，并通过 [React Native](https://reactnative.dev/) 支持移动应用程序。

[了解如何在你的项目中使用 React](https://react.dev/learn)。

## 安装

React 从一开始就被设计为逐步采用，**你可以根据需要使用尽可能多或少的 React：**

* 使用 [快速开始](https://react.dev/learn) 体验 React。
* [将 React 添加到现有项目中](https://react.dev/learn/add-react-to-an-existing-project)，根据需要使用尽可能多或少的 React。
* [创建一个新的 React 应用](https://react.dev/learn/start-a-new-react-project)，如果你正在寻找强大的 JavaScript 工具链。

## 文档

你可以在[官网](https://react.dev/)上找到 React 文档。

查看 [快速开始](https://react.dev/learn) 页面，了解快速概述。

文档分为几个部分：

* [快速开始](https://react.dev/learn)
* [教程](https://react.dev/learn/tutorial-tic-tac-toe)
* [React 思维](https://react.dev/learn/thinking-in-react)
* [安装](https://react.dev/learn/installation)
* [描述 UI](https://react.dev/learn/describing-the-ui)
* [添加交互性](https://react.dev/learn/adding-interactivity)
* [管理状态](https://react.dev/learn/managing-state)
* [高级指南](https://react.dev/learn/escape-hatches)
* [API 参考](https://react.dev/reference/react)
* [获取支持的地方](https://react.dev/community)
* [贡献指南](https://legacy.reactjs.org/docs/how-to-contribute.html)

你可以通过向[此存储库](https://github.com/reactjs/react.dev)发送拉取请求来改进文档。

## 示例

我们在[官网](https://react.dev/)上有多个示例。以下是第一个示例，供你开始：

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

此示例将在页面上的一个容器中渲染 "Hello Taylor"。

你会注意到我们使用了类似 HTML 的语法；[我们称之为 JSX](https://react.dev/learn#writing-markup-with-jsx)。JSX 不是使用 React 所必需的，但它使代码更具可读性，并且编写它感觉像在编写 HTML。

## 贡献

此存储库的主要目的是继续发展 React 核心，使其更快、更易于使用。React 的开发是在 GitHub 上公开进行的，我们感谢社区对错误修复和改进的贡献。请阅读以下内容，了解如何参与改进 React。

### [行为准则](https://code.fb.com/codeofconduct)

Facebook 采用了一套行为准则，我们希望项目参与者遵守。请阅读 [全文](https://code.fb.com/codeofconduct)，以便了解哪些行为将被接受，哪些行为将不被接受。

### [贡献指南](https://legacy.reactjs.org/docs/how-to-contribute.html)

阅读我们的[贡献指南](https://legacy.reactjs.org/docs/how-to-contribute.html)，了解我们的开发流程、如何提出错误修复和改进建议，以及如何构建和测试你对 React 的更改。

### [适合初学者的问题](https://github.com/facebook/react/labels/good%20first%20issue)

为了帮助你入门并熟悉我们的贡献流程，我们有一份[适合初学者的问题列表](https://github.com/facebook/react/labels/good%20first%20issue)，其中包含范围相对有限的错误。这是一个很好的起点。

### 许可证

React 是在 [MIT 许可证](./LICENSE) 下许可的。

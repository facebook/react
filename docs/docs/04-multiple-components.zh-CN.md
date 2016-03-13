---
id: multiple-components-zh-CN
title: 复合组件
permalink: multiple-components-zh-CN.html
prev: interactivity-and-dynamic-uis-zh-CN.html
next: reusable-components-zh-CN.html
---

目前为止，我们已经学了如何用单个组件来展示数据和处理用户输入。下一步让我们来体验 React 最激动人心的特性之一：可组合性（composability）。

## 动机：关注分离

通过复用那些接口定义良好的组件来开发新的模块化组件，我们得到了与使用函数和类相似的好处。具体来说就是能够通过开发简单的组件把程序的*不同关注面分离*。如果为程序开发一套自定义的组件库，那么就能以最适合业务场景的方式来展示你的用户界面。

## 组合实例

让我们用 Facebook Graph API 来开发一个显示 Facebook 页面图片和用户名的简单 Avatar 组件吧。

```javascript
var Avatar = React.createClass({
  render: function() {
    return (
      <div>
        <PagePic pagename={this.props.pagename} />
        <PageLink pagename={this.props.pagename} />
      </div>
    );
  }
});

var PagePic = React.createClass({
  render: function() {
    return (
      <img src={'https://graph.facebook.com/' + this.props.pagename + '/picture'} />
    );
  }
});

var PageLink = React.createClass({
  render: function() {
    return (
      <a href={'https://www.facebook.com/' + this.props.pagename}>
        {this.props.pagename}
      </a>
    );
  }
});

ReactDOM.render(
  <Avatar pagename="Engineering" />,
  document.getElementById('example')
);
```

## 从属关系

上面例子中，`Avatar` 拥有 `PagePic` 和 `PageLink` 的实例。`拥有者` 就是给其它组件设置 `props` 的那个组件。更正式地说，如果组件 `Y` 在 `render()` 方法是创建了组件 `X`，那么 `Y` 就拥有 `X`。上面讲过，组件不能修改自身的 `props` - 它们总是与它们拥有者设置的保持一致。这是保持用户界面一致性的基本不变量。

把从属关系与父子关系加以区别至关重要。从属关系是 React 特有的，而父子关系简单来讲就是DOM 里的标签的关系。在上一个例子中，`Avatar` 拥有 `div`、`PagePic` 和 `PageLink` 实例，`div` 是 `PagePic` 和 `PageLink` 实例的**父级**（但不是拥有者）。

## 子级

实例化 React 组件时，你可以在开始标签和结束标签之间引用在React 组件或者Javascript 表达式：

```javascript
<Parent><Child /></Parent>
```

`Parent` 能通过专门的 `this.props.children`  props 读取子级。**`this.props.children` 是一个不透明的数据结构：** 通过 [React.Children 工具类](/react/docs/top-level-api.html#react.children) 来操作。

### 子级校正（Reconciliation）

**校正就是每次 render 方法调用后 React 更新 DOM 的过程。** 一般情况下，子级会根据它们被渲染的顺序来做校正。例如，下面代码描述了两次渲染的过程：

```html
// 第一次渲染
<Card>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
// 第二次渲染
<Card>
  <p>Paragraph 2</p>
</Card>
```

直观来看，只是删除了`<p>Paragraph 1</p>`。事实上，React 先更新第一个子级的内容，然后删除最后一个组件。React 是根据子级的*顺序*来校正的。

### 子组件状态管理

对于大多数组件，这没什么大碍。但是，对于使用 `this.state` 来在多次渲染过程中里维持数据的状态化组件，这样做潜在很多问题。

多数情况下，可以通过隐藏组件而不是删除它们来绕过这些问题。

```html
// 第一次渲染
<Card>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
// 第二次渲染
<Card>
  <p style={{'{{'}}display: 'none'}}>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
```

### 动态子级

如果子组件位置会改变（如在搜索结果中）或者有新组件添加到列表开头（如在流中）情况会变得更加复杂。如果子级要在多个渲染阶段保持自己的特征和状态，在这种情况下，你可以通过给子级设置惟一标识的 `key` 来区分。

```javascript
  render: function() {
    var results = this.props.results;
    return (
      <ol>
        {results.map(function(result) {
          return <li key={result.id}>{result.text}</li>;
        })}
      </ol>
    );
  }
```

当 React 校正带有 key 的子级时，它会确保它们被重新排序（而不是破坏）或者删除（而不是重用）。
`务必` 把 `key` 添加到子级数组里组件本身上，而不是每个子级内部最外层 HTML 上：

```javascript
// 错误！
var ListItemWrapper = React.createClass({
  render: function() {
    return <li key={this.props.data.id}>{this.props.data.text}</li>;
  }
});
var MyComponent = React.createClass({
  render: function() {
    return (
      <ul>
        {this.props.results.map(function(result) {
          return <ListItemWrapper data={result}/>;
        })}
      </ul>
    );
  }
});
```
```javascript
// 正确 :)
var ListItemWrapper = React.createClass({
  render: function() {
    return <li>{this.props.data.text}</li>;
  }
});
var MyComponent = React.createClass({
  render: function() {
    return (
      <ul>
        {this.props.results.map(function(result) {
           return <ListItemWrapper key={result.id} data={result}/>;
        })}
      </ul>
    );
  }
});
```

也可以传递ReactFragment 对象 来做有 key 的子级。详见[Keyed Fragments](create-fragment.html)

## 数据流

React 里，数据通过上面介绍过的 `props` 从拥有者流向归属者。这就是高效的单向数据绑定(one-way data binding)：拥有者通过它的 `props` 或 `state` 计算出一些值，并把这些值绑定到它们拥有的组件的 props 上。因为这个过程会递归地调用，所以数据变化会自动在所有被使用的地方自动反映出来。


## 性能提醒

你或许会担心如果一个拥有者有大量子级时，对于数据变化做出响应非常耗费性能。值得庆幸的是执行 JavaScript  非常的快，而且 `render()` 方法一般比较简单，所以在大部分应用里这样做速度极快。此外，性能的瓶颈大多是因为 DOM 更新，而非 JS 执行，而且 React 会通过批量更新和变化检测来优化性能。

但是，有时候需要做细粒度的性能控制。这种情况下，可以重写 `shouldComponentUpdate()` 方法返回 false 来让 React 跳过对子树的处理。参考 [React reference docs](/react/docs/component-specs.html) 了解更多。

> 注意：
>
> 如果在数据变化时让 `shouldComponentUpdate()` 返回 false，React 就不能保证用户界面同步。当使用它的时候一定确保你清楚到底做了什么，并且只在遇到明显性能问题的时候才使用它。不要低估 JavaScript 的速度，DOM 操作通常才是慢的原因。

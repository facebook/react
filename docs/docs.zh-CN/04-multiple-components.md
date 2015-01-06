---
id: multiple-components
title: 多组件组合
permalink: multiple-components.html
prev: interactivity-and-dynamic-uis.html
next: reusable-components.html
---

到目前为止，我们已经了解了如何编写单个用于展示数据和处理用户输入的组件。接下来我们看下React最好用的功能之一：组合。

## 动机: 关注分离

通过构建可重用其他组件定义良好接口的模块化组件，你在用函数或类时，得到很多一致性的好处。具体来说，你可以*分离不同的关注*使你的应用程序即时是你通过建立新的组件也相当的简单。为你的应用程序建立一个自定义组件库，使你建立展示的最适合你的领域方式的UI。

## 组合的例子

我们来创建一个通过Facebook Graph接口展示身份照片和用户名的简单头像组件。

```javascript
var Avatar = React.createClass({
  render: function() {
    return (
      <div>
        <ProfilePic username={this.props.username} />
        <ProfileLink username={this.props.username} />
      </div>
    );
  }
});

var ProfilePic = React.createClass({
  render: function() {
    return (
      <img src={'http://graph.facebook.com/' + this.props.username + '/picture'} />
    );
  }
});

var ProfileLink = React.createClass({
  render: function() {
    return (
      <a href={'http://www.facebook.com/' + this.props.username}>
        {this.props.username}
      </a>
    );
  }
});

React.render(
  <Avatar username="pwh" />,
  document.getElementById('example')
);
```


## 从属关系

在上面的例子中, `Avatar`的实例*拥有*`ProfilePic`的实例和`ProfileLink`的实例. 在React中, **所有者组件可以设置其他组件的`props`**. 具体来说, 如果一个`X`组件在`Y`组件的`render()`方法中创建，那么就说`X`从属于`Y`。正如之前讲的，一个组件不能改变它的`props`-当组件的所有者一旦设置之后就保持不变了。这个关键特性保证了用户界面的一致性。

这就很重要的勾画出从属关系和父子关系的区别。从属关系是React的特性，而父子关系来源仅是你所熟知和喜爱的DOM。上面的例子，`Avatar`拥有`Div`，`ProfilePic` 和 `ProfileLink`的实例，而`Div`是 `ProfilePic` 和 `ProfileLink` 实例的**父亲**（而非拥有者）。


## 子级

当你创建一个React组件的实例时，你可以添加React组件或者JavaScript表达式在标签之间，就像这样：

```javascript
<Parent><Child /></Parent>
```


`Parent`可以通过访问特殊的`this.props.children`属性读取子级。**`this.props.children` 是一个不透明的数据结构:** 通过[React.Children 的说明](/react/docs/top-level-api.html#react.children)来操作使用。


### 子级校正

**校正是React在每一次渲染中更新DOM的一个过程。**大体来说，子级的调整是根据渲染的顺序来定得。比如，有两个渲染过程生成以下各个标记：

```html
// Render Pass 1
<Card>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
// Render Pass 2
<Card>
  <p>Paragraph 2</p>
</Card>
```

直观来看, `<p>Paragraph 1</p>` 被移除了。事实上，React将会调整改变第一个子级的文本内容，然后销毁最后一个子级节点。React的调整是根据子级的*顺序*来的.


### 子级的状态

对于大部分组件，这并不是什么大不了的事。然而在`this.state`整个渲染过程中，对于有状态的组件维持数据，这是非常有问题的。

在大多数情况下，可以通过隐藏元素来替代销毁元素：

```html
// Render Pass 1
<Card>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
// Render Pass 2
<Card>
  <p style={{'{{'}}display: 'none'}}>Paragraph 1</p>
  <p>Paragraph 2</p>
</Card>
```


### 动态的子级

像子级来回调整（就像在搜索结果中）或者一些新组件插入到列表的前面（就像在流中）这些情况就更复杂了。在这种情况下，每个子级的标示和状态，必须保持整个渲染过程中，可以给每个子级分配一个唯一的识别`key`：

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

当React调整这些加了键名的子级时，可以确保通过`key`进行重新排序（而不是彻底重来）或销毁（而不是重用）。

这个`key`应该*一直*被直接赋值在数组中的组件，而不是在HTML容器中各个数组组件的子级。

```javascript
// WRONG!
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

// Correct :)
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

你也可以通过子级的键名传递对象。这些键名的对象将会作为`key`被每一个值使用。然而，要记住，JavaScript不保证属性的排序将被保留，是非常重要的。在实际应用中的浏览器会保留属性顺序**除了**为可以解析为一个32位无符号整数的属性。数字属性将被按数字顺序排列并排在其它性质之前。如果发生这种情况React会使组件在顺序之外渲染。这可通过给键名添加前缀来避免：

```javascript
  render: function() {
    var items = {};

    this.props.results.forEach(function(result) {
      // If result.id can look like a number (consider short hashes), then
      // object iteration order is not guaranteed. In this case, we add a prefix
      // to ensure the keys are strings.
      items['result-' + result.id] = <li>{result.text}</li>;
    });

    return (
      <ol>
        {items}
      </ol>
    );
  }
```

## 数据流

在React中，就像上面所说的数据流是通过`props`从所有者组件传递给从属组件。这是一个高效的单向绑定：所有者绑定从属组件的属性通过所有者组件基于`props`和`state`计算出的一些值。由于这是一个递归过程，数据的改变会自动反射到那些每一个被使用的地方。


## 对于性能的注意事项

你可能会认为这是性能消耗是巨大的，如果有在主组件中有大量的节点，应对不断变化的数据。好消息是，JavaScript的执行效率是快速以及`render()`方法往往也是很简单的，因此在大多数应用中，这过程非常快的。此外，性能瓶颈几乎总是DOM变动，而不是JS执行同时React通过使用批量操作和变化检测进行优化。

不过，有时候你真的想在你的表现细粒度的控制。在这种情况下，简单地重写`shouldComponentUpdate（）'，当你想要React跳过子级树的处理直接返回false。查看 [React引用参考](/react/docs/component-specs.html) 获取更多信息。

> 注意:
>
> 当数据发生改变如果 `shouldComponentUpdate()` 返回false , React 将无法同步变化到界面。当你这么做要确定知道这一点，当你有一个明显的性能问题才使用这个功能。 
> 不要小看JavaScript的速度相对于DOM有多快。
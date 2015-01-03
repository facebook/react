---
id: multiple-components
title: Multiple Components
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

For most components, this is not a big deal. However, for stateful components that maintain data in `this.state` across render passes, this can be very problematic.

In most cases, this can be sidestepped by hiding elements instead of destroying them:

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


### Dynamic Children

The situation gets more complicated when the children are shuffled around (as in search results) or if new components are added onto the front of the list (as in streams). In these cases where the identity and state of each child must be maintained across render passes, you can uniquely identify each child by assigning it a `key`:

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

When React reconciles the keyed children, it will ensure that any child with `key` will be reordered (instead of clobbered) or destroyed (instead of reused).

The `key` should *always* be supplied directly to the components in the array, not to the container HTML child of each component in the array:

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

You can also key children by passing an object. The object keys will be used as `key` for each value. However it is important to remember that JavaScript does not guarantee the ordering of properties will be preserved. In practice browsers will preserve property order **except** for properties that can be parsed as a 32-bit unsigned integers. Numeric properties will be ordered sequentially and before other properties. If this happens React will render components out of order. This can be avoided by adding a string prefix to the key:

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

## Data Flow

In React, data flows from owner to owned component through `props` as discussed above. This is effectively one-way data binding: owners bind their owned component's props to some value the owner has computed based on its `props` or `state`. Since this process happens recursively, data changes are automatically reflected everywhere they are used.


## A Note on Performance

You may be thinking that it's expensive to react to changing data if there are a large number of nodes under an owner. The good news is that JavaScript is fast and `render()` methods tend to be quite simple, so in most applications this is extremely fast. Additionally, the bottleneck is almost always the DOM mutation and not JS execution and React will optimize this for you using batching and change detection.

However, sometimes you really want to have fine-grained control over your performance. In that case, simply override `shouldComponentUpdate()` to return false when you want React to skip processing of a subtree. See [the React reference docs](/react/docs/component-specs.html) for more information.

> Note:
>
> If `shouldComponentUpdate()` returns false when data has actually changed, React can't keep your UI in sync. Be sure you know what you're doing while using it, and only use this function when you have a noticeable performance problem. Don't underestimate how fast JavaScript is relative to the DOM.

---
id: advanced-performance-zh-CN
title: 高级性能表现
permalink: docs/advanced-performance-zh-CN.html
prev: perf-zh-CN.html
next: context-zh-CN.html
next: context.html
---

当大家考虑在项目中使用 React 的时候，第一个问题往往是他们的应用的速度和响应是否能和非 React 版一样，每当状态改变的时候就重新渲染组件的整个子树，让大家怀疑这会不会对性能造成负面影响。React 用了一些黑科技来减少 UI 更新需要的花费较大的 DOM 操作。

## 使用 production 版本

如果你在你的 React app 中进行性能测试或在寻找性能问题，一定要确定你在使用 [minified production build](/react/downloads.html)。开发者版本包括额外的警告信息，这对你在开发你的 app 的时候很有用，但是因为要进行额外的处理，所以它也会比较慢。

## 避免更新 DOM

React 使用虚拟 DOM，它是在浏览器中的 DOM 子树的渲染描述，这个平行的描述让 React 避免创建和操作 DOM 节点，这些远比操作一个 JavaScript 对象慢。当一个组件的 props 或 state 改变，React 会构造一个新的虚拟 DOM 和旧的进行对比来决定真实 DOM 更新的必要性，只有在它们不相等的时候，React 才会使用尽量少的改动更新 DOM。

在此之上，React 提供了生命周期函数 `shouldComponentUpdate`，在重新渲染机制回路（虚拟 DOM 对比和 DOM 更新）之前会被触发，赋予开发者跳过这个过程的能力。这个函数默认返回 `true`，让 React 执行更新。

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return true;
}
```

一定要记住，React 会非常频繁的调用这个函数，所以要确保它的执行速度够快。

假如你有个带有多个对话的消息应用，如果只有一个对话发生改变，如果我们在 `ChatThread` 组件执行 `shouldComponentUpdate`，React 可以跳过其他对话的重新渲染步骤。


```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  // TODO: return whether or not current chat thread is
  // different to former one.
}
```

因此，总的说，React 通过让用户使用 `shouldComponentUpdate` 减短重新渲染回路，避免进行昂贵的更新 DOM 子树的操作，而且这些必要的更新，需要对比虚拟 DOM。

## shouldComponentUpdate 实战

这里有个组件的子树，每一个都指明了 `shouldComponentUpdate` 返回值和虚拟 DOM 是否相等，最后，圆圈的颜色表示组件是否需要更新。

<figure><img src="/react/img/docs/should-component-update.png" /></figure>

在上面的示例中，因为 C2 的 `shouldComponentUpdate` 返回 false，React 就不需要生成新的虚拟 DOM，也就不需要更新 DOM，注意 React 甚至不需要调用 C4 和 C5 的 `shouldComponentUpdate`。

C1 和 C3 的 `shouldComponentUpdate` 返回 `true`，所以 React 需要向下到叶子节点检查它们，C6 返回 `true`，因为虚拟 DOM 不相等，需要更新 DOM。最后感兴趣的是 C8，对于这个节点，React 需要计算虚拟 DOM，但是因为它和旧的相等，所以不需要更新 DOM。

注意 React 只需要对 C6 进行 DOM 转换，这是必须的。对于 C8，通过虚拟 DOM 的对比确定它是不需要的，C2 的子树和 C7，它们甚至不需要计算虚拟 DOM，因为 `shouldComponentUpdate`。


那么，我们怎么实现 `shouldComponentUpdate` 呢？比如说你有一个组件仅仅渲染一个字符串:

```javascript
React.createClass({
  propTypes: {
    value: React.PropTypes.string.isRequired
  },

  render: function() {
    return <div>{this.props.value}</div>;
  }
});
```

我们可以简单的实现 `shouldComponentUpdate` 如下:

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value !== nextProps.value;
}
```

非常好！处理这样简单结构的 props／state 很简单，我门甚至可以归纳出一个基于浅对比的实现，然后把它 Mixin 到组件中。实际上 React 已经提供了这样的实现: [PureRenderMixin](/react/docs/pure-render-mixin.html)

但是如果你的组件的 props 或者 state 是可变的数据结构呢？比如说，组件接收的 prop 不是一个像 `'bar'` 这样的字符串，而是一个包涵字符串的 JavaScript 对象，比如 `{ foo: 'bar' }`:

```javascript
React.createClass({
  propTypes: {
    value: React.PropTypes.object.isRequired
  },

  render: function() {
    return <div>{this.props.value.foo}</div>;
  }
});
```

前面的 `shouldComponentUpdate` 实现就不会一直和我们期望的一样工作:

```javascript
// assume this.props.value is { foo: 'bar' }
// assume nextProps.value is { foo: 'bar' },
// but this reference is different to this.props.value
this.props.value !== nextProps.value; // true
```

这个问题是当 prop 没有改变的时候 `shouldComponentUpdate` 也会返回 `true`。为了解决这个问题，我们有了这个替代实现:

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value.foo !== nextProps.value.foo;
}
```

基本上，我们结束了使用深度对比来确保改变的正确跟踪，这个方法在性能上的花费是很大的，因为我们需要为每个 model 写不同的深度对比代码。就算这样，如果我们没有处理好对象引用，它甚至不能工作，比如说这个父组件:

```javascript
React.createClass({
  getInitialState: function() {
    return { value: { foo: 'bar' } };
  },

  onClick: function() {
    var value = this.state.value;
    value.foo += 'bar'; // ANTI-PATTERN!
    this.setState({ value: value });
  },

  render: function() {
    return (
      <div>
        <InnerComponent value={this.state.value} />
        <a onClick={this.onClick}>Click me</a>
      </div>
    );
  }
});
```

内部组件第一次渲染的时候，它会获取 `{ foo: 'bar' }` 作为 value 的值。如果用户点击了 a 标签，父组件的 state 会更新成 `{ value: { foo: 'barbar' } }`，触发内部组件的重新渲染过程，内部组件会收到 `{ foo: 'barbar' }` 作为 value 的新的值。

这里的问题是因为父组件和内部组件共享同一个对象的引用，当对象在 `onClick` 函数的第二行发生改变的时候，内部组件的属性也发生了改变，所以当重新渲染过程开始，`shouldComponentUpdate` 被调用的时候，`this.props.value.foo` 和 `nextProps.value.foo` 是相等的，因为实际上 `this.props.value` 和 `nextProps.value` 是同一个对象的引用。

因此，我们会丢失 prop 的改变，缩短重新渲染过程，UI 也不会从 `'bar'` 更新到 `'barbar'`

## Immutable-js 来救赎

[Immutable-js](https://github.com/facebook/immutable-js) 是 Lee Byron 写的 JavaScript 集合类型的库，最近被 Facebook 开源，它通过*结构共享*提供*不可变持久化*集合类型。一起看下这些特性的含义:

* *Immutable*: 一旦创建，集合就不能再改变。
* *Persistent*: 新的集合类型可以通过之前的集合创建，比如 set 产生改变的集合。创建新的集合之后源集合仍然有效。
* *Structural Sharing*: 新的集合会使用尽量多的源集合的结构，减少复制来节省空间和性能友好。如果新的集合和源集合相等，一般会返回源结构。

不可变让跟踪改变非常简单；每次改变都是产生新的对象，所以我们仅需要对象的引用是否改变，比如这段简单的 JavaScript 代码：

```javascript
var x = { foo: "bar" };
var y = x;
y.foo = "baz";
x === y; // true
```

尽管 `y` 被改变，因为它和 `x` 引用的是同一个对象，这个对比返回 `true`。然而，这个代码可以使用 immutable-js 改写如下:

```javascript
var SomeRecord = Immutable.Record({ foo: null });
var x = new SomeRecord({ foo: 'bar'  });
var y = x.set('foo', 'baz');
x === y; // false
```

这个例子中，因为改变 `x` 的时候返回了新的引用，我们就可以安全的认为 `x` 已经改变。

脏检测可以作为另外的可行的方式追踪改变，给 setters 一个标示。这个方法的问题是，它强制你使用 setters，而且要写很多额外的代码，影响你的类。或者你可以在改变之前深拷贝对象，然后进行深对比来确定是不是发生了改变。这个方法的问题是，深拷贝和深对比都是很花性能的操作。

因此，不可变数据结构给你提供了一个高效、简洁的方式来跟踪对象的改变，而跟踪改变是实现 `shouldComponentUpdate` 的关键。所以，如果我们使用 immutable-js 提供的抽象创建 props 和 state 模型，我们就可以使用 `PureRenderMixin`，而且能够获得很好的性能增强。

## Immutable-js 和 Flux

如果你在使用 [Flux](https://facebook.github.io/flux/)，你应该开始使用 immutable-js 写你的 stores，看一下 [full API](https://facebook.github.io/immutable-js/docs/#/)。

让我们看一个可行的方式，使用不可变数据结构来给消息示例创建数据结构。首先我们要给每个要建模的实体定义一个 `Record`。Records 仅仅是一个不可变容器，里面保存一系列具体数据:

```javascript
var User = Immutable.Record({
  id: undefined,
  name: undefined,
  email: undefined
});

var Message = Immutable.Record({
  timestamp: new Date(),
  sender: undefined,
  text: ''
});
```

`Record` 方法接收一个对象，来定义字段和对应的默认数据。

消息的 *store* 可以使用两个 list 来跟踪 users 和 messages:

```javascript
this.users = Immutable.List();
this.messages = Immutable.List();
```

实现函数处理每个 *payload* 类型应该是比较简单的，比如，当 store 看到一个代表新消息的 payload 时，我们就创建一个新的 record，并放入消息列表:

```javascript
this.messages = this.messages.push(new Message({
  timestamp: payload.timestamp,
  sender: payload.sender,
  text: payload.text
});
```

注意：因为数据结构不可变，我们需要把 push 方法的结果赋给 `this.messages`。

在 React 里，如果我们也使用 immutable-js 数据结构来保存组件的 state，我门可以把 `PureRenderMixin` 混入到我门所有的组件来缩短重新渲染回路。

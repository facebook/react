---
id: advanced-performance-zh-CN
title: 提高性能
permalink: docs/advanced-performance-zh-CN.html
prev: shallow-compare-zh-CN.html
next: context-zh-CN.html
---

当人们考虑将React应用到自己的系统里时，都会想知道React是否可以和非React的应用一样可以快速的响应各种用户的操作。改变组件的state时，它会重新渲染组件的所有子节点，有人会怀疑这种重新渲染会带来很大的性能开销。但是React使用很多技术来最小化的减少DOM操作的开销达到更新UI的效果。

## 使用生产构建版本

如果你在开发React应用中，遇到了一些性能上的问题，你可以使用了[minified production build](/react/downloads.html)进行测试。这个开发构建版本包括了额外的一些警告信息，可以帮助你更好的调试你的应用。由于它做了很多额外的开销，所以它运行起来会相对要慢一点。

## 避免调整真实DOM树

React利用*虚拟DOM*,来描述在浏览器上显示的真实DOM树。这种并行的表示方法，可以让React避免直接去操作DOM节点，毕竟操作DOM节点的开销要远远大于直接去操作Javascript的对象。当组件的state或者props更新的时候，React会根据新生成的虚拟DOM和之前的虚拟DOM进行比较，来判断是否需要去更新真实DOM上的内容。只有在前后虚拟DOM不相等的情况下，React才会去[调整](/react/docs/reconciliation.html)真实DOM的结构。

在此之上，React提供了一个组件生命周期函数`shouldComponentUpdate`,它会在组件进行重渲染过程开始的时候（虚拟DOM和真实DOM进行对比）进行调用。让开发者可以短接这个过程。该函数默认会返回`true`，让React去执行更新。

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return true;
}
```

记住一点，在React中，这个函数调用的非常频繁，所以里面的操作不能太复杂，一定要快。

你有几个聊天对话的消息应用程序。假设只有一个对话改变了。如果你在`ChatThread`组件中实现了`shouldComponentUpdate`函数，React可以跳过对其他线程的重渲染的步骤。

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  // TODO: return whether or not current chat thread is
  // different to former one.
}
```

所以，总而言之，React可以让开发者使用`shouldComponentUpdate`函数来减少对DOM子树的调整，对于那些需要更新的组件，再进行虚拟DOMs的对比。

## shouldComponentUpdate 实战

这个一个组件的子树的结构。每一个节点表示`shouldComponentUpdate` return了什么，以及是否虚拟DOMs是相等的。最后，圆的颜色代表这个节点是否需要被重新调整。

<figure><img src="/react/img/docs/should-component-update.png" /></figure>	

在上述例子中，C2节点的`shouldComponentUpdate`函数返回了`false`，所以React就不需要在这里产生新的虚拟DOM，也就不需要重新调整DOM。由于父节点C2已经在`shouldComponentUpdate`函数中返回`false`，所以它的所有子节点也就不会执行该函数。

对于C1和C3，`shouldComponentUpdate`函数返回了`true`，React会从上往下对子节点进行检查。对于C6节点，它返回了`true`；由于前后的虚拟DOMs不相等，所以它不得不调整真实DOM。最后在C8这个有趣的节点上。React会去对比前后虚拟DOM,由于前后是相等的，所以它不是对真实DOM进行调整。

请注意，React只会对C6进行DOM操作。对于C8，它通过对比虚拟DOMs的方式，避免重新渲染。对于C2的子节点以及C7，通过`shouldComponentUpdate`函数，直接忽略了虚拟DOM比较的过程，提高性能。

所以，我们应该怎么样来实现`shouldComponentUpdate`方法？举个例子，你有个组件仅仅只渲染一个string的文案：

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

我们可以简单的像下面一样实现`shouldComponentUpdate`

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value !== nextProps.value;
}
```

目前为止，在props/state上处理简单的的数据结构是非常容易的。基于这种数据类型，我们可以通过mixin的方式把该函数引入到你的所有组件中去。事实上，React官方已经提供了这种方法：[PureRenderMixin](/react/docs/pure-render-mixin.html)。

但是，如果你的组件使用的在state或者props上使用的是可变的数据结构怎么办？组件里的prop不是以一个string的形式`'bar'`存在，而是以一种Javascript对象的形式包含了一个字符串，类似这样`{ foo: 'bar' }`:

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

如果是这种情况，按照我们刚才的在`shouldComponentUpdate`的实现的话，是不能达到我们的预期：

```javascript
// assume this.props.value is { foo: 'bar' }
// assume nextProps.value is { foo: 'bar' },
// but this reference is different to this.props.value
this.props.value !== nextProps.value; // true
```

因为props实际上是没有改变的，所以`shouldComponentUpdate`始终会返回`true`。为了解决这个问题，我们也有一个可选的解决方案：

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value.foo !== nextProps.value.foo;
}
```

基本上，我们是不会利用这种深度比较去判断是否有属性改变。这样的操作十分损耗性能的，并且非常难扩展。最重要的是，如果我们没有仔细管理对象的引用关系，很可能导致对比不出结果。让我们来看看下面这个组件：

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

子组件第一次渲染的时候，组件会收到`{ foo: 'bar' }`作为prop中的value的值。如果用户进行了点击的操作，父组件为更新state，变为`{ value: { foo: 'barbar' } }`，之后会触发子组件的重渲染的过程，子组件会收到新的prop中value的值`{ foo: 'barbar' }`。

问题在与，因为父子组件共同分享了一个对象的引用，当这个对象在`onClick`函数中进行修改后，子组件的prop也已经改变。所以，当重渲染的过程开始，`shouldComponentUpdate`函数就会被触发，`this.props.value.foo` 与`nextProps.value.foo`会是相等的。因为`this.props.value`和`nextProps.value`指向的是同一个对象。

因此，我们直接阻止了子组件进行重新渲染，整个UI也就不会把`'bar'`更新为`'barbar'`。

## 使用Immutable-js

[Immutable-js](https://github.com/facebook/immutable-js)是一个由Lee Byron编写的Javascript的数据类型库，现在已经被Facebook开源了。它通过 *结构共享* 的方式提供了一个 *持久不可变的* 的集合。让我们来看看这个到底是什么东西。

* *不可变*：一旦被创建，一个集合不能被其他内容所改变
* *持久性*：新的集合可以由之前的集合创建出来，或者由一个可变的数据创建。当新的集合被创建出来，原始的集合依然有效。
* *结构共享*：新的集合会尽可能的复用之前集合内的内容。减少重复复制来提高性能。如果新集合和原来的集合是相等的，则会直接把之前的集合返回给新集合。

不可变的特性让跟踪变化变得简单；每次改变总是会产生新的一个对象，所以。我们只需要判断一下它们引用是否相同即可。举个例子，下面是常规的Javascript的写法：

```javascript
var x = { foo: "bar" };
var y = x;
y.foo = "baz";
x === y; // true
```

尽管`y`已经被更改了，但是它的引用还是和`x`是一致的。所以他们两个进行对比，始终会返回`true`。所以，这样的操作应该要用`immutable-js `来完成：

```javascript
var SomeRecord = Immutable.Record({ foo: null });
var x = new SomeRecord({ foo: 'bar'  });
var y = x.set('foo', 'baz');
x === y; // false
```

在这样的情况中，当我们改变了x里的内容，会返回给我们一个新的引用，我们可以安全地假定`x`已经改变。

另一种来跟踪数据变化的方法，是通过 setter 来设置标识符来做脏检查 (dirty checking)。这种方法的问题在于它强迫你使用 setter；你需要多写很多额外代码或者跟踪分析 class 中的数据。另外一种方式是，你可以在更改一个对象之前对它进行一次深复制，之后再进行深比较，来判断这次操作是否造成了数据改变：这种方案的问题在于深复制与深比较都是很昂贵的操作。

所以，Immutable的数据结构给你提供了一个很方便的方式去跟踪一个对象是否被修改了，我们只需要简单的实现`shouldComponentUpdate`即可。因此，如果我们的props和state模型使用了immutable-js方式，我们可以引入`PureRenderMixin`，从而提高我们的应用的性能。

## Immutable-js 结合 Flux

如果你正在使用[Flux](https://facebook.github.io/flux/)，你应该在你的stores里使用immutable-js。可以来看下[full API](https://facebook.github.io/immutable-js/docs/#/)。

让我们看看一种使用Immutable数据结构来处理的方式。首先，我们为每一个入口定义一个`Record`去处理模型。`Record`是一个保存各个字段的一个容器。

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

Record 函数接受一个对象作为参数；这个对象定义了 Record 中的键值与默认值

*store*可以用两个list来记录users和messages


```javascript
this.users = Immutable.List();
this.messages = Immutable.List();
```

它可以很方便的实现处理*payload*数据类型。例如，当一个store收到了新的信息，我们可以直接创建一个新的record，然后把它加到我们message的list中去。

```javascript
this.messages = this.messages.push(new Message({
  timestamp: payload.timestamp,
  sender: payload.sender,
  text: payload.text
});
```

注意，因为data的数据结构是不可变的，我们需要重新对`this.message`进行赋值。

在React方面，如果我们用了 `immutable-js`的数据结构去保存组件的state,我们就可以引入`PureRenderMixin`到所有你的组件中，做一个快速的判断是否需要重新渲染的操作。

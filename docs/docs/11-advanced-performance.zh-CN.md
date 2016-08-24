---
id: advanced-performance
title: Advanced Performance
permalink: docs/advanced-performance.html
prev: shallow-compare.html
next: context.html
---

One of the first questions people ask when considering React for a project is whether their application will be as fast and responsive as an equivalent non-React version. The idea of re-rendering an entire subtree of components in response to every state change makes people wonder whether this process negatively impacts performance. React uses several clever techniques to minimize the number of costly DOM operations required to update the UI.

当人们考虑将React应用到自己的系统里时，都会想知道是否React可以和非React的应用一样可以快速的响应各种用户操作。state的改变会重新渲染组件的所有子节点，会让人们怀疑这会带来很大的性能开销。但是React使用了很多牛逼的技术来最小化的减少DOM操作的开销达到更新UI的效果。

## Use the production build

If you're benchmarking or experiencing performance problems in your React apps, make sure you're testing with the [minified production build](/react/downloads.html). The development build includes extra warnings that are helpful when building your apps, but it is slower due to the extra bookkeeping it does.

如果你在开发React应用中，遇到了一些性能上的问题，确保你使用了[minified production build](/react/downloads.html)进行测试。这个开发构建工具包括了额外的一些警告信息，可以帮助你更好的构建你的应用，但是如果还是很慢的话，它可能做了一些额外的开销。

## Avoiding reconciling the DOM

React makes use of a *virtual DOM*, which is a descriptor of a DOM subtree rendered in the browser. This parallel representation allows React to avoid creating DOM nodes and accessing existing ones, which is slower than operations on JavaScript objects. When a component's props or state change, React decides whether an actual DOM update is necessary by constructing a new virtual DOM and comparing it to the old one. Only in the case they are not equal, will React [reconcile](/react/docs/reconciliation.html) the DOM, applying as few mutations as possible.

React利用*虚拟DOM*,用于在浏览器上DOM树形的结构。

On top of this, React provides a component lifecycle function, `shouldComponentUpdate`, which is triggered before the re-rendering process starts (virtual DOM comparison and possible eventual DOM reconciliation), giving the developer the ability to short circuit this process. The default implementation of this function returns `true`, leaving React to perform the update:

在此之上，React提供了一个组件生命周期函数`shouldComponentUpdate`,它会在组件进行重渲染过程开始的时候（虚拟DOM和真实DOMj进行对比）进行调用。给开发者以更短的时间去处理这个过程。该函数默认会返回`true`，让React可以及时更新

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return true;
}
```

Keep in mind that React will invoke this function pretty often, so the implementation has to be fast.

在React中，这个函数调用的非常频繁，所以里面的实现一定要很快。

Say you have a messaging application with several chat threads. Suppose only one of the threads has changed. If we implement `shouldComponentUpdate` on the `ChatThread` component, React can skip the rendering step for the other threads:

你有几个聊天线程的消息应用程序。假设只有其他的一个线程改变了。如果你在`ChatThread`组件中实现了`shouldComponentUpdate`函数，React可以跳过对其他线程的重渲染。

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  // TODO: return whether or not current chat thread is
  // different to former one.
}
```

So, in summary, React avoids carrying out expensive DOM operations required to reconcile subtrees of the DOM by allowing the user to short circuit the process using `shouldComponentUpdate`, and, for those which should update, by comparing virtual DOMs.

所以，总而言之，React可以避免让开发者使用`shouldComponentUpdate`函数来减少对DOM子树的操作，对于那些需要更新的组件，在进行虚拟DOMs的对比。

## shouldComponentUpdate in action

## shouldComponentUpdate 实战

Here's a subtree of components. For each one is indicated what `shouldComponentUpdate` returned and whether or not the virtual DOMs were equivalent. Finally, the circle's color indicates whether the component had to be reconciled or not.

这个一个组件的子树的结构。每一个节点表示`shouldComponentUpdate` return了什么，以及是否虚拟DOMs是相等的。最后，圆的颜色代表这个节点是否需要被重新渲染。

<figure><img src="/react/img/docs/should-component-update.png" /></figure><img src="https://facebook.github.io/react/img/docs/should-component-update.png">

In the example above, since `shouldComponentUpdate` returned `false` for the subtree rooted at C2, React had no need to generate the new virtual DOM, and therefore, it neither needed to reconcile the DOM. Note that React didn't even have to invoke `shouldComponentUpdate` on C4 and C5.

在上述例子中，由于在C2节点上，`shouldComponentUpdate`函数返回了`false`，所以React就不需要在这里产生新的虚拟DOM，也不需要重新对比DOM。请注意，React它也不会去在C2的子节点C4和C5中去触发`shouldComponentUpdate`函数。

For C1 and C3 `shouldComponentUpdate` returned `true`, so React had to go down to the leaves and check them. For C6 it returned `true`; since the virtual DOMs weren't equivalent it had to reconcile the DOM.
The last interesting case is C8. For this node React had to compute the virtual DOM, but since it was equal to the old one, it didn't have to reconcile it's DOM.

对于C1和C3，`shouldComponentUpdate`函数返回了`true`，所以React会从上往下直到叶子节点去检查。对于C6节点，它返回了`true`；由于虚拟DOMs与真实DOMs不相等，所以它不得不重新生成一个新的DOM。最后在C8这个有趣的节点上。React会去对比虚拟DOM,但是对比结果是相等的，所以它不是重新组织它的DOM。

Note that React only had to do DOM mutations for C6, which was inevitable. For C8, it bailed out by comparing the virtual DOMs, and for C2's subtree and C7, it didn't even have to compute the virtual DOM as we bailed out on `shouldComponentUpdate`.

请注意，React只会去对C6进行DOM操作。对于C8，它通过对比虚拟DOMs的方式，避免重新渲染。对于C2的子节点以及C7，通过`shouldComponentUpdate`函数，从而都不需要进行虚拟DOM的比较，就直接不进行重渲染

So, how should we implement `shouldComponentUpdate`? Say that you have a component that just renders a string value:

所以，我们应该怎么样来实现`shouldComponentUpdate`方法？比如说，你有个组件仅仅只渲染一个string的文案：

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

We could easily implement `shouldComponentUpdate` as follows:

我们可以简单的像下面一样实现`shouldComponentUpdate`

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value !== nextProps.value;
}
```

So far so good, dealing with such simple props/state structures is easy. We could even generalize an implementation based on shallow equality and mix it into components. In fact, React already provides such implementation: [PureRenderMixin](/react/docs/pure-render-mixin.html).

目前为止，处理简单的props/state的数据结构是非常容易的。基于这种数据类型，我们可以通过mix的方式引入到你的组件中去。事实上，React官方已经提供了这种的一种实现：[PureRenderMixin](/react/docs/pure-render-mixin.html)。

But what if your components' props or state are mutable data structures? Say the prop the component receives, instead of being a string like `'bar'`, is a JavaScript object that contains a string such as, `{ foo: 'bar' }`:

但是，如果你的组件使用的props或者state是一种可变的数据结构怎么办？组件里的prop不是以一个string的形式`'bar'`存在，而是以一种Javascript对象的形式包含了一个字符串，类似这样`{ foo: 'bar' }`:

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

The implementation of `shouldComponentUpdate` we had before wouldn't always work as expected:

如果是这种情况，按照我们刚才的在`shouldComponentUpdate`的实现的话，是不能达到我们的预期的：

```javascript
// assume this.props.value is { foo: 'bar' }
// assume nextProps.value is { foo: 'bar' },
// but this reference is different to this.props.value
this.props.value !== nextProps.value; // true
```

The problem is `shouldComponentUpdate` will return `true` when the prop actually didn't change. To fix this, we could come up with this alternative implementation:

问题在于`shouldComponentUpdate`始终会返回`true`,当prop实际上是没有改变的。为了解决这个问题，我们有一个可选的解决方案：

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value.foo !== nextProps.value.foo;
}
```

Basically, we ended up doing a deep comparison to make sure we properly track changes. In terms of performance, this approach is pretty expensive. It doesn't scale as we would have to write different deep equality code for each model. On top of that, it might not even work if we don't carefully manage object references. Say this component is used by a parent:

基本上，我们会做一个深复制去跟踪是否有属性改变。但是，这样的操作是十分损耗性能的。
这样的实现很难扩展，我们不得不写很多相同的代码。最重要的是，如果我们没有仔细管理对象的引用关系，和可能导致对比不出结果。在下面这个组件中，我们修改了子对象里的数据，但对比的时候是对比父对象：

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

The first time the inner component gets rendered, it will have `{ foo: 'bar' }` as the value prop. If the user clicks on the anchor, the parent component's state will get updated to `{ value: { foo: 'barbar' } }`, triggering the re-rendering process of the inner component, which will receive `{ foo: 'barbar' }` as the new value for the prop.

子组件第一个渲染的时候，组件会收到`{ foo: 'bar' }`作为prop中的value的值。如果用户进行了点击的操作，父组件为更新state，变为`{ value: { foo: 'barbar' } }`，之后会触发子组件的重渲染的过程，子组件会收到新的porp中value的值`{ foo: 'barbar' }`。

The problem is that since the parent and inner components share a reference to the same object, when the object gets mutated on line 2 of the `onClick` function, the prop the inner component had will change. So, when the re-rendering process starts, and `shouldComponentUpdate` gets invoked, `this.props.value.foo` will be equal to `nextProps.value.foo`, because in fact, `this.props.value` references the same object as `nextProps.value`.

问题在与，因为父子组件共同分享了一个对象的引用，当这个对象在`onClick`函数中进行修改后，子组件的prop也会改变。所以，当重渲染的过冲开始的时候，`shouldComponentUpdate`函数就会被触发，`this.props.value.foo` 与`nextProps.value.foo`是相等的，因为他们都是指向统一对象。

Consequently, since we'll miss the change on the prop and short circuit the re-rendering process, the UI won't get updated from `'bar'` to `'barbar'`.

因此，如果我们简单的进行prop的对比，整个UI不会把`'bar'`更新为`'barbar'`。

## Immutable-js to the rescue

## 使用Immutable-js

[Immutable-js](https://github.com/facebook/immutable-js) is a JavaScript collections library written by Lee Byron, which Facebook recently open-sourced. It provides *immutable persistent* collections via *structural sharing*. Let's see what these properties mean:

[Immutable-js](https://github.com/facebook/immutable-js)是一个由Lee Byron编写的Javascript的数据类型库，现在已经被Facebook开源了。它通过 *结构共享* 的方式提供了一个 *持久不可变的* 的集合。让我们来看看这个到底是什么东西。

* *Immutable*: once created, a collection cannot be altered at another point in time.
* *Persistent*: new collections can be created from a previous collection and a mutation such as set. The original collection is still valid after the new collection is created.
* *Structural Sharing*: new collections are created using as much of the same structure as the original collection as possible, reducing copying to a minimum to achieve space efficiency and acceptable performance. If the new collection is equal to the original, the original is often returned.

Immutability makes tracking changes cheap; a change will always result in a new object so we only need to check if the reference to the object has changed. For example, in this regular JavaScript code:

不可变的特性可以让跟踪变的很方便；一次改变总是会产生新的一个对象，所以。我们只需要判断一下引用是否相同即可。举个例子，下面是常规的Javascript的写法：

```javascript
var x = { foo: "bar" };
var y = x;
y.foo = "baz";
x === y; // true
```

Although `y` was edited, since it's a reference to the same object as `x`, this comparison returns `true`. However, this code could be written using immutable-js as follows:

尽管`y`已经被更改了，但是它的引用是和`x`是一致的，如果他们两个进行对比，始终会返回`true`。如果我们可以使用`immutable-js `来进行操作的话：

```javascript
var SomeRecord = Immutable.Record({ foo: null });
var x = new SomeRecord({ foo: 'bar'  });
var y = x.set('foo', 'baz');
x === y; // false
```

In this case, since a new reference is returned when mutating `x`, we can safely assume that `x` has changed.

在这种情况中，当改变了后，会产生一个新的引用，所以我们可以很安全的改变`x` 的值。

Another possible way to track changes could be doing dirty checking by having a flag set by setters. A problem with this approach is that it forces you to use setters and, either write a lot of additional code, or somehow instrument your classes. Alternatively, you could deep copy the object just before the mutations and deep compare to determine whether there was a change or not. A problem with this approach is both deepCopy and deepCompare are expensive operations.

能够检测其他方式的另一个变化是检查脏（脏检查）标志由设定器（setter方法）来设置。这种方法的问题是，你是被迫不仅是如何使用的setter或写额外的代码来所有类仪器（设备）的数量。或深副本濒临改变（突变）（深拷贝）一个在后面的对象可以确定相比变化前款深（深比较）。这种方法的问题是，深复制和深比较的操作代价都是非常高昂的。

So, Immutable data structures provides you a cheap and less verbose way to track changes on objects, which is all we need to implement `shouldComponentUpdate`. Therefore, if we model props and state attributes using the abstractions provided by immutable-js we'll be able to use `PureRenderMixin` and get a nice boost in perf.

所以，Immutable的数据结构给你提供了一个很方便的方式去跟踪一个对象是否被修改了，我们只需要简单的实现`shouldComponentUpdate`即可。因此，如果我们的props和state模型使用了immutable-js方式，我们可以引入`PureRenderMixin`，从而提高我们的应用的性能。

## Immutable-js and Flux

If you're using [Flux](https://facebook.github.io/flux/), you should start writing your stores using immutable-js. Take a look at the [full API](https://facebook.github.io/immutable-js/docs/#/).

Let's see one possible way to model the thread example using Immutable data structures. First, we need to define a `Record` for each of the entities we're trying to model. Records are just immutable containers that hold values for a specific set of fields:

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

The `Record` function receives an object that defines the fields the object has and its default values.

The messages *store* could keep track of the users and messages using two lists:

```javascript
this.users = Immutable.List();
this.messages = Immutable.List();
```

It should be pretty straightforward to implement functions to process each *payload* type. For instance, when the store sees a payload representing a new message,  we can just create a new record and append it to the messages list:

```javascript
this.messages = this.messages.push(new Message({
  timestamp: payload.timestamp,
  sender: payload.sender,
  text: payload.text
});
```

Note that since the data structures are immutable, we need to assign the result of the push function to `this.messages`.

注意，因为data的数据结构是不可变的，我们需要重新对`this.message`进行赋值。

On the React side, if we also use immutable-js data structures to hold the components' state, we could mix `PureRenderMixin` into all our components and short circuit the re-rendering process.

在React方面，如果我们用了 `immutable-js`的数据结构去保存组件的state,我们就可以引入`PureRenderMixin`到所有你的组件中，做一个快速的判断是否需要重新渲染的操作。

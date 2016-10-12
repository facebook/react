---
id: optimizing-performance
title: Optimizing Performance
permalink: docs/optimizing-performance.html
---

Internally, React uses several clever techniques to minimize the number of costly DOM operations required to update the UI. For many applications, using React will lead to a fast user interface without doing much work to specifically optimize for performance. Nevertheless, there are several ways you can speed up your React application.

## Use The Production Build

If you're benchmarking or experiencing performance problems in your React apps, make sure you're testing with the [minified production build](/react/downloads.html). The development build includes extra warnings that are helpful when building your apps, but it is slower due to the extra bookkeeping it does.

## Avoid Reconciling the DOM

React makes use of a "virtual DOM", which is a descriptor of a DOM subtree rendered in the browser. This parallel representation allows React to avoid creating DOM nodes and accessing existing ones, which is slower than operations on JavaScript objects. When a component's props or state change, React decides whether an actual DOM update is necessary by constructing a new virtual DOM and comparing it to the old one. When they are not equal, React will update the DOM, which can be a slow operation.

In some cases, your component can speed all of this up by overriding the lifecycle function `shouldComponentUpdate`, which is triggered before the re-rendering process starts. The default implementation of this function returns `true`, leaving React to perform the update:

```javascript
shouldComponentUpdate(nextProps, nextState) {
  return true;
}
```

If you know that in some situations your component doesn't need to update, you can return `false` from `shouldComponentUpdate` instead, to skip the slow DOM update. For example, if the only way your component ever changes is when the `state.count` variable changes, you could write:

```javascript
shouldComponentUpdate(nextProps, nextState) {
  return this.state.count !== nextState.count;
}
```

Keep in mind that React will invoke this function pretty often, so the implementation has to be fast.

## shouldComponentUpdate In Action

Here's a subtree of components. For each one, `SCU` indicates what `shouldComponentUpdate` returned, and `vDOMEq` indicates whether the virtual DOMs were equivalent. Finally, the circle's color indicates whether the component had to be reconciled or not.

<figure><img src="/react/img/docs/should-component-update.png" /></figure>

Since `shouldComponentUpdate` returned `false` for the subtree rooted at C2, React did not generate a new virtual DOM for C2, and React didn't even have to invoke `shouldComponentUpdate` on C4 and C5.

For C1 and C3, `shouldComponentUpdate` returned `true`, so React had to go down to the leaves and check them. For C6 `shouldComponentUpdate` returned `true`, and since the virtual DOMs weren't equivalent React had to reconcile the DOM.

The last interesting case is C8. For this node, React had to compute the virtual DOM, but since it was equal to the old one, it didn't have to reconcile its DOM.

Note that React only had to do DOM mutations for C6, which was inevitable. For C8, it bailed out by comparing the virtual DOMs, and for C2's subtree and C7, it didn't even have to compute the virtual DOM as we bailed out on `shouldComponentUpdate`.

## shouldComponentUpdate Examples

Let's say that you have a component that just renders a string value. We could implement `shouldComponentUpdate` as follows:

```javascript
class StringComponent extends React.Component {
  render() {
    return <div>{this.props.value}</div>;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.value !== nextProps.value;
  }
}
```

If your components use more complex data structures, this might not be so simple. For example, let's say your component renders a comma-separated list of words:

```javascript
class ListOfWords extends React.Component {
  render() {
    return <div>{this.props.words.join(',')}</div>;
  }

  shouldComponentUpdate(nextProps, nextState) {
    // We have to do an expensive deep equality check
    if (props.words.length !== nextProps.words.length) {
      return true;
    }
    for (let i = 0; i < props.words.length; i++) {
      if (props.words[i] !== nextProps.words[i]) {
        return true;
      }
    }
    return false;
  }
}
```

Since the `ListOfWords` component relies on data deep within the props, we have to to a deep comparison to implement `shouldComponentUpdate`. This may not improve performance at all. The fundamental problem is that we want to quickly check for equality of large data structures, without doing an expensive iteration to compare them.

## The Power Of Immutable Data

[Immutable.js](https://github.com/facebook/immutable-js) solves this problem. It provides immutable, persistent collections that work via structural sharing:

* *Immutable*: once created, a collection cannot be altered at another point in time.
* *Persistent*: new collections can be created from a previous collection and a mutation such as set. The original collection is still valid after the new collection is created.
* *Structural Sharing*: new collections are created using as much of the same structure as the original collection as possible, reducing copying to a minimum to improve performance.

Immutability makes tracking changes cheap. A change will always result in a new object so we only need to check if the reference to the object has changed. For example, in this regular JavaScript code:

```javascript
var x = { foo: "bar" };
var y = x;
y.foo = "baz";
x === y; // true
```

Although `y` was edited, since it's a reference to the same object as `x`, this comparison returns `true`. You can write similar code with immutable.js:

```javascript
var SomeRecord = Immutable.Record({ foo: null });
var x = new SomeRecord({ foo: 'bar'  });
var y = x.set('foo', 'baz');
x === y; // false
```

In this case, since a new reference is returned when mutating `x`, we can safely assume that `x` has changed.

Immutable data structures provide you with a cheap way to track changes on objects, which is all we need to implement `shouldComponentUpdate`. This can often provide you with a nice performance boost.

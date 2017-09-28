---
title: "Streamlining React Elements"
author: [sebmarkbage]
date: 2015-02-24 11:00
---

React v0.13 is right around the corner and so we wanted to discuss some upcoming changes to ReactElement. In particular, we added several warnings to some esoteric use cases of ReactElement. There are no runtime behavior changes for ReactElement - we're adding these warnings in the hope that we can change some behavior in v0.14 if the changes are valuable to the community.

If you use React in an idiomatic way, chances are, you’ll never see any of these warnings. In that case, you can skip this blog post. You can just enjoy the benefits! These changes will unlock simplified semantics, better error messages, stack traces and compiler optimizations!

## Immutable Props

In React 0.12, the props object was mutable. It allows you to do patterns like this:

```js
var element = <Foo bar={false} />;
if (shouldUseFoo) {
  element.props.foo = 10;
  element.props.bar = true;
}
```

The problem is that we don’t have a convenient way to tell when you’re done mutating.

### Problem: Mutating Props You Don’t Own

If you mutate something, you destroy the original value. Therefore, there is nothing to diff against. Imagine something like this:

```js
var element = this.props.child;
element.props.count = this.state.count;
return element;
```

You take a ReactElement through `props.child` and mutate its property before rendering it. If this component's state updates, this render function won't actually get a new ReactElement in `props.child`. It will be the same one. You're mutating the same props.

You could imagine that this would work. However, this disables the ability for any component to use `shouldComponentUpdate`. It looks like the component never changed because the previous value is always the same as the next one. Since the DOM layer does diffing, this pattern doesn't even work in this case. The change will never propagate down to the DOM except the first time.

Additionally, if this element is reused in other places or used to switch back and forth between two modes, then you have all kinds of weird race conditions.

It has always been broken to mutate the props of something passed into you. The problem is that we can’t warn you about this special case if you accidentally do this.

### Problem: Too Late Validation

In React 0.12, we do PropType validation very deep inside React during mounting. This means that by the time you get an error, the debugger stack is long gone. This makes it difficult to find complex issues during debugging. We have to do this since it is fairly common for extra props to be added between the call to React.createElement and the mount time. So the type is incomplete until then.

The static analysis in Flow is also impaired by this. There is no convenient place in the code where Flow can determine that the props are finalized.

### Solution: Immutable Props

Therefore, we would like to be able to freeze the element.props object so that it is immediately immutable at the JSX callsite (or createElement). In React 0.13 we will start warning you if you mutate `element.props` after this point.

You can generally refactor these pattern to simply use two different JSX calls:

```js
if (shouldUseFoo) {
  return <Foo foo={10} bar={true} />;
} else {
  return <Foo bar={false} />;
}
```

However, if you really need to dynamically build up your props you can just use a temporary object and spread it into JSX:

```js
var props = { bar: false };
if (shouldUseFoo) {
  props.foo = 10;
  props.bar = true;
}
return <Foo {...props} />;
```

It is still OK to do deep mutations of objects. E.g:

```js
return <Foo nestedObject={this.state.myModel} />;
```

In this case it's still ok to mutate the myModel object in state. We recommend that you use fully immutable models. E.g. by using immutable-js. However, we realize that mutable models are still convenient in many cases. Therefore we're only considering shallow freezing the props object that belongs to the ReactElement itself. Not nested objects.

### Solution: Early PropType Warnings

We will also start warning you for PropTypes at the JSX or createElement callsite. This will help debugging as you’ll have the stack trace right there. Similarly, Flow also validates PropTypes at this callsite.

Note: There are valid patterns that clones a ReactElement and adds additional props to it. In that case these additional props needs to be optional.

```js
var element1 = <Foo />; // extra prop is optional
var element2 = React.addons.cloneWithProps(element1, { extra: 'prop' });
```

## Owner

In React each child has both a "parent" and an “owner”. The owner is the component that created a ReactElement. I.e. the render method which contains the JSX or createElement callsite.

```js
class Foo {
  render() {
    return <div><span /></div>;
  }
}
```

In this example, the owner of the `span` is `Foo` but the parent is the `div`.

There is also an undocumented feature called "context" that also relies on the concept of an “owner” to pass hidden props down the tree.

### Problem: The Semantics are Opaque and Confusing

The problem is that these are hidden artifacts attached to the ReactElement. In fact, you probably didn’t even know about it. It silently changes semantics. Take this for example:

```js
var foo = <input className="foo" />;
class Component {
  render() {
    return bar ? <input className="bar" /> : foo;
  }
}
```

These two inputs have different owners, therefore React will not keep its state when the conditional switches. There is nothing in the code to indicate that. Similarly, if you use `React.addons.cloneWithProps`, the owner changes.

### Problem: Timing Matters

The owner is tracked by the currently executing stack. This means that the semantics of a ReactElement varies depending on when it is executed. Take this example:

```js
class A {
  render() {
    return <B renderer={text => <span>{text}</span>} />;
  }
}
class B {
  render() {
    return this.props.renderer('foo');
  }
}
```

The owner of the `span` is actually `B`, not `A` because of the timing of the callback. This all adds complexity and suffers from similar problems as mutation.

### Problem: It Couples JSX to React

Have you wondered why JSX depends on React? Couldn’t the transpiler have that built-in to its runtime? The reason you need to have `React.createElement` in scope is because we depend on internal state of React to capture the current "owner". Without this, you wouldn’t need to have React in scope.

### Solution: Make Context Parent-Based Instead of Owner-Based

The first thing we’re doing is warning you if you’re using the "owner" feature in a way that relies on it propagating through owners. Instead, we’re planning on propagating it through parents to its children. In almost all cases, this shouldn’t matter. In fact, parent-based contexts is simply a superset.

### Solution: Remove the Semantic Implications of Owner

It turns out that there are very few cases where owners are actually important part of state-semantics. As a precaution, we’ll warn you if it turns out that the owner is important to determine state. In almost every case this shouldn’t matter. Unless you’re doing some weird optimizations, you shouldn’t see this warning.

### Pending: Change the refs Semantics

Refs are still based on "owner". We haven’t fully solved this special case just yet.

In 0.13 we introduced a new callback-refs API that doesn’t suffer from these problems but we’ll keep on a nice declarative alternative to the current semantics for refs. As always, we won’t deprecate something until we’re sure that you’ll have a nice upgrade path.

## Keyed Objects as Maps

In React 0.12, and earlier, you could use keyed objects to provide an external key to an element or a set. This pattern isn’t actually widely used. It shouldn’t be an issue for most of you.

```js
<div>{ {a: <span />, b: <span />} }</div>
```

### Problem: Relies on Enumeration Order

The problem with this pattern is that it relies on enumeration order of objects. This is technically unspecified, even though implementations now agree to use insertion order. Except for the special case when numeric keys are used.

### Problem: Using Objects as Maps is Bad

It is generally accepted that using objects as maps screw up type systems, VM optimizations, compilers etc. It is much better to use a dedicated data structure like ES6 Maps.

More importantly, this can have important security implications. For example this has a potential security problem:

```js
var children = {};
items.forEach(item => children[item.title] = <span />);
return <div>{children}</div>;
```

Imagine if `item.title === '__proto__'` for example.

### Problem: Can’t be Differentiated from Arbitrary Objects

Since these objects can have any keys with almost any value, we can’t differentiate them from a mistake. If you put some random object, we will try our best to traverse it and render it, instead of failing with a helpful warning. In fact, this is one of the few places where you can accidentally get an infinite loop in React.

To differentiate ReactElements from one of these objects, we have to tag them with `_isReactElement`. This is another issue preventing us from inlining ReactElements as simple object literals.

### Solution: Just use an Array and key={…}

Most of the time you can just use an array with keyed ReactElements.

```js
var children = items.map(item => <span key={item.title} />);
<div>{children}</div>
```

### Solution: React.addons.createFragment

However, this is not always possible if you’re trying to add a prefix key to an unknown set (e.g. this.props.children). It is also not always the easiest upgrade path. Therefore, we are adding a helper to `React.addons` called `createFragment()`. This accepts a keyed object and returns an opaque type.

```js
<div>{React.addons.createFragment({ a: <div />, b: this.props.children })}</div>
```

The exact signature of this kind of fragment will be determined later. It will likely be some kind of immutable sequence.

Note: This will still not be valid as the direct return value of `render()`. Unfortunately, they still need to be wrapped in a `<div />` or some other element.

## Compiler Optimizations: Unlocked!

These changes also unlock several possible compiler optimizations for static content in React 0.14. These optimizations were previously only available to template-based frameworks. They will now also be possible for React code! Both for JSX and `React.createElement/Factory`*!

See these GitHub Issues for a deep dive into compiler optimizations:

- [Reuse Constant Value Types](https://github.com/facebook/react/issues/3226)
- [Tagging ReactElements](https://github.com/facebook/react/issues/3227)
- [Inline ReactElements](https://github.com/facebook/react/issues/3228)

\* If you use the recommended pattern of explicit React.createFactory calls on the consumer side - since they are easily statically analyzed.

## Rationale

I thought that these changes were particularly important because the mere existence of these patterns means that even components that DON’T use these patterns have to pay the price. There are other problematic patterns such as mutating state, but they’re at least localized to a component subtree so they don’t harm the ecosystem.

As always, we’d love to hear your feedback and if you have any trouble upgrading, please let us know.

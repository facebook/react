---
id: reconciliation
title: Reconciliation
permalink: docs/reconciliation.html
---

React provides a declarative API so that you don't have to worry about exactly what changes on every update. This makes writing applications a lot easier, but it might not be obvious how this is implemented within React. This article explains the choices we made in React's "diffing" algorithm so that component updates are predictable while being fast enough for high-performance apps.

## Motivation

When you use React, at a single point in time you can think of the `render()` function as creating a tree of React elements. On the next state or props update, that `render()` function will return a different tree of React elements. The React framework then needs to figure out a way to efficiently convert the first tree into the second tree.

There are some generic solutions to this algorithmic problem of generating the minimum number of operations to transform one tree into another. However, the [state of the art algorithms](http://grfia.dlsi.ua.es/ml/algorithms/references/editsurvey_bille.pdf) have a complexity in the order of O(n<sup>3</sup>) where n is the number of elements in the tree.

If we used this in React, displaying 1000 elements would require in the order of one billion comparisons. This is far too expensive. Instead, React implements a heuristic O(n) algorithm based on two assumptions:

1. Two elements of different types can be treated as totally different trees.
2. The developer can hint at which child elements may be stable across different renders with a `key` prop.

In practice, these assumptions are valid for almost all practical use cases.

## The Diffing Algorithm

When diffing two trees, React first compares the types of the two root elements. If the root elements have different types, React just throws away the first tree and builds the second tree from scratch. When the root elements have the same type, React first converts the root element, and then recurses. The specifics are different depending on whether the elements are DOM elements or component elements.

### DOM Elements

When comparing two React DOM elements, React looks at the attributes of both, keeps the same underlying DOM element, and only updates the changed attributes. For example:

```xml
<div className="before" title="stuff" />

<div className="after" title="stuff" />
```

When converting between these two elements, React knows to only modify the `className`.

When updating `style`, React also knows to update only the properties that changed. For example:

```xml
<div style={{'{{'}}color: 'red', fontWeight: 'bold'}} />

<div style={{'{{'}}color: 'green', fontWeight: 'bold'}} />
```

When converting between these two elements, React knows to only modify the `color` style, not the `fontWeight`.

After handling the DOM element, React then recurses on the children.

### Custom Components

When a component updates, the instance stays the same, so that state is maintained across renders. React takes all the attributes from the new component element and calls `componentWillReceiveProps()` and `componentWillUpdate()` on the previous one.

Next, the `render()` method is called and the diff algorithm recurses on the previous result and the new result.

### Recursing On Children

By default, when recursing on the children of a DOM element, React just iterates over both lists of children at the same time and generates a mutation whenever there's a difference.

For example, when adding an element at the end of the children, converting between these two trees works well:

```xml
<div>
  <span>first</span>
  <span>second</span>
</div>

<div>
  <span>first</span>
  <span>second</span>
  <span>third</span>
</div>
```

React will match the two `<span>first</span>` trees, match the two `<span>second</span>` trees, and then insert the `<span>third</span>` tree.

Inserting an element at the beginning has worse performance. For example, converting between these two trees works poorly:

```xml
<div>
  <span>Duke</span>
  <span>Villanova</span>
</div>

<div>
  <span>Connecticut</span>
  <span>Duke</span>
  <span>Villanova</span>
</div>
```

React will mutate every child instead of realizing it can keep the `<span>Duke</span>` and `<span>Villanova</span>` subtrees intact. This inefficiency can be a problem.

### Keys

In order to solve this issue, React supports an optional `key` attribute. When children have keys, React uses the key to match children in the original tree with children in the subsequent tree. For example, adding a `key` to our inefficient example above can make the tree conversion efficient:

```xml
<div>
  <span key={2015}>Duke</span>
  <span key={2016}>Villanova</span>
</div>

<div>
  <span key={2014}>Connecticut</span>
  <span key={2015}>Duke</span>
  <span key={2016}>Villanova</span>
</div>
```

In practice, finding a key is not really hard. Most of the time, the element you are going to display already has a unique id. When that's not the case, you can add a new ID property to your model or hash some parts of the content to generate a key. The key only has to be unique among its siblings, not globally unique.

## Tradeoffs

It is important to remember that the reconciliation algorithm is an implementation detail. React could rerender the whole app on every action; the end result would be the same. We are regularly refining the heuristics in order to make common use cases faster.

In the current implementation, you can express the fact that a subtree has been moved amongst its siblings, but you cannot tell that it has moved somewhere else. The algorithm will rerender that full subtree.

Because React relies on heuristics, if the assumptions behind them are not met, performance will suffer.

1. The algorithm will not try to match sub-trees of different component classes. If you see yourself alternating between two components classes with very similar output, you may want to make it the same class. In practice, we haven't found this to be an issue.

2. Keys should be stable, predictable, and unique. Unstable keys (like those produced by Math.random()) will cause many elements to be unnecessarily recreated, which can cause performance degradation and lost state in child components.

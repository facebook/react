---
id: reconciliation
title: Reconciliation
permalink: reconciliation.html
prev: special-non-dom-attributes.html
next: glossary.html
---

React's key design decision is to make the API seem like it re-renders the whole app on every update. This makes writing applications a lot easier but is also an incredible challenge to make it tractable. This article explains how with powerful heuristics we managed to turn a O(n<sup>3</sup>) problem into a O(n) one.


## Motivation

Generating the minimum number of operations to transform one tree into another is a complex and well-studied problem. The [state of the art algorithms](http://grfia.dlsi.ua.es/ml/algorithms/references/editsurvey_bille.pdf) have a complexity in the order of O(n<sup>3</sup>) where n is the number of nodes in the tree.

This means that displaying 1000 nodes would require in the order of one billion comparisons. This is far too expensive for our use case. To put this number in perspective, CPUs nowadays execute roughly 3 billion instruction per second. So even with the most performant implementation, we wouldn't be able to compute that diff in less than a second.

Since an optimal algorithm is not tractable, we implement a non-optimal O(n) algorithm using heuristics based on two assumptions:

1. Two components of the same class will generate similar trees and two components of different classes will generate different trees.
2. It is possible to provide a unique key for elements that is stable across different renders.

In practice, these assumptions are ridiculously fast for almost all practical use cases.


## Pair-wise diff

In order to do a tree diff, we first need to be able to diff two nodes. There are three different cases being handled.


### Different Node Types

If the node type is different, React is going to treat them as two different sub-trees, throw away the first one and build/insert the second one. 

```xml
renderA: <div />
renderB: <span />
=> [removeNode <div />], [insertNode <span />]
```

The same logic is used for custom components. If they are not of the same type, React is not going to even try at matching what they render. It is just going to remove the first one from the DOM and insert the second one.

```xml
renderA: <Header />
renderB: <Content />
=> [removeNode <Header />], [insertNode <Content />]
```

Having this high level knowledge is a very important aspect of why React diff algorithm is both fast and precise. It provides a good heuristic to quickly prune big parts of the tree and focus on parts likely to be similar.

It is very unlikely that a `<Header>` element is going generate a DOM that is going to look like what a `<Content>` would generate. Instead of spending time trying to match those two structures, React just re-builds the tree from scratch.

As a corollary, if there is a `<Header>` element at the same position in two consecutive renders, you would expect to see a very similar structure and it is worth exploring it.


### DOM Nodes

When comparing two DOM nodes, we look at the attributes of both and can decide which of them changed in linear time.

```xml
renderA: <div id="before" />
renderB: <div id="after" />
=> [replaceAttribute id "after"]
```

Instead of treating style as an opaque string, a key-value object is used instead. This lets us update only the properties that changed.

```xml
renderA: <div style={{'{{'}}color: 'red'}} />
renderB: <div style={{'{{'}}fontWeight: 'bold'}} />
=> [removeStyle color], [addStyle font-weight 'bold']
```

After the attributes have been updated, we recurse on all the children.


### Custom Components

We decided that the two custom components are the same. Since components are stateful, we cannot just use the new component and call it a day. React takes all the attributes from the new component and calls `component[Will/Did]ReceiveProps()` on the previous one.

The previous component is now operational. Its `render()` method is called and the diff algorithm restarts with the new result and the previous result.


## List-wise diff

### Problematic Case

In order to do children reconciliation, React adopts a very naive approach. It goes over both lists of children at the same time and generates a mutation whenever there's a difference.

For example if you add an element at the end:

```xml
renderA: <div><span>first</span></div>
renderB: <div><span>first</span><span>second</span></div>
=> [insertNode <span>second</span>]
```

Inserting an element at the beginning is problematic. React is going to see that both nodes are spans and therefore run into a mutation mode.

```xml
renderA: <div><span>first</span></div>
renderB: <div><span>second</span><span>first</span></div>
=> [replaceAttribute textContent 'second'], [insertNode <span>first</span>]
```

There are many algorithms that attempt to find the minimum sets of operations to transform a list of elements. [Levenshtein distance](http://en.wikipedia.org/wiki/Levenshtein_distance) can find the minimum using single element insertion, deletion and substitution in O(n<sup>2</sup>). Even if we were to use Levenshtein, this doesn't find when a node has moved into another position and algorithms to do that have much worse complexity.

### Keys

In order to solve this seemingly intractable issue, an optional attribute has been introduced. You can provide for each child a key that is going to be used to do the matching. If you specify a key, React is now able to find insertion, deletion, substitution and moves in O(n) using a hash table.


```xml
renderA: <div><span key="first">first</span></div>
renderB: <div><span key="second">second</span><span key="first">first</span></div>
=> [insertNode <span>second</span>]
```

In practice, finding a key is not really hard. Most of the time, the element you are going to display already has a unique id. When that's not the case, you can add a new ID property to your model or hash some parts of the content to generate a key. Remember that the key only has to be unique among its siblings, not globally unique.


## Trade-offs

It is important to remember that the reconciliation algorithm is an implementation detail. React could re-render the whole app on every action, the end-result would be the same. We are regularly refining the heuristics in order to make common use cases faster.

In the current implementation, you can express the fact that a sub-tree has been moved amongst its siblings, but you cannot tell that it has moved somewhere else. The algorithm will re-render that full sub-tree.

Because we rely on two heuristics, if the assumptions behind them are not met, performance will suffer.

1. The algorithm will not try to match sub-trees of different components classes. If you see yourself alternating between two components classes with very similar output, you may want to make it the same class. In practice, we haven't found this to be an issue.

2. If you don't provide stable keys (by using Math.random() for example), all the sub-trees are going to be re-rendered every single time. By giving the users the choice to choose the key, they have the ability to shoot themselves in the foot.


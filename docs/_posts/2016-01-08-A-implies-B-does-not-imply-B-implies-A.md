---
title: "(A => B) !=> (B => A)"
author: [jimfb]
---

The documentation for `componentWillReceiveProps` states that `componentWillReceiveProps` will be invoked when the props change as the result of a rerender. Some people assume this means "if `componentWillReceiveProps` is called, then the props must have changed", but that conclusion is logically incorrect.

The guiding principle is one of my favorites from formal logic/mathematics:
 > A implies B does not imply B implies A

Example: "If I eat moldy food, then I will get sick" does not imply "if I am sick, then I must have eaten moldy food". There are many other reasons I could be feeling sick. For instance, maybe the flu is circulating around the office. Similarly, there are many reasons that `componentWillReceiveProps` might get called, even if the props didn’t change.

If you don’t believe me, call `ReactDOM.render()` three times with the exact same props, and try to predict the number of times `componentWillReceiveProps` will get called:


```js
class Component extends React.Component {
  componentWillReceiveProps(nextProps) {
    console.log('componentWillReceiveProps', nextProps.data.bar);
  }
  render() {
    return <div>Bar {this.props.data.bar}!</div>;
  }
}

var container = document.getElementById('container');

var mydata = {bar: 'drinks'};
ReactDOM.render(<Component data={mydata} />, container);
ReactDOM.render(<Component data={mydata} />, container);
ReactDOM.render(<Component data={mydata} />, container);
```


In this case, the answer is "2". React calls `componentWillReceiveProps` twice (once for each of the two updates). Both times, the value of "drinks" is printed (ie. the props didn’t change).

To understand why, we need to think about what *could* have happened. The data *could* have changed between the initial render and the two subsequent updates, if the code had performed a mutation like this:

```js
var mydata = {bar: 'drinks'};
ReactDOM.render(<Component data={mydata} />, container);
mydata.bar = 'food'
ReactDOM.render(<Component data={mydata} />, container);
mydata.bar = 'noise'
ReactDOM.render(<Component data={mydata} />, container);
```

React has no way of knowing that the data didn’t change. Therefore, React needs to call `componentWillReceiveProps`, because the component needs to be notified of the new props (even if the new props happen to be the same as the old props).

You might think that React could just use smarter checks for equality, but there are some issues with this idea:

 * The old `mydata` and the new `mydata` are actually the same physical object (only the object’s internal value changed). Since the references are triple-equals-equal, doing an equality check doesn’t tell us if the value has changed. The only possible solution would be to have created a deep copy of the data, and then later do a deep comparison - but this can be prohibitively expensive for large data structures (especially ones with cycles).
 * The `mydata` object might contain references to functions which have captured variables within closures. There is no way for React to peek into these closures, and thus no way for React to copy them and/or verify equality.
 * The `mydata` object might contain references to objects which are re-instantiated during the parent's render (ie. not triple-equals-equal) but are conceptually equal (ie. same keys and same values). A deep-compare (expensive) could detect this, except that functions present a problem again because there is no reliable way to compare two functions to see if they are semantically equivalent.

Given the language constraints, it is sometimes impossible for us to achieve meaningful equality semantics. In such cases, React will call `componentWillReceiveProps` (even though the props might not have changed) so the component has an opportunity to examine the new props and act accordingly.

As a result, your implementation of `componentWillReceiveProps` MUST NOT assume that your props have changed. If you want an operation (such as a network request) to occur only when props have changed, your `componentWillReceiveProps` code needs to check to see if the props actually changed.



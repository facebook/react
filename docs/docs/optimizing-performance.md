---
id: optimizing-performance
title: Optimizing Performance
permalink: docs/optimizing-performance.html
---

Internally, React uses several clever techniques to minimize the number of costly DOM operations required to update the UI. For many applications, using React will lead to a fast user interface without doing much work to specifically optimize for performance. Nevertheless, there are several ways you can speed up your React application.

## Use The Production Build

If you're benchmarking or experiencing performance problems in your React apps, make sure you're testing with the minified production build:

* For Create React App, you need to run `npm run build` and follow the instructions.
* For single-file builds, we offer production-ready `.min.js` versions.
* For Browserify, you need to run it with `NODE_ENV=production`.
* For Webpack, you need to add this to plugins in your production config:

```js
new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('production')
  }
}),
new webpack.optimize.UglifyJsPlugin()
```

The development build includes extra warnings that are helpful when building your apps, but it is slower due to the extra bookkeeping it does.

## Avoid Reconciliation

React builds and maintains an internal representation of the rendered UI. It includes the React elements you return from your components. This representation lets React avoid creating DOM nodes and accessing existing ones beyond necessity, as that can be slower than operations on JavaScript objects. Sometimes it is referred to as "virtual DOM", but it works the same way on React Native.

When a component's props or state change, React decides whether an actual DOM update is necessary by comparing the newly returned element with the previously rendered one. When they are not equal, React will update the DOM.

In some cases, your component can speed all of this up by overriding the lifecycle function `shouldComponentUpdate`, which is triggered before the re-rendering process starts. The default implementation of this function returns `true`, leaving React to perform the update:

```javascript
shouldComponentUpdate(nextProps, nextState) {
  return true;
}
```

If you know that in some situations your component doesn't need to update, you can return `false` from `shouldComponentUpdate` instead, to skip the whole rendering process, including calling `render()` on this component and below. For example, if the only way your component ever changes is when the `props.color` or the `state.count` variable changes, you could have `shouldComponentUpdate` check that:

```javascript
class CounterButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {count: 1};
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.color !== nextProps.color) {
      return true;
    }
    if (this.state.count !== nextState.count) {
      return true;
    }
    return false;
  }

  render() {
    <button
      color={this.props.color}
      onClick={() => this.setState(state => ({count: state.count + 1}))}>
      Count: {this.state.count}
    </button>
  }
}
```

In this code, `shouldComponentUpdate` is just doing a shallow comparison between the old props and state, and the new props and state. If there is no difference, the component doesn't update. This pattern is common enough that React provides a helper to use this logic - just inherit from `React.PureComponent`. This code is a simpler way to achieve the same thing:

```js
class CounterButton extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {count: 1};
  }

  render() {
    <button
      color={this.props.color}
      onClick={() => this.setState(state => ({count: state.count + 1}))}>
      Count: {this.state.count}
    </button>
  }
}
```

Most of the time, you can use `React.PureComponent` instead of writing your own `shouldComponentUpdate`. It only does a shallow comparison, so you can't use it when the rendering function uses deep properties of the props or state. For example, if your render function refers to `this.props.foo.bar` or `this.state.qux.quux`, you should not use `React.PureComponent`.

## shouldComponentUpdate In Action

Here's a subtree of components. For each one, `SCU` indicates what `shouldComponentUpdate` returned, and `vDOMEq` indicates whether the rendered DOM elements were equivalent. Finally, the circle's color indicates whether the component had to be reconciled or not.

<figure><img src="/react/img/docs/should-component-update.png" /></figure>

Since `shouldComponentUpdate` returned `false` for the subtree rooted at C2, React did not attempt to render C2, and thus didn't even have to invoke `shouldComponentUpdate` on C4 and C5.

For C1 and C3, `shouldComponentUpdate` returned `true`, so React had to go down to the leaves and check them. For C6 `shouldComponentUpdate` returned `true`, and since the rendered DOM elements weren't equivalent React had to update the DOM.

The last interesting case is C8. React had to render this component, but since the DOM elements it returned were equal to the previously rendered ones, it didn't have to update the DOM.

Note that React only had to do DOM mutations for C6, which was inevitable. For C8, it bailed out by comparing the rendered DOM elements, and for C2's subtree and C7, it didn't even have to compare the elements as we bailed out on `shouldComponentUpdate`, and `render` was not called.

## Tricky Examples

Let's say that you have a component that just renders the string passed in `props.value`. We could implement this with `React.PureComponent`:

```javascript
class StringComponent extends React.PureComponent {
  render() {
    return <div>{this.props.value}</div>;
  }
}
```

If your components use more complex data structures, this might not be so simple. For example, let's say your component renders a comma-separated list of words. This code does *not* work correctly:

```javascript
class ListOfWords extends React.PureComponent {
  render() {
    return <div>{this.props.words.join(',')}</div>;
  }
}
```

The problem is that `PureComponent` will do a shallow comparison between the old and new values of `this.props.words`. If your application has a sequence of events like:

1. `let words = ['alpha', 'beta', 'gamma'];`
2. Render `<ListOfWords words={words} />`
3. `words.push('delta')`
4. Re-render `<ListOfWords words={words} />`

The `PureComponent` logic will actually prevent the rerender during step 4. This happens because the old and new values of `words` are the same list. `PureComponent` just does a shallow comparison, so it mistakenly thinks that nothing has changed in step 4.

One way to solve this is by writing a more complicated `shouldComponentUpdate` function:

```javascript
class ListOfWords extends React.Component {
  render() {
    return <div>{this.props.words.join(',')}</div>;
  }

  shouldComponentUpdate(nextProps, nextState) {
    // We have to do a possibly-expensive deep equality check
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

## The Power Of Not Mutating Data

If you never mutate data structures, you can use shallow comparisons and get the same result as a deep comparison. In this case, the code `words.push('delta')` is mutating the `words` array. Instead of using `push`, you can update without mutating by using `concat` or the ES6 spread operator:

```js
// The mutable way. This breaks React.PureComponent
words.push('delta');

// Update words without mutating. This works with React.PureComponent
words = words.concat(['delta']);

// Update words without mutating, with slightly nicer syntax
words = [...words, 'delta'];
```

There is a JavaScript proposal to add the [object spread operator](http://redux.js.org/docs/recipes/UsingObjectSpreadOperator.html) to make it easier to update objects without mutation as well. If you're using Create React App, this syntax is available by default.

```js
let colormap = {
  leftBorder: 'red',
  rightBorder: 'blue',
};

// The mutable way. This breaks React.PureComponent
colormap.rightBorder = 'green';

// Update colormap without mutating. This works with React.PureComponent
colormap = {
  ...colormap,
  rightBorder: 'green',
};
```

## Using Immutable Data Structures

[Immutable.js](https://github.com/facebook/immutable-js) is another way to solve this problem. It provides immutable, persistent collections that work via structural sharing:

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

Two other libraries that can help use immutable data are [seamless-immutable](https://github.com/rtfeldman/seamless-immutable) and [immutability-helper](https://github.com/kolodny/immutability-helper).

Immutable data structures provide you with a cheap way to track changes on objects, which is all we need to implement `shouldComponentUpdate`. This can often provide you with a nice performance boost.

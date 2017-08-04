---
id: update
title: Immutability Helpers
permalink: docs/update.html
layout: docs
category: Add-Ons
---

> Note:
>
> `update` is a legacy add-on. Use [`immutability-helper`](https://github.com/kolodny/immutability-helper) instead.

**Importing**

```javascript
import update from 'react-addons-update'; // ES6
var update = require('react-addons-update'); // ES5 with npm
```

## Overview

React lets you use whatever style of data management you want, including mutation. However, if you can use immutable data in performance-critical parts of your application it's easy to implement a fast [`shouldComponentUpdate()`](/react/docs/react-component.html#shouldcomponentupdate) method to significantly speed up your app.

Dealing with immutable data in JavaScript is more difficult than in languages designed for it, like [Clojure](http://clojure.org/). However, we've provided a simple immutability helper, `update()`, that makes dealing with this type of data much easier, *without* fundamentally changing how your data is represented. You can also take a look at Facebook's [Immutable-js](https://facebook.github.io/immutable-js/docs/) and the [Advanced Performance](/react/docs/advanced-performance.html) section for more detail on Immutable-js.

### The Main Idea

If you mutate data like this:

```js
myData.x.y.z = 7;
// or...
myData.a.b.push(9);
```

You have no way of determining which data has changed since the previous copy has been overwritten. Instead, you need to create a new copy of `myData` and change only the parts of it that need to be changed. Then you can compare the old copy of `myData` with the new one in `shouldComponentUpdate()` using triple-equals:

```js
const newData = deepCopy(myData);
newData.x.y.z = 7;
newData.a.b.push(9);
```

Unfortunately, deep copies are expensive, and sometimes impossible. You can alleviate this by only copying objects that need to be changed and by reusing the objects that haven't changed. Unfortunately, in today's JavaScript this can be cumbersome:

```js
const newData = extend(myData, {
  x: extend(myData.x, {
    y: extend(myData.x.y, {z: 7}),
  }),
  a: extend(myData.a, {b: myData.a.b.concat(9)})
});
```

While this is fairly performant (since it only makes a shallow copy of `log n` objects and reuses the rest), it's a big pain to write. Look at all the repetition! This is not only annoying, but also provides a large surface area for bugs.

## `update()`

`update()` provides simple syntactic sugar around this pattern to make writing this code easier. This code becomes:

```js
import update from 'react-addons-update';

const newData = update(myData, {
  x: {y: {z: {$set: 7}}},
  a: {b: {$push: [9]}}
});
```

While the syntax takes a little getting used to (though it's inspired by [MongoDB's query language](http://docs.mongodb.org/manual/core/crud-introduction/#query)) there's no redundancy, it's statically analyzable and it's not much more typing than the mutative version.

The `$`-prefixed keys are called *commands*. The data structure they are "mutating" is called the *target*.

## Available Commands

  * `{$push: array}` `push()` all the items in `array` on the target.
  * `{$unshift: array}` `unshift()` all the items in `array` on the target.
  * `{$splice: array of arrays}` for each item in `arrays` call `splice()` on the target with the parameters provided by the item.
  * `{$set: any}` replace the target entirely.
  * `{$merge: object}` merge the keys of `object` with the target.
  * `{$apply: function}` passes in the current value to the function and updates it with the new returned value.

## Examples

### Simple push

```js
const initialArray = [1, 2, 3];
const newArray = update(initialArray, {$push: [4]}); // => [1, 2, 3, 4]
```
`initialArray` is still `[1, 2, 3]`.

### Nested collections

```js
const collection = [1, 2, {a: [12, 17, 15]}];
const newCollection = update(collection, {2: {a: {$splice: [[1, 1, 13, 14]]}}});
// => [1, 2, {a: [12, 13, 14, 15]}]
```
This accesses `collection`'s index `2`, key `a`, and does a splice of one item starting from index `1` (to remove `17`) while inserting `13` and `14`.

### Updating a value based on its current one

```js
const obj = {a: 5, b: 3};
const newObj = update(obj, {b: {$apply: function(x) {return x * 2;}}});
// => {a: 5, b: 6}
// This is equivalent, but gets verbose for deeply nested collections:
const newObj2 = update(obj, {b: {$set: obj.b * 2}});
```

### (Shallow) Merge

```js
const obj = {a: 5, b: 3};
const newObj = update(obj, {$merge: {b: 6, c: 7}}); // => {a: 5, b: 6, c: 7}
```

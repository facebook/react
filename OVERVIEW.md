# Overview

The React DevTools extension consists of multiple pieces:
* The "frontend" portion is the extension you see (the Elements tree, the Profiler, etc.).
* The "backend" portion is invisible. It runs in the same context as React itself. When React commits changes to e.g. the DOM, the backend is responsible for notifying the frontend by sending a message through the "bridge".

One of the largest performance bottlenecks of the old React DevTools was the amount of bridge traffic that was sent. Each time React committed an update, the backend sent every fiber that changed across the bridge, resulting in a lot of (JSON) serialization. The primary goal for the DevTools rewrite was to reduce this traffic. Instead of sending everything across the bridge, the backend could only the minimum amount required to render the Elements tree– and the frontend could request more information (e.g. an element's props) on demand, only as needed.

The old DevTools also rendered the entire application tree in the form of a large DOM structure of nested nodes. A secondary goal of the rewrite was to avoid rendering unnecessary nodes by using a windowing library (specifically [bvaughn/react-window](https://github.com/bvaughn/react-window)).

## Serializing the tree

Every React commit that changes the tree in a way DevTools cares about results in an "_operations_" message being sent across the bridge. These messages are lightweight patches that describe the changes that were made. (We don't resend the full tree structure like in legacy DevTools.)

The payload for each message is a typed array. The first entry is a number identifying which renderer the update belongs to (for multi-root support). The rest of the array depends on the operations being made to the tree.

We only send the following bits of information: element type, id, parent id, owner id, name, and key. Additional information (e.g. props, state) requires a separate "_inspectElement_" message.

### Adding a root node

Adding a root to the tree requires sending 3 numbers:

1. add operation constant (`1`)
1. fiber id
1. element type constant (`8 === ElementTypeRoot`)

For example, adding a root fiber with an id of 1:
```js
[
  1, // add operation
  1, // fiber id
  8, // ElementTypeRoot
]
```

### Adding a leaf node

Adding a leaf node takes a variable number of numbers since we need to decode the name (and potentially the key):

1. add operation constant (`1`)
1. fiber id
1. element type constant (e.g. `1 === ElementTypeClass`)
1. parent fiber id
1. owner fiber id
1. UTF encoded display name size
   * (followed by this number of encoded values)
1. UTF encoded key size
   * (followed by this number of encoded values)

For example, adding a function component `<Foo>` with an id 2:
```js
[
  1,   // add operation
  2,   // fiber id
  2,   // ElementTypeFunction
  1,   // parent id
  0,   // owner id
  3,   // encoded display name size
  70,  // "F"
  111, // "o"
  111, // "o"
  0,   // encoded key (null)
]
```

### Removing a node

Removing a fiber from the tree (a root or a leaf) only requires sending 2 numbers:

1. remove operation constant (`2`)
1. fiber id

For example, removing a root fiber with an id of 1:
```js
[
  2, // remove operation
  1, // fiber id
]
```

### Re-ordering children

1. re-order children constant (`3`)
1. fiber id
1. number of children
   * (followed by an ordered list of child fiber ids)

For example:
```js
[
  3,  // re-order operation
  15, // fiber id
  2,  // number of children
  35, // first child id
  21, // second child id
]
```

## Reconstructing the tree

The frontend stores its information about the tree in a map of id to objects with the following keys:

* id: `number`
* parentID: `number`
* children: `Array<number>`
* type: `number` (constant)
* displayName: `string | null`
* key: `number | string | null`
* ownerID: `number`
* depth: `number` <sup>1</sup>
* weight: `number` <sup>2</sup>

<sup>1</sup> The `weight` of an element is the number of elements (including itself) below it in the tree. We cache this property so that we can quickly determine the total number of Elements as well as to find the Nth element within that set. (This enables us to use windowing.) This value needs to be adjusted each time elements are added or removed from the tree, but we amortize this over time to avoid any big performance hits when rendering the tree.

The `depth` value determines how much padding/indentation to use for the element when rendering it in the Elements panel. (This preserves the appearance of a nested tree, even though the view is a flat list.)

### Finding the element at index N

The tree data structure lets us impose an order on elements and "quickly" find the Nth one using the `weight` attribute.

First we find which root contains the index:
```js
let rootID;
let root;
let rootWeight = 0;
for (let i = 0; i < this._roots.length; i++) {
  rootID = this._roots[i];
  root = this._idToElement.get(rootID);
  if (root.children.length === 0) {
    continue;
  } else if (rootWeight + root.weight > index) {
    break;
  } else {
    rootWeight += root.weight;
  }
}
```

We skip the root itself because don't display them in the tree:
```js
const firstChildID = root.children[0];
```

Then we traverse the tree to find the element:
```js
let currentElement = this._idToElement.get(firstChildID);
let currentWeight = rootWeight;
while (index !== currentWeight) {
  for (let i = 0; i < currentElement.children.length; i++) {
    const childID = currentElement.children[i];
    const child = this._idToElement.get(childID);
    const { weight } = child;
    if (index <= currentWeight + weight) {
      currentWeight++;
      currentElement = child;
      break;
    } else {
      currentWeight += weight;
    }
  }
}
```
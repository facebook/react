# Overview

The React DevTools extension consists of multiple pieces:
* The **frontend** portion is the extension you see (the Elements tree, the Profiler, etc.).
* The **backend** portion is invisible. It runs in the same context as React itself. When React commits changes to e.g. the DOM, the backend is responsible for notifying the frontend by sending a message through the **bridge** (an abstraction around e.g. `postMessage`).

One of the largest performance bottlenecks of the old React DevTools was the amount of bridge traffic. Each time React commits an update, the backend sends every fiber that changed across the bridge, resulting in a lot of (JSON) serialization. The primary goal for the DevTools rewrite was to reduce this traffic. Instead of sending everything across the bridge, **the backend should only send the minimum amount required to render the Elements tree**. The frontend can request more information (e.g. an element's props) on demand, only as needed.

The old DevTools also rendered the entire application tree in the form of a large DOM structure of nested nodes. A secondary goal of the rewrite was to avoid rendering unnecessary nodes by using a windowing library (specifically [react-window](https://github.com/bvaughn/react-window)).

## Elements panel

### Serializing the tree

Every React commit that changes the tree in a way DevTools cares about results in an "_operations_" message being sent across the bridge. These messages are lightweight patches that describe the changes that were made. (We don't resend the full tree structure like in legacy DevTools.)

The payload for each message is a typed array. The first entry is a number identifying which renderer the update belongs to (for multi-root support). The rest of the array depends on the operations being made to the tree.

We only send the following bits of information: element type, id, parent id, owner id, name, and key. Additional information (e.g. props, state) requires a separate "_inspectElement_" message.

#### Adding a root node

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

#### Adding a leaf node

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

#### Removing a node

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

#### Re-ordering children

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

<sup>1</sup> The `depth` value determines how much padding/indentation to use for the element when rendering it in the Elements panel. (This preserves the appearance of a nested tree, even though the view is a flat list.)

<sup>2</sup> The `weight` of an element is the number of elements (including itself) below it in the tree. We cache this property so that we can quickly determine the total number of Elements as well as to find the Nth element within that set. (This enables us to use windowing.) This value needs to be adjusted each time elements are added or removed from the tree, but we amortize this over time to avoid any big performance hits when rendering the tree.

#### Finding the element at index N

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

## Profiler

All profiling information is stored on the backend while profiling is in progress. (Avoiding sending traffic across the bridge reduces the performance overhead of running the profiler.)

The backend push-notifies the frontend of when profiling starts ("_profilingStarted_") and stops ("_profilingStopped_"). All other profiling information is lazy and must be requested by the backend.

### Profiling summary

When the user opens the profiling tab, the frontend asks the backend if it has any profiling data for the currently-selected root. This is done by sending a "_profileSummary_" message with an id that identifies the root.

The response is a typed array summarizing the profiling session for that. It consists of the following values:

1. root id
1. number of interactions for the root in this profiling session
1. number of commits for the root in this profiling session

Followed by a series of tuples for each commit:

1. timestamp (relative to when profiling was started)
1. duration of commit

This is the minimal information required to render the main Profiler interface. 

Here is an example profiler summary:
```js
[
  1,   // root id
  0,   // no interactions were logged during this session
  3,   // number of commits
  210, // first commit started 210ms after profiling began
  10,  // and took 10ms
  284, // second commit started 284ms after profiling began
  13,  // and took 13ms
  303, // third commit started 303ms after profiling began
  5,   // and took 5ms
]
```

Additional information (e.g. which components were part of a specific commit, which interactions were logged) must be lazily requested by the frontend as a user interacts with the Profiler UI.

### Commit details

When a particular commit is selected, the frontend polls the backend for the information necessary to display the ["flame chart"](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html#flame-chart) and ["ranked chart"](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html#ranked-chart) views. This information includes the time and duration of the commit, any interactions that were part of the commit, and a tree representing the state of the React application as of that commit.

The frontend sends a "_profileCommitDetails_" message specifying which root and commit (index) it is interested in.  The backend sends a response to fill in missing details about the commit.

The response always beginning with 3 values:

1. root id
1. commit index (which commit this describes)
1. number of interactions

Next is a series of interactions (depending on the number specified previously) consisting of:

1. interaction id
1. timestamp (when the interaction was traced relative to when profiling started)
1. UTF encoded interaction display name size
   * (followed by this number of encoded values)

Finally a flattened representation of the React tree as of this commit operation:

1. element id
1. parent id
1. base duration
1. self duration
1. actual duration
1. UTF encoded display name size
   * (followed by this number of encoded values)

Here is an example commit containing two interactions and a tree of three React components:

```js
[
  1,   // root id
  0,   // commit index (the first commit)
  2,   // the number of interactions (represented below)

  1,   // first interaction id
  4,   // time when interaction was first traced
  3,   // encoded interaction name size
  70,  // "F"
  111, // "o"
  111, // "o"

  1,   // second interaction id
  5,   // time when interaction was first traced
  3,   // encoded interaction name size
  66,  // "B"
  97,  // "a"
  114, // "r"

  1,   // root fiber id
 -1,   // parent id (signifies the fiber is a root)
  15,  // base duration
  4,   // self duration
  15,  // actual duration
  4,   // UTF encoded display name size
  76,  // "L"
  105, // "i"
  115, // "s"
  116, // "t"

  2,   // fiber id
  1,   // parent id
  11,  // base duration
  8,   // self duration
  11,  // actual duration
  4,   // UTF encoded display name size
  73,  // "I"
  116, // "t"
  101, // "e"
  109, // "m"

  2,   // fiber id
  1,   // parent id
  8,   // base duration
  0,   // self duration
  0,   // actual duration (this component didn't render during this commit)
  4,   // UTF encoded display name size
  73,  // "I"
  116, // "t"
  101, // "e"
  109, // "m"
]
```

### Component commits

When a particular component (fiber) is selected, the frontend polls the backend for the aggregate data required to render the ["component chart"](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html#component-chart) view. This information includes each time the component rendered and how long it took.

The frontend sends a "_profileComponentDetails_" message specifying which root and commit number it is interested in. The backend sends a response that is serialized in a similar fashion as the Elements tree (above).

The response consists of the following values:

1. root id
1. fiber id
1. UTF encoded display name size
   * (followed by this number of encoded values)

Followed by a series of tuples for each time the fiber was committed. The tuples consist of:

1. commit index
1. duration of time spent rendering the component in this commit

Here is an example of a fiber that committed twice during a profiling session:

```js
[
  1,   // root id
  2,   // fiber id
  4,   // UTF encoded display name size
  73,  // "I"
  116, // "t"
  101, // "e"
  109, // "m"

  0,   // commit index 0
  11,  // actual duration for this fiber in commit 0

  3,   // commit index 3
  7,   // actual duration for this fiber in commit 3
]
```

### Interactions

The [Interactions chart](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html#interactions) shows a time series for every interaction that was traced in the recent profiler session. The frontend sends a "_profileInteractions_" message specifying which root it would like interaction data for. The backend sends a typed array as a response.

The response always begins with an id that identifies which root the interactions are associated with:

1. root id

Next is a series of interactions, consisting of:

1. interaction id
1. UTF encoded display name size
   * (followed by this number of encoded values)
1. Number of commits this interaction was associated with
   * (followed by the index of each commit)

Here is an example of a profiling session consisting of two interactions:

```js
[
  1,   // root id

  1,   // first interaction id
  3,   // encoded interaction name size
  70,  // "F"
  111, // "o"
  111, // "o"
  2,   // number of commits this interaction was associated with
  0,   // index of first commit
  3,   // index of second commit

  1,   // second interaction id
  3,   // encoded interaction name size
  66,  // "B"
  97,  // "a"
  114, // "r"
  1,   // number of commits this interaction was associated with
  0,   // index of first commit
]
```
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

Adding a root to the tree requires sending 4 numbers:

1. add operation constant (`1`)
1. fiber id
1. element type constant (`8 === ElementTypeRoot`)
1. profiling flag

For example, adding a root fiber with an id of 1:
```js
[
  1, // add operation
  1, // fiber id
  8, // ElementTypeRoot
  1, // this root's renderer supports profiling
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

The Profiler UI is a powerful tool for identifying and fixing performance problems. The primary goal of the new profiler is to minimize its impact (CPU usage) while profiling is active. This can be accomplished by:
* Minimizing bridge traffic.
* Making expensive computations lazy.

Profiling information is stored on the backend. The backend push-notifies the frontend of when profiling starts or stops by sending a "_profilingStatus_" message. (The frontend also asks for the current status after mounting by sending a "_getProfilingStatus_" message.)

When profiling begins, the frontend takes a snapshot/copy of each root. This snapshot includes the id, name, key, and child IDs for each node in the tree. (This information is already present on the frontend, so it does not require any additional bridge traffic.) While profiling is active, each time React commits– the frontend also stores a copy of the "_operations_" message (described above). Once profiling has finished, the frontend can use the original snapshot along with each of the stored "_operations_" messages to reconstruct the tree for each of the profiled commits.

When profiling begins, the backend records the base durations of each fiber currently in the tree. While profiling is in progress, the backend also stores some information <sup>1</sup> about each commit:
* Commit time and duration
* Which elements were rendered during that commit.
* Which interactions (if any) were part of the commit.

This information is kept on the backend until requested by the frontend (as described below).

<sup>1</sup> In the future, the backend may also store additional metadata (e.g. which props/states changed between rendered for a given component).

### Profiling summary

The profiling tab shows information for the currently-selected React root. When profiling completes (or when a new root is selected) the frontend first checks to see if there is any profiling data for the selected root. (Has it cached any "_operations_"?)

If so, then it sends a "_profileSummary_" message with an id that identifies the root. The backend then returns the following information:

* root id (to match request and response)
* number of interactions that were traced for this root
* the commits (each consisting of a timestamp and duration) that were profiled for the root
* tree base durations as of when profiling started

This is the minimal information required to render the main ["commit selector"](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html#browsing-commits). 

Here is an example profile summary:
```js
{
  rootID: 1,
  interactionCount: 2,

  // Tuples of commit time (relative to when profiling started) and duration
  commits: [
    210, // first commit started 210ms after profiling began
    10,  // and took 10ms

    284, // second commit started 284ms after profiling began
    13,  // and took 13ms

    303, // third commit started 303ms after profiling began
    5,   // and took 5ms
  ],

  // Tuples of fiber id and initial tree base duration
  treeBaseDuration: [
    1,  // fiber id
    11, // tree base duration when profiling started

    2,  // fiber id
    12, // tree base duration when profiling started

    3,  // fiber id
    8,  // tree base duration when profiling started
  ]
]
```

Additional information (e.g. which components were part of a specific commit, which interactions were logged) are lazily requested by the frontend as a user interacts with the Profiler UI.

### Commit details

When a commit is selected in the profiling view, the frontend needs to reconstruct the tree at that point in time using the snapshot and the "_operations_" it has cached.

In addition to this, it also needs to ask the backend for some additional information needed to display the ["flame chart"](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html#flame-chart) and ["ranked chart"](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html#ranked-chart) views. The frontend sends a "_profileCommitDetails_" message specifying which root and commit (index) it is interested in. The backend sends a response to fill in missing details about the commit:

* root id and commit index (to match request and response)
* which elements were rendered during the commit <sup>1</sup> and how long did they take
* which interactions were part of the commit

Here is an example commit in which two elements were rendered and one interaction was traced:

```js
{
  rootID: 1,
  commitIndex: 0,
  interactions: [
    {
      id: 1,
      timestamp: 4,
      name: "Foo"
    },
    {
      id: 2,
      timestamp: 4,
      name: "Bar"
    }
  ],
  nodes: [
    {
      id: 1,
      baseDuration: 15,
      selfDuration: 4,
      actualDuration: 15
    },
    {
      id: 2,
      baseDuration: 11,
      selfDuration: 8,
      actualDuration: 11
    }
  }
}
```

<sup>1</sup> Elements in the tree that are not explicitly included in the above response were not rendered during the current commit.

### Component commits

When a particular component (fiber) is selected, the frontend polls the backend for the aggregate data required to render the ["component chart"](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html#component-chart) view. The frontend sends a "_profileComponentDetails_" message specifying which root and component (id) it is interested in. The backend sends a response that includes:

* root and component ids (to match request and response)
* which commits was the component rendered in and how long did each take

Here is an example of a component that committed twice during a profiling session:

```js
{
  rootID: 1,
  id: 2,

  // Tuples of commit index and render duration (ms)
  commits: [
    0,  // index of first
    11  // duration (ms)

    2,  // index of second commit
    7   // duration (ms)
  ]
}
```

### Interactions

The [Interactions chart](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html#interactions) shows a time series for every interaction that was traced in the recent profiler session. The frontend sends a "_profileInteractions_" message specifying which root it would like interaction data for. The backend sends the following response:

* root id (to match request and response)
* interaction metadata

Here is an example of a profiling session consisting of two interactions:

```js
{
  rootID: 1,
  interactions: [
    {
      id: 1,
      name: "Foo",
      commits: [
        0, // index of first commit
        2  // index of second commit
      ]
    },
    {
      id: 2,
      name: "Bar",
      commits: [
        0  // index of first commit
      ]
    }
  ]
}
```

The backend does not need to resend the timestamp for each of the commits because that was already sent as part of the "_profileSummary_" message.
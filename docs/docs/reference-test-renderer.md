---
id: test-renderer
title: Test Renderer
permalink: docs/test-renderer.html
layout: docs
category: Reference
---

**Importing**

```javascript
import TestRenderer from 'react-test-renderer'; // ES6
const TestRenderer = require('react-test-renderer'); // ES5 with npm
```

## Overview

This package provides a React renderer that can be used to render React components to pure JavaScript objects, without depending on the DOM or a native mobile environment.

Essentially, this package makes it easy to grab a snapshot of the platform view hierarchy (similar to a DOM tree) rendered by a React DOM or React Native component without using a browser or [jsdom](https://github.com/tmpvar/jsdom).

Example:

```javascript
import TestRenderer from 'react-test-renderer';

function Link(props) {
  return <a href={props.page}>{props.children}</a>;
}

const testRenderer = TestRenderer.create(
  <Link page="https://www.facebook.com/">Facebook</Link>
);

console.log(testRenderer.toJSON());
// { type: 'a',
//   props: { href: 'https://www.facebook.com/' },
//   children: [ 'Facebook' ] }
```

You can use Jest's snapshot testing feature to automatically save a copy of the JSON tree to a file and check in your tests that it hasn't changed: [Learn more about it](http://facebook.github.io/jest/blog/2016/07/27/jest-14.html).

You can also traverse the output to find specific nodes and make assertions about them.

```javascript
import TestRenderer from 'react-test-renderer';

function MyComponent() {
  return (
    <div>
      <SubComponent foo="bar" />
      <p className="my">Hello</p>
    </div>
  )
}

function SubComponent() {
  return (
    <p className="sub">Sub</p>
  );
}

const testRenderer = TestRenderer.create(<MyComponent />);
const testInstance = testRenderer.root;

expect(testInstance.findByType(SubComponent).props.foo).toBe('bar');
expect(testInstance.findByProps({className: "sub"}).children).toEqual(['Sub']);
```

### TestRenderer

* [`TestRenderer.create()`](#testrenderercreate)

### TestRenderer instance

* [`testRenderer.toJSON()`](#testrenderertojson)
* [`testRenderer.toTree()`](#testrenderertotree)
* [`testRenderer.update()`](#testrendererupdate)
* [`testRenderer.unmount()`](#testrendererunmount)
* [`testRenderer.getInstance()`](#testrenderergetinstance)
* [`testRenderer.root`](#testrendererroot)

### TestInstance

* [`testInstance.find()`](#testinstancefind)
* [`testInstance.findByType()`](#testinstancefindbytype)
* [`testInstance.findByProps()`](#testinstancefindbyprops)
* [`testInstance.findAll()`](#testinstancefindall)
* [`testInstance.findAllByType()`](#testinstancefindallbytype)
* [`testInstance.findAllByProps()`](#testinstancefindallbyprops)
* [`testInstance.instance`](#testinstanceinstance)
* [`testInstance.type`](#testinstancetype)
* [`testInstance.props`](#testinstanceprops)
* [`testInstance.parent`](#testinstanceparent)
* [`testInstance.children`](#testinstancechildren)

## Reference

### `TestRenderer.create()`

```javascript
TestRenderer.create(element, options);
```

Create a `TestRenderer` instance with the passed React element. It doesn't use the real DOM, but it still fully renders the component tree into memory so you can make assertions about it. The returned instance has the following methods and properties.

### `testRenderer.toJSON()`

```javascript
testRenderer.toJSON()
```

Return an object representing the rendered tree. This tree only contains the platform-specific nodes like `<div>` or `<View>` and their props, but doesn't contain any user-written components. This is handy for [snapshot testing](http://facebook.github.io/jest/docs/en/snapshot-testing.html#snapshot-testing-with-jest).

### `testRenderer.toTree()`

```javascript
testRenderer.toTree()
```

Return an object representing the rendered tree. Unlike `toJSON()`, the representation is more detailed than the one provided by `toJSON()`, and includes the user-written components. You probably don't need this method unless you're writing your own assertion library on top of the test rendererer.

### `testRenderer.update()`

```javascript
testRenderer.update(element)
```

Re-render the in-memory tree with a new root element. This simulates a React update at the root. If the new element has the same type and key as the previous element, the tree will be updated; otherwise, it will re-mount a new tree.

### `testRenderer.unmount()`

```javascript
testRenderer.unmount()
```

Unmount the in-memory tree, triggering the appropriate lifecycle events.

### `testRenderer.getInstance()`

```javascript
testRenderer.getInstance()
```

Return the instance corresponding to the root element, if available. This will not work if the root element is a functional component because they don't have instances.

### `testRenderer.root`

```javascript
testRenderer.root
```

Returns the root "test instance" object that is useful for making assertions about specific nodes in the tree. You can use it to find other "test instances" deeper below.

### `testInstance.find()`

```javascript
testInstance.find(test)
```

Find the first descendant test instance for which `test(testInstance)` returns `true`.

### `testInstance.findByType()`

```javascript
testInstance.findByType(type)
```

Find the first descendant test instance with the provided `type`.

### `testInstance.findByProps()`

```javascript
testInstance.findByProps(props)
```

Find the first descendant test instance with the provided `props`.

### `testInstance.findAll()`

```javascript
testInstance.findAll(test)
```

Find all descendant test instances for which `test(testInstance)` returns `true`.

### `testInstance.findAllByType()`

```javascript
testInstance.findAllByType(type)
```

Find all descendant test instances with the provided `type`.

### `testInstance.findAllByProps()`

```javascript
testInstance.findAllByProps(props)
```

Find all descendant test instances with the provided `props`.

### `testInstance.instance`

```javascript
testInstance.instance
```

The component instance corresponding to this test instance. It is only available for class components, as functional components don't have instances. It matches the `this` value inside the given component.

### `testInstance.type`

```javascript
testInstance.type
```

The component type corresponding to this test instance. For example, a `<Button />` component has a type of `Button`.

### `testInstance.props`

```javascript
testInstance.props
```

The props corresponding to this test instance. For example, a `<Button size="small />` component has `{size: 'small'}` as props.

### `testInstance.parent`

```javascript
testInstance.parent
```

The parent test instance of this test instance.

### `testInstance.children`

```javascript
testInstance.children
```

The children test instances of this test instance.

## Ideas

You can pass `createNodeMock` function to `TestRenderer.create` as the option, which allows for custom mock refs.
`createNodeMock` accepts the current element and should return a mock ref object.
This is useful when you test a component rely on refs.

```javascript
import TestRenderer from 'react-test-renderer';

class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.input = null;
  }
  componentDidMount() {
    this.input.focus();
  }
  render() {
    return <input type="text" ref={el => this.input = el} />
  }
}

let focused = false;
TestRenderer.create(
  <MyComponent />,
  {
    createNodeMock: (element) => {
      if (element.type === 'input') {
        // mock a focus function
        return {
          focus: () => {
            focused = true;
          }
        };
      }
      return null;
    }
  }
);
expect(focused).toBe(true);
```

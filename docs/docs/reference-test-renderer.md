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

* [`TestRenderer.create()`](#TestRenderer.create)

### TestRenderer instance

* [`testRenderer.toJSON()`](#testRenderer.toJSON)
* [`testRenderer.toTree()`](#testRenderer.toTree)
* [`testRenderer.update()`](#testRenderer.update)
* [`testRenderer.unmount()`](#testRenderer.unmount)
* [`testRenderer.getInstance()`](#testRenderer.getInstance)
* [`testRenderer.root`](#testRenderer.root)

### TestInstance

* [`testInstance.find()`](#testInstance.find)
* [`testInstance.findByType()`](#testInstance.findByType)
* [`testInstance.findByProps()`](#testInstance.findByProps)
* [`testInstance.findAll()`](#testInstance.findAll)
* [`testInstance.findAllByType()`](#testInstance.findAllByType)
* [`testInstance.findAllByProps()`](#testInstance.findAllByProps)
* [`testInstance.instance`](#testInstance.instance)
* [`testInstance.type`](#testInstance.type)
* [`testInstance.props`](#testInstance.props)
* [`testInstance.parent`](#testInstance.parent)
* [`testInstance.children`](#testInstance.children)

## Reference

### `TestRenderer.create()`

```javascript
TestRenderer.create(element, options);
```

Create a TestRenderer instance with a passed element, which has the following methods and properties.

### `testRenderer.toJSON()`

```javascript
testRenderer.toJSON()
```

Return a JSON object representing the element.

### `testRenderer.toTree()`

```javascript
testRenderer.toTree()
```

Return a tree object representing the element.

### `testRenderer.update()`

```javascript
testRenderer.update(element)
```

Update the element with a passed element.

### `testRenderer.unmount()`

```javascript
testRenderer.unmount()
```

Unmount the element from testRenderer.

### `testRenderer.getInstance()`

```javascript
testRenderer.getInstance()
```

Return a root container instance.

### `testRenderer.root`

```javascript
testRenderer.root
```

`root` is a testInstance, which has the following methods and properties.

### `testInstance.find()`

```javascript
testInstance.find(test)
```

Find a descendant testInstance that `test(testInstance)` is `true`.

### `testInstance.findByType()`

```javascript
testInstance.findByType(type)
```

Find a descendant testInstance that matches the provided type.

### `testInstance.findByProps()`

```javascript
testInstance.findByProps(props)
```

Find a descendant testInstance that matches the provided props.

### `testInstance.findAll()`

```javascript
testInstance.findAll(test)
```

Find all descendant testInstances that `test(testInstance)` is `true`.

### `testInstance.findAllByType()`

```javascript
testInstance.findAllByType(type)
```

Find all descendant testInstances that matches the provided type.

### `testInstance.findAllByProps()`

```javascript
testInstance.findAllByProps(props)
```

Find all descendant testInstances that matches the provided props.

### `testInstance.instance`

```javascript
testInstance.instance
```

`instance` is a component instance of the testInstance.

### `testInstance.type`

```javascript
testInstance.type
```

`type` is a Component type of the testInstance.

### `testInstance.props`

```javascript
testInstance.props
```

`props` is a props object of the testInstance.

### `testInstance.parent`

```javascript
testInstance.parent
```

`parent` is a parent testInstance.

### `testInstance.children`

```javascript
testInstance.children
```

`children` is children of the testInstance.

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

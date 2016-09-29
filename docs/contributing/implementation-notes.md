---
id: implementation-notes
title: Implementation Notes
layout: contributing
permalink: contributing/implementation-notes.html
prev: codebase-overview.html
next: design-principles.html
---

This section is a collection of implementation notes for the [stack reconciler](/react/contributing/codebase-overview.html#stack-reconciler).

It is very technical and assumes a strong understanding of React public API as well as how it's divided into core, renderers, and the reconciler. If you're not very familiar with the React codebase, read [the codebase overview](/react/contributing/codebase-overview.html) first.

The stack reconciler is powering all the React production code today. It is located in [`src/renderers/shared/stack/reconciler`](https://github.com/facebook/react/tree/master/src/renderers/shared/stack) and is used by both React DOM and React Native.

### Overview

The reconciler itself doesn't have a public API. [Renderers](/react/contributing/codebase-overview.html#stack-renderers) like React DOM and React Native use it to efficiently update the user interface according to the React components written by the user.

#### Mounting

Let's consider the first time you mount a component:

```js
ReactDOM.render(<App />, rootEl);
```

React DOM will pass `<App />` along to the reconciler. Remember that `<App />` is a React element, that is, a description of *what* to render. You can think about it as a plain object:

```js
console.log(<App />);
// { type: App, props: {} }
```

The reconciler will check if `App` is a class or a function.

If `App` is a function, it will call `App()` to get the rendered element.

If `App` is a class, the reconciler will create `new App()`, call the `componentWillMount()` lifecycle method, and then will call `render()` method to get the rendered element.

Either way, the reconciler will learn the element `App` "rendered to".

This process is recursive. `App` may render to a `<Greeting />`, `Greeting` may render to a `<Button />`, and so on. The reconciler will "drill down" through user-defined components recursively as it learns what each component renders to.

You can imagine this process as a pseudocode:

```js
function isClass(type) {
  // React.Component subclasses have this flag
  return type.prototype && Boolean(type.prototype.isReactComponent);
}

function mount(element) {
  var type = element.type;
  var props = element.props;
  var renderedElement;

  if (isClass(type)) {
    // Component class
    var instance = new type(props);
    instance.componentWillMount();
    renderedElement = instance.render();
  } else {
    // Component function
    renderedElement = type(props);
  }

  // Mount the rendered output
  return mount(renderedElement);
}

var rootEl = document.getElementById('root');
var node = mount(<App />);
rootEl.appendChild(node);
```

>**Note:**
>
>This really *is* a pseudo-code. It isn't similar to the real implementation. It will also cause a stack overflow because we haven't discussed when to stop the recursion.

This process would be useless if we didn't render something to the screen as a result.

In addition to user-defined ("composite") components, React elements may also represent platform-specific ("host") components. For example, `Button` might return a `<div />` from its render method.

If element's `type` property is a string, we are dealing with a host element:

```js
console.log(<div />);
// { type: 'div', props: {} }
```

There is no user-defined code associated with host elements.

When the reconciler encounters a host element, it lets the renderer take care of mounting it. For example, React DOM would create a DOM node.

If the host element has children, the reconciler recursively mounts them following the same algorithm as above. It doesn't matter whether children are host, like `<div><hr /></div>`, composite, like `<div><Button /></div>`, or both, because we already showed the algorithm understands either kind of elements.

The DOM nodes produced by the child components will be appended to the parent DOM node, and recursively, the complete DOM structure will be assembled.

If we were to extend the code to handle host elements, it would look like this:

```js
function isClass(type) {
  // React.Component subclasses have this flag
  return type.prototype && Boolean(type.prototype.isReactComponent);
}

function mountComposite(element) {
  var type = element.type;
  var props = element.props;

  var renderedElement;
  if (isClass(type)) {
    // Component class
    var instance = new type(props);
    instance.componentWillMount();
    renderedElement = instance.render();
  } else if (typeof type === 'function') {
    // Component function
    renderedElement = type(props);
  }

  // Mount the rendered output
  return mount(renderedElement);
}

function mountHost(element) {
  var type = element.type;
  var props = element.props;
  var children = props.children;
  
  // This block of code shouldn't be in the reconciler.
  // Different renderers might initialize nodes differently.
  // For example, React Native would create iOS or Android views.
  var node = document.createElement(type);
  Object.keys(props).forEach(propName => {
    if (propName !== 'children') {
      node.setAttribute(propName, props[propName]);
    }
  });
    
  // Mount the children
  children.filter(Boolean).forEach(childElement => {
    var childNode = mount(childElement);

    // This line of code is also renderer-specific.
    // It would be different depending on the renderer:
    node.appendChild(childNode);
  });
  
  // Return the DOM node as mount result
  return node;
}

function mount(element) {
  var type = element.type;
  if (typeof type === 'function') {
    // User-defined components
    return mountComposite(element);
  } else if (typeof type === 'string') {
    // Platform-specific components
    return mountHost(element); 
  }
}

var rootEl = document.getElementById('root');
var node = mount(<App />);
rootEl.appendChild(node);
```

This is working but still far from how the reconciler is really implemented. The key missing ingredient is support for updates.

#### Updating

TODO

### Future Directions

Stack reconciler has inherent limitations such as being synchronous and unable to interrupt the work or split it in chunks. There is a work in progress on the [new Fiber reconciler](/react/contributing/codebase-overview.html#fiber-reconciler) with a [completely different architecture](https://github.com/acdlite/react-fiber-architecture). In the future, we intend to replace stack reconciler with it, but at the moment it is far from feature parity.

### Next Steps

Read the [next section](/react/contributing/design-principles.html) to learn about the guiding principles we use for React development.

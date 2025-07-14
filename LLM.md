# React Library API Reference

**Version:** 19.1.0  
**Homepage:** https://react.dev/  
**Repository:** https://github.com/facebook/react  
**License:** MIT

## Overview

React is a JavaScript library for building user interfaces. This document covers the complete API surface of React and its ecosystem packages.

## Table of Contents

1. [React Core](#react-core)
2. [React DOM](#react-dom)
3. [React Hooks](#react-hooks)
4. [React Server Components](#react-server-components)
5. [Development Tools](#development-tools)
6. [Testing Utilities](#testing-utilities)

---

# React Core

**Import:** `import { ... } from 'react'`

## Components

### Component
```javascript
class Component {
  constructor(props, context, updater)
  setState(partialState, callback)
  forceUpdate(callback)
}
```
Base class for React components.

### PureComponent
```javascript
class PureComponent extends Component
```
Component with shallow comparison in shouldComponentUpdate.

## Element Creation

### createElement
```javascript
createElement(type, props, ...children) => ReactElement
```
Creates React elements.

### cloneElement
```javascript
cloneElement(element, props, ...children) => ReactElement
```
Clones and returns new React element.

### isValidElement
```javascript
isValidElement(object) => boolean
```
Verifies if object is a React element.

## Context API

### createContext
```javascript
createContext<T>(defaultValue: T) => ReactContext<T>
```
Creates Context for passing data through component tree.

## Higher-Order Components

### forwardRef
```javascript
forwardRef<Props, ElementType>(
  render: (props: Props, ref: RefSetter<ElementRef<ElementType>>) => ReactNode
) => ForwardRefComponent
```
Forwards refs through components.

### memo
```javascript
memo<Props>(
  Component: ElementType,
  compare?: (oldProps: Props, newProps: Props) => boolean
) => MemoComponent
```
Memoizes components to prevent unnecessary re-renders.

### lazy
```javascript
lazy<T>(ctor: () => Promise<{default: T}>) => LazyComponent<T>
```
Enables code-splitting with lazy loading.

## Built-in Components

- **Fragment** - Groups elements without DOM nodes
- **StrictMode** - Enables additional development checks
- **Suspense** - Handles loading states
- **Profiler** - Measures rendering performance

## Hooks

### State Hooks
- **useState** - Local component state
- **useReducer** - Complex state logic

### Effect Hooks
- **useEffect** - Side effects after render
- **useLayoutEffect** - Synchronous effects
- **useInsertionEffect** - Effects before DOM mutations

### Performance Hooks
- **useMemo** - Memoizes expensive calculations
- **useCallback** - Memoizes callback functions

### Ref Hooks
- **useRef** - Mutable ref objects
- **useImperativeHandle** - Customizes ref exposure

### Context Hook
- **useContext** - Consumes context values

### Concurrent Hooks
- **useTransition** - Non-urgent transitions
- **useDeferredValue** - Defers value updates
- **useSyncExternalStore** - External store subscriptions

### Utility Hooks
- **useId** - Unique IDs for accessibility
- **useDebugValue** - DevTools labels

### Experimental Hooks
- **useOptimistic** - Optimistic updates
- **useActionState** - Form action state
- **use** - Unwraps promises/context

---

# React DOM

## Main Package (`react-dom`)

**Import:** `import { ... } from 'react-dom'`

### Core APIs
- **createPortal(children, container, key?)** - Render outside parent
- **flushSync(callback)** - Synchronous updates
- **version** - React DOM version

### Resource Preloading
- **prefetchDNS(href)** - DNS prefetch
- **preconnect(href, options?)** - Server preconnect
- **preload(href, options)** - Resource preload
- **preloadModule(href, options?)** - ES module preload
- **preinit(href, options)** - Resource preinit
- **preinitModule(href, options?)** - ES module preinit

### Form APIs
- **useFormState(action, initialState)** - Form state with server actions
- **useFormStatus()** - Form submission status
- **requestFormReset(form)** - Programmatic form reset

## Client APIs (`react-dom/client`)

**Import:** `import { createRoot, hydrateRoot } from 'react-dom/client'`

### Root Management
- **createRoot(container, options?)** - Creates React root
- **hydrateRoot(container, initialChildren, options?)** - Hydrates server content

## Server APIs (`react-dom/server`)

**Import:** `import { ... } from 'react-dom/server'`

### Legacy Rendering
- **renderToString(element)** - HTML string with React attributes
- **renderToStaticMarkup(element)** - Static HTML without React

### Streaming Rendering
- **renderToPipeableStream(element, options)** - Node.js stream
- **renderToReadableStream(element, options)** - Web Streams API
- **resume(request, options)** - Resume suspended render

## Static Rendering (`react-dom/static`)

- **prerender(children, options?)** - Pre-render to static HTML
- **prerenderToNodeStream(children, options?)** - Pre-render to stream

---

# React Hooks

## Additional Hook Packages

### use-sync-external-store
**Import:** `import { useSyncExternalStore } from 'use-sync-external-store'`

```javascript
useSyncExternalStore<T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T
) => T
```

### use-subscription
**Import:** `import { useSubscription } from 'use-subscription'`

```javascript
useSubscription<Value>({
  getCurrentValue: () => Value,
  subscribe: (callback: Function) => () => void
}) => Value
```

---

# React Server Components

## Core Server Package (`react-server`)

**Import:** `import { ... } from 'react-server'`

### Request Management
- **createRequest(children, resumableState, renderState, ...)** - New server request
- **createPrerenderRequest(...)** - Prerendering request
- **resumeRequest(...)** - Resume postponed request
- **startWork(request)** - Start rendering work
- **startFlowing(request, destination)** - Start streaming
- **abort(request, reason)** - Abort request

## Webpack Integration (`react-server-dom-webpack`)

### Server APIs
**Import:** `import { ... } from 'react-server-dom-webpack/server'`

- **renderToReadableStream(model, webpackMap, options?)** - RSC to stream
- **renderToPipeableStream(model, webpackMap, options?)** - RSC to Node stream
- **decodeReply(body, webpackMap, options?)** - Decode client payloads
- **registerServerReference(reference, id, exportName?)** - Register server functions

### Client APIs
**Import:** `import { ... } from 'react-server-dom-webpack/client'`

- **createFromFetch(promiseForResponse, options?)** - RSC from fetch
- **createFromReadableStream(stream, options?)** - RSC from stream
- **encodeReply(value, options?)** - Encode client data
- **createServerReference(id, callServer)** - Server action reference

## ESM Integration (`react-server-dom-esm`)

Similar APIs optimized for ESM modules.

---

# Development Tools

## Scheduler (`scheduler`)

**Import:** `import { ... } from 'scheduler'`

### Priority Levels
- **unstable_ImmediatePriority**
- **unstable_UserBlockingPriority**
- **unstable_NormalPriority**
- **unstable_LowPriority**
- **unstable_IdlePriority**

### Core Functions
- **unstable_scheduleCallback(priority, callback, options?)** - Schedule task
- **unstable_cancelCallback(task)** - Cancel task
- **unstable_runWithPriority(priority, handler)** - Run with priority
- **unstable_shouldYield()** - Check if should yield
- **unstable_now()** - Current time

## React-is (`react-is`)

**Import:** `import { ... } from 'react-is'`

### Type Checking
- **isElement(object)** - Check if React element
- **isFragment(object)** - Check if Fragment
- **isForwardRef(object)** - Check if forwardRef
- **isMemo(object)** - Check if memo
- **isLazy(object)** - Check if lazy
- **isContextProvider(object)** - Check if Context.Provider
- **isContextConsumer(object)** - Check if Context.Consumer
- **typeOf(object)** - Get React element type
- **isValidElementType(type)** - Check if valid element type

## ESLint Plugin (`eslint-plugin-react-hooks`)

**Import:** `const plugin = require('eslint-plugin-react-hooks')`

### Rules
- **rules-of-hooks** - Enforces Rules of Hooks
- **exhaustive-deps** - Warns about missing dependencies
- **react-compiler** - React Compiler integration

---

# Testing Utilities

## React Test Renderer (`react-test-renderer`)

**Import:** `import { create, act } from 'react-test-renderer'`

- **create(element, options?)** - Create test renderer
- **act(callback)** - Wrap updates for testing

## Debug Tools (`react-debug-tools`)

**Import:** `import { inspectHooks } from 'react-debug-tools'`

- **inspectHooks(renderFunction, props)** - Inspect hooks in render
- **inspectHooksOfFiber(fiber)** - Inspect hooks of fiber

## Jest React (`jest-react`)

**Import:** `import { unstable_toMatchRenderedOutput } from 'jest-react'`

- **unstable_toMatchRenderedOutput(root, expectedJSX)** - Match rendered output

## Internal Test Utils (`internal-test-utils`)

**Import:** `import { waitForAll, act, assertLog } from 'internal-test-utils'`

### Async Testing
- **waitForAll(expectedLog)** - Wait for all work
- **waitFor(expectedLog, options?)** - Wait for sequence
- **waitForThrow(expectedError?)** - Wait for error
- **waitForMicrotasks()** - Wait for microtasks

### Assertions
- **assertLog(expectedLog)** - Assert log sequence
- **assertConsoleErrorDev(messages)** - Assert console errors
- **assertConsoleWarnDev(messages)** - Assert console warnings
- **clearLogs()** - Clear logs

---

## Usage Examples

### Basic Component
```javascript
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### Server Component
```javascript
// Server Component
import { renderToPipeableStream } from 'react-server-dom-webpack/server';

function ServerComponent() {
  return <div>Hello from server!</div>;
}

const { pipe } = renderToPipeableStream(
  <ServerComponent />,
  clientManifest
);

pipe(response);
```

### Testing
```javascript
import { create, act } from 'react-test-renderer';

test('component renders correctly', () => {
  const renderer = create(<MyComponent />);
  
  act(() => {
    renderer.update(<MyComponent prop="new" />);
  });
  
  expect(renderer.toJSON()).toMatchSnapshot();
});
```

---

## Key Concepts

- **Components**: Building blocks of React applications
- **Hooks**: Functions that let you use state and lifecycle in functional components
- **Context**: Pass data through component tree without props
- **Suspense**: Handle loading states and code splitting
- **Server Components**: Render components on the server
- **Concurrent Features**: Non-blocking rendering and transitions
- **Portals**: Render children outside parent DOM hierarchy

## Best Practices

- Use functional components with hooks for new code
- Follow the Rules of Hooks
- Use TypeScript for better development experience
- Implement proper error boundaries
- Use React DevTools for debugging
- Test components with React Testing Library or Test Renderer
- Use Suspense for code splitting and data fetching
- Optimize with memo, useMemo, and useCallback when needed


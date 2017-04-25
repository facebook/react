---
id: codebase-overview
title: Codebase Overview
layout: contributing
permalink: contributing/codebase-overview.html
prev: how-to-contribute.html
next: implementation-notes.html
---

This section will give you an overview of the React codebase organization, its conventions, and the implementation.

If you want to [contribute to React](/react/contributing/how-to-contribute.html) we hope that this guide will help you feel more comfortable making changes.

We don't necessarily recommend any of these conventions in React apps. Many of them exist for historical reasons and might change with time.

### Custom Module System

At Facebook, internally we use a custom module system called "Haste". It is similar to [CommonJS](https://nodejs.org/docs/latest/api/modules.html) and also uses `require()` but has a few important differences that often confuse outside contributors.

In CommonJS, when you import a module, you need to specify its relative path:

```js
// Importing from the same folder:
var setInnerHTML = require('./setInnerHTML');

// Importing from a different folder:
var setInnerHTML = require('../utils/setInnerHTML');

// Importing from a deeply nested folder:
var setInnerHTML = require('../client/utils/setInnerHTML');
```

However, with Haste **all filenames are globally unique.** In the React codebase, you can import any module from any other module by its name alone:

```js
var setInnerHTML = require('setInnerHTML');
```

Haste was originally developed for giant apps like Facebook. It's easy to move files to different folders and import them without worrying about relative paths. The fuzzy file search in any editor always takes you to the correct place thanks to globally unique names.

React itself was extracted from Facebook's codebase and uses Haste for historical reasons. In the future, we will probably [migrate React to use CommonJS or ES Modules](https://github.com/facebook/react/issues/6336) to be more aligned with the community. However, this requires changes in Facebook's internal infrastructure so it is unlikely to happen very soon.

**Haste will make more sense to you if you remember a few rules:**

* All filenames in the React source code are unique. This is why they're sometimes verbose.
* When you add a new file, make sure you include a [license header](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/dom/client/utils/setInnerHTML.js#L1-L10). You can copy it from any existing file. A license header always includes [a line like this](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/dom/client/utils/setInnerHTML.js#L9). Change it to match the name of the file you created.
* Don’t use relative paths when importing. Instead of `require('./setInnerHTML')`, write `require('setInnerHTML')`.

When we compile React for npm, a script copies all the modules into [a single flat directory called `lib`](https://unpkg.com/react@15/lib/) and prepends all `require()` paths with `./`. This way Node, Browserify, Webpack, and other tools can understand React build output without being aware of Haste.

**If you're reading React source on GitHub and want to jump to a file, press "t".**

This is a GitHub shortcut for searching the current repo for fuzzy filename matches. Start typing the name of the file you are looking for, and it will show up as the first match.

### External Dependencies

React has almost no external dependencies. Usually, a `require()` points to a file in React's own codebase. However, there are a few relatively rare exceptions.

If you see a `require()` that does not correspond to a file in the React repository, you can look in a special repository called [fbjs](https://github.com/facebook/fbjs). For example, `require('warning')` will resolve to the [`warning` module from fbjs](https://github.com/facebook/fbjs/blob/df9047fec0bbd1e64635ae369c045975777cba7c/packages/fbjs/src/__forks__/warning.js).

The [fbjs repository](https://github.com/facebook/fbjs) exists because React shares some small utilities with libraries like [Relay](https://github.com/facebook/relay), and we keep them in sync. We don't depend on equivalent small modules in the Node ecosystem because we want Facebook engineers to be able to make changes to them whenever necessary. None of the utilities inside fbjs are considered to be public API, and they are only intended for use by Facebook projects such as React.

### Top-Level Folders

After cloning the [React repository](https://github.com/facebook/react), you will see a few top-level folders in it:

* [`src`](https://github.com/facebook/react/tree/master/src) is the source code of React. **If your change is related to the code, `src` is where you'll spend most of your time.**
* [`docs`](https://github.com/facebook/react/tree/master/docs) is the React documentation website. When you change APIs, make sure to update the relevant Markdown files.
* [`fixtures`](https://github.com/facebook/react/tree/master/fixtures) contains a few small React test applications for contributors.
* [`packages`](https://github.com/facebook/react/tree/master/packages) contains metadata (such as `package.json`) for all packages in the React repository. Nevertheless, their source code is still located inside [`src`](https://github.com/facebook/react/tree/master/src).
* `build` is the build output of React. It is not in the repository but it will appear in your React clone after you [build it](/react/contributing/how-to-contribute.html#development-workflow) for the first time.

There are a few other top-level folders but they are mostly used for the tooling and you likely won't ever encounter them when contributing.

### Colocated Tests

We don't have a top-level directory for unit tests. Instead, we put them into a directory called `__tests__` relative to the files that they test.

For example, a test for [`setInnerHTML.js`](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/dom/client/utils/setInnerHTML.js) is located in [`__tests__/setInnerHTML-test.js`](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/dom/client/utils/__tests__/setInnerHTML-test.js) right next to it.

### Shared Code

Even though Haste allows us to import any module from anywhere in the repository, we follow a convention to avoid cyclic dependencies and other unpleasant surprises. By convention, a file may only import files in the same folder or in subfolders below.

For example, files inside [`src/renderers/dom/stack/client`](https://github.com/facebook/react/blob/f53854424b33692907234fe7a1f80b888fd80751/src/renderers/dom/stack/client) may import other files in the same folder or any folder below.

However they can't import modules from [`src/renderers/dom/stack/server`](https://github.com/facebook/react/blob/f53854424b33692907234fe7a1f80b888fd80751/src/renderers/dom/stack/server) because it is not a child directory of [`src/renderers/dom/stack/client`](https://github.com/facebook/react/blob/f53854424b33692907234fe7a1f80b888fd80751/src/renderers/dom/stack/client).

There is an exception to this rule. Sometimes we *do* need to share functionality between two groups of modules. In this case, we hoist the shared module up to a folder called `shared` inside the closest common ancestor folder of the modules that need to rely on it.

For example, code shared between [`src/renderers/dom/stack/client`](https://github.com/facebook/react/blob/f53854424b33692907234fe7a1f80b888fd80751/src/renderers/dom/stack/client) and [`src/renderers/dom/stack/server`](https://github.com/facebook/react/blob/f53854424b33692907234fe7a1f80b888fd80751/src/renderers/dom/stack/server) lives in [`src/renderers/dom/shared`](https://github.com/facebook/react/blob/f53854424b33692907234fe7a1f80b888fd80751/src/renderers/dom/shared).

By the same logic, if [`src/renderers/dom/stack/client`](https://github.com/facebook/react/blob/f53854424b33692907234fe7a1f80b888fd80751/src/renderers/dom/stack/client) needs to share a utility with something in [`src/renderers/native`](https://github.com/facebook/react/blob/f53854424b33692907234fe7a1f80b888fd80751/src/renderers/native), this utility would be in [`src/renderers/shared`](https://github.com/facebook/react/blob/f53854424b33692907234fe7a1f80b888fd80751/src/renderers/shared).

This convention is not enforced but we check for it during a pull request review.

### Warnings and Invariants

The React codebase uses the `warning` module to display warnings:

```js
var warning = require('warning');

warning(
  2 + 2 === 4,
  'Math is not working today.'
);
```

**The warning is shown when the `warning` condition is `false`.**

One way to think about it is that the condition should reflect the normal situation rather than the exceptional one.

It is a good idea to avoid spamming the console with duplicate warnings:

```js
var warning = require('warning');

var didWarnAboutMath = false;
if (!didWarnAboutMath) {
  warning(
    2 + 2 === 4,
    'Math is not working today.'
  );
  didWarnAboutMath = true;
}
```

Warnings are only enabled in development. In production, they are completely stripped out. If you need to forbid some code path from executing, use `invariant` module instead:

```js
var invariant = require('invariant');

invariant(
  2 + 2 === 4,
  'You shall not pass!'
);
```

**The invariant is thrown when the `invariant` condition is `false`.**

"Invariant" is just a way of saying "this condition always holds true". You can think about it as making an assertion.

It is important to keep development and production behavior similar, so `invariant` throws both in development and in production. The error messages are automatically replaced with error codes in production to avoid negatively affecting the byte size.

### Development and Production

You can use `__DEV__` pseudo-global variable in the codebase to guard development-only blocks of code.

It is inlined during the compile step, and turns into `process.env.NODE_ENV !== 'production'` checks in the CommonJS builds.

For standalone builds, it becomes `true` in the unminified build, and gets completely stripped out with the `if` blocks it guards in the minified build.

```js
if (__DEV__) {
  // This code will only run in development.
}
```

### JSDoc

Some of the internal and public methods are annotated with [JSDoc annotations](http://usejsdoc.org/):

```js
/**
  * Updates this component by updating the text content.
  *
  * @param {ReactText} nextText The next text content
  * @param {ReactReconcileTransaction} transaction
  * @internal
  */
receiveComponent: function(nextText, transaction) {
  // ...
},
```

We try to keep existing annotations up-to-date but we don't enforce them. We don't use JSDoc in the newly written code, and instead use Flow to document and enforce types.

### Flow

We recently started introducing [Flow](https://flowtype.org/) checks to the codebase. Files marked with the `@flow` annotation in the license header comment are being typechecked.

We accept pull requests [adding Flow annotations to existing code](https://github.com/facebook/react/pull/7600/files). Flow annotations look like this:

```js
ReactRef.detachRefs = function(
  instance: ReactInstance,
  element: ReactElement | string | number | null | false,
): void {
  // ...
}
```

When possible, new code should use Flow annotations.  
You can run `npm run flow` locally to check your code with Flow.

### Classes and Mixins

React was originally written in ES5. We have since enabled ES6 features with [Babel](http://babeljs.io/), including classes. However, most of React code is still written in ES5.

In particular, you might see the following pattern quite often:

```js
// Constructor
function ReactDOMComponent(element) {
  this._currentElement = element;
}

// Methods
ReactDOMComponent.Mixin = {
  mountComponent: function() {
    // ...
  }
};

// Put methods on the prototype
Object.assign(
  ReactDOMComponent.prototype,
  ReactDOMComponent.Mixin
);

module.exports = ReactDOMComponent;
```

The `Mixin` in this code has no relation to React `mixins` feature. It is just a way of grouping a few methods under an object. Those methods may later get attached to some other class. We use this pattern in a few places although we try to avoid it in the new code.

The equivalent code in ES6 would look like this:

```js
class ReactDOMComponent {
  constructor(element) {
    this._currentElement = element;
  }

  mountComponent() {
    // ...
  }
}

module.exports = ReactDOMComponent;
```

Sometimes we [convert old code to ES6 classes](https://github.com/facebook/react/pull/7647/files). However, this is not very important to us because there is an [ongoing effort](#fiber-reconciler) to replace the React reconciler implementation with a less object-oriented approach which wouldn't use classes at all.

### Dynamic Injection

React uses dynamic injection in some modules. While it is always explicit, it is still unfortunate because it hinders understanding of the code. The main reason it exists is because React originally only supported DOM as a target. React Native started as a React fork. We had to add dynamic injection to let React Native override some behaviors.

You may see modules declaring their dynamic dependencies like this:

```js
// Dynamically injected
var textComponentClass = null;

// Relies on dynamically injected value
function createInstanceForText(text) {
  return new textComponentClass(text);
}

var ReactHostComponent = {
  createInstanceForText,

  // Provides an opportunity for dynamic injection
  injection: {
    injectTextComponentClass: function(componentClass) {
      textComponentClass = componentClass;
    },
  },
};

module.exports = ReactHostComponent;
```

The `injection` field is not handled specially in any way. But by convention, it means that this module wants to have some (presumably platform-specific) dependencies injected into it at runtime.

In React DOM, [`ReactDefaultInjection`](https://github.com/facebook/react/blob/4f345e021a6bd9105f09f3aee6d8762eaa9db3ec/src/renderers/dom/shared/ReactDefaultInjection.js) injects a DOM-specific implementation:

```js
ReactHostComponent.injection.injectTextComponentClass(ReactDOMTextComponent);
```

In React Native, [`ReactNativeDefaultInjection`](https://github.com/facebook/react/blob/4f345e021a6bd9105f09f3aee6d8762eaa9db3ec/src/renderers/native/ReactNativeDefaultInjection.js) injects its own implementation:

```js
ReactHostComponent.injection.injectTextComponentClass(ReactNativeTextComponent);
```

There are multiple injection points in the codebase. In the future, we intend to get rid of the dynamic injection mechanism and wire up all the pieces statically during the build.

### Multiple Packages

React is a [monorepo](http://danluu.com/monorepo/). Its repository contains multiple separate packages so that their changes can be coordinated together, and documentation and issues live in one place.

The npm metadata such as `package.json` files is located in the [`packages`](https://github.com/facebook/react/tree/master/packages) top-level folder. However, there is almost no real code in it.

For example, [`packages/react/react.js`](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/packages/react/react.js) re-exports [`src/isomorphic/React.js`](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/isomorphic/React.js), the real npm entry point. Other packages mostly repeat this pattern. All the important code lives in [`src`](https://github.com/facebook/react/tree/master/src).

While the code is separated in the source tree, the exact package boundaries are slightly different for npm packages and standalone browser builds.

### React Core

The "core" of React includes all the [top-level `React` APIs](/react/docs/top-level-api.html#react), for example:

* `React.createElement()`
* `React.Component`
* `React.Children`

**React core only includes the APIs necessary to define components.** It does not include the [reconciliation](/react/docs/reconciliation.html) algorithm or any platform-specific code. It is used both by React DOM and React Native components.

The code for React core is located in [`src/isomorphic`](https://github.com/facebook/react/tree/master/src/isomorphic) in the source tree. It is available on npm as the [`react`](https://www.npmjs.com/package/react) package. The corresponding standalone browser build is called `react.js`, and it exports a global called `React`.

>**Note:**
>
>Until very recently, `react` npm package and `react.js` standalone build contained all React code (including React DOM) rather than just the core. This was done for backward compatibility and historical reasons. Since React 15.4.0, the core is better separated in the build output.
>
>There is also an additional standalone browser build called `react-with-addons.js` which we will consider separately further below.

### Renderers

React was originally created for the DOM but it was later adapted to also support native platforms with [React Native](http://facebook.github.io/react-native/). This introduced the concept of "renderers" to React internals.

**Renderers manage how a React tree turns into the underlying platform calls.**

Renderers are located in [`src/renderers`](https://github.com/facebook/react/tree/master/src/renderers/):

* [React DOM Renderer](https://github.com/facebook/react/tree/master/src/renderers/dom) renders React components to the DOM. It implements [top-level `ReactDOM` APIs](/react/docs/top-level-api.html#reactdom) and is available as [`react-dom`](https://www.npmjs.com/package/react-dom) npm package. It can also be used as standalone browser bundle called `react-dom.js` that exports a `ReactDOM` global.
* [React Native Renderer](https://github.com/facebook/react/tree/master/src/renderers/native) renders React components to native views. It is used internally by React Native via [`react-native-renderer`](https://www.npmjs.com/package/react-native-renderer) npm package. In the future a copy of it may get checked into the React Native [repository](https://github.com/facebook/react-native) so that React Native can update React at its own pace.
* [React Test Renderer](https://github.com/facebook/react/tree/master/src/renderers/testing) renders React components to JSON trees. It is used by the [Snapshot Testing](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html) feature of [Jest](https://facebook.github.io/jest) and is available as [react-test-renderer](https://www.npmjs.com/package/react-test-renderer) npm package.

The only other officially supported renderer is [`react-art`](https://github.com/reactjs/react-art). To avoid accidentally breaking it as we make changes to React, we checked it in as [`src/renderers/art`](https://github.com/facebook/react/tree/master/src/renderers/art) and run its test suite. Nevertheless, its [GitHub repository](https://github.com/reactjs/react-art) still acts as the source of truth.

While it is [technically possible](https://github.com/iamdustan/tiny-react-renderer) to create custom React renderers, this is currently not officially supported. There is no stable public contract for custom renderers yet which is another reason why we keep them all in a single place.

>**Note:**
>
>Technically the [`native`](https://github.com/facebook/react/tree/master/src/renderers/native) renderer is a very thin layer that teaches React to interact with React Native implementation. The real platform-specific code managing the native views lives in the [React Native repository](https://github.com/facebook/react-native) together with its components.

### Reconcilers

Even vastly different renderers like React DOM and React Native need to share a lot of logic. In particular, the [reconciliation](/react/docs/reconciliation.html) algorithm should be as similar as possible so that declarative rendering, custom components, state, lifecycle methods, and refs work consistently across platforms.

To solve this, different renderers share some code between them. We call this part of React a "reconciler". When an update such as `setState()` is scheduled, the reconciler calls `render()` on components in the tree and mounts, updates, or unmounts them.

Reconcilers are not packaged separately because they currently have no public API. Instead, they are exclusively used by renderers such as React DOM and React Native.

### Stack Reconciler

The "stack" reconciler is the one powering all React production code today. It is located in [`src/renderers/shared/stack/reconciler`](https://github.com/facebook/react/tree/master/src/renderers/shared/stack) and is used by both React DOM and React Native.

It is written in an [object-oriented way](https://en.wikipedia.org/wiki/Composite_pattern) and maintains a separate tree of "internal instances" for all React components. The internal instances exist both for user-defined ("composite") and platform-specific ("host") components. The internal instances are inaccessible directly to the user, and their tree is never exposed.

When a component mounts, updates, or unmounts, the stack reconciler calls a method on that internal instance. The methods are called `mountComponent(element)`, `receiveComponent(nextElement)`, and `unmountComponent(element)`.

#### Host Components

Platform-specific ("host") components, such as `<div>` or a `<View>`, run platform-specific code. For example, React DOM instructs the stack reconciler to use [`ReactDOMComponent`](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/dom/shared/ReactDOMComponent.js) to handle [mounting](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/dom/shared/ReactDOMComponent.js#L517), [updates](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/dom/shared/ReactDOMComponent.js#L865), and [unmounting](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/dom/shared/ReactDOMComponent.js#L1140) of DOM components.

Regardless of the platform, both `<div>` and `<View>` handle managing multiple children in a similar way. For convenience, the stack reconciler provides a helper called [`ReactMultiChild`](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/shared/stack/reconciler/ReactMultiChild.js) that both DOM and Native renderers [use](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/dom/shared/ReactDOMComponent.js#L1203).

#### Composite Components

User-defined ("composite") components should behave the same way with all renderers. This is why the stack reconciler provides a shared implementation in [`ReactCompositeComponent`](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js). It is always the same regardless of the renderer.

Composite components also implement [mounting](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L181), [updating](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L703), and [unmounting](https://github.com/facebook/react/blob/87724bd87506325fcaf2648c70fc1f43411a87be/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L524). However, unlike host components, `ReactCompositeComponent` needs to behave differently depending on the user's code. This is why it calls methods, such as `render()` and `componentDidMount()`, on the user-supplied class.

During an update, `ReactCompositeComponent` checks whether the `render()` output has a different `type` or `key` than the last time. If neither `type` nor `key` has changed, it delegates the update to the existing child internal instance. Otherwise, it unmounts the old child instance and mounts a new one. This is described in the [reconciliation algorithm](/react/docs/reconciliation.html).

#### Recursion

During an update, the stack reconciler "drills down" through composite components, runs their `render()` methods, and decides whether to update or replace their single child instance. It executes platform-specific code as it passes through the host components like `<div>` and `<View>`. Host components may have multiple children which are also processed recursively.

It is important to understand that the stack reconciler always processes the component tree synchronously in a single pass. While individual tree branches may [bail out of reconciliation](/react/docs/advanced-performance.html#avoiding-reconciling-the-dom), the stack reconciler can't pause, and so it is suboptimal when the updates are deep and the available CPU time is limited.

#### Learn More

**The [next section](/react/contributing/implementation-notes.html) describes the current implementation in more details.**

### Fiber Reconciler

The "fiber" reconciler is a new effort aiming to resolve the problems inherent in the stack reconciler and fix a few long-standing issues.

It is a complete rewrite of the reconciler and is currently [in active development](https://github.com/facebook/react/pulls?utf8=%E2%9C%93&q=is%3Apr%20is%3Aopen%20fiber).

Its main goals are:

* Ability to split interruptible work in chunks.
* Ability to prioritize, rebase and reuse work in progress.
* Ability to yield back and forth between parents and children to support layout in React.
* Ability to return multiple elements from `render()`.
* Better support for error boundaries.

You can read more about it in [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture). At this moment, it is still very experimental, and far from feature parity with the stack reconciler.

Its source code is located in [`src/renderers/shared/fiber`](https://github.com/facebook/react/tree/master/src/renderers/shared/fiber).

### Event System

React implements a synthetic event system which is agnostic of the renderers and works both with React DOM and React Native. Its source code is located in [`src/renderers/shared/shared/event`](https://github.com/facebook/react/tree/master/src/renderers/shared/shared/event).

There is a [video with a deep code dive into it](https://www.youtube.com/watch?v=dRo_egw7tBc) (66 mins).

### What Next?

Read the [next section](/react/contributing/implementation-notes.html) to learn about the current implementation of reconciler in more detail.

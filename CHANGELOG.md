## 0.12.2 (December 18, 2014)

### React Core

* Added support for more HTML attributes: `formAction`, `formEncType`, `formMethod`, `formTarget`, `marginHeight`, `marginWidth`
* Added `strokeOpacity` to the list of unitless CSS properties
* Removed trailing commas (allows npm module to be bundled and used in IE8)
* Fixed bug resulting in error when passing `undefined` to `React.createElement` - now there is a useful warning

### React Tools

* JSX-related transforms now always use double quotes for props and `displayName`


## 0.12.1 (November 18, 2014)

### React Tools

* Types transform updated with latest support
* jstransform version updated with improved ES6 transforms
* Explicit Esprima dependency removed in favor of using Esprima information exported by jstransform


## 0.12.0 (October 28, 2014)

### React Core

#### Breaking Changes

* `key` and `ref` moved off props object, now accessible on the element directly
* React is now BSD licensed with accompanying Patents grant
* Default prop resolution has moved to Element creation time instead of mount time, making them effectively static
* `React.__internals` is removed - it was exposed for DevTools which no longer needs access
* Composite Component functions can no longer be called directly - they must be wrapped with `React.createFactory` first. This is handled for you when using JSX.

#### New Features

* Spread operator (`{...}`) introduced to deprecate `this.transferPropsTo`
* Added support for more HTML attributes: `acceptCharset`, `classID`, `manifest`

#### Deprecations

* `React.renderComponent` --> `React.render`
* `React.renderComponentToString` --> `React.renderToString`
* `React.renderComponentToStaticMarkup` --> `React.renderToStaticMarkup`
* `React.isValidComponent` --> `React.isValidElement`
* `React.PropTypes.component` --> `React.PropTypes.element`
* `React.PropTypes.renderable` --> `React.PropTypes.node`
* **DEPRECATED** `React.isValidClass`
* **DEPRECATED** `instance.transferPropsTo`
* **DEPRECATED** Returning `false` from event handlers to preventDefault
* **DEPRECATED** Convenience Constructor usage as function, instead wrap with `React.createFactory`
* **DEPRECATED** use of `key={null}` to assign implicit keys

#### Bug Fixes

* Better handling of events and updates in nested results, fixing value restoration in "layered" controlled components
* Correctly treat `event.getModifierState` as case sensitive
* Improved normalization of `event.charCode`
* Better error stacks when involving autobound methods
* Removed DevTools message when the DevTools are installed
* Correctly detect required language features across browsers
* Fixed support for some HTML attributes:
  * `list` updates correctly now
  * `scrollLeft`, `scrollTop` removed, these should not be specified as props
* Improved error messages

### React With Addons

#### New Features

* `React.addons.batchedUpdates` added to API for hooking into update cycle

#### Breaking Changes

* `React.addons.update` uses `assign` instead of `copyProperties` which does `hasOwnProperty` checks. Properties on prototypes will no longer be updated correctly.

#### Bug Fixes

* Fixed some issues with CSS Transitions

### JSX

#### Breaking Changes

* Enforced convention: lower case tag names are always treated as HTML tags, upper case tag names are always treated as composite components
* JSX no longer transforms to simple function calls

#### New Features

* `@jsx React.DOM` no longer required
* spread (`{...}`) operator introduced to allow easier use of props

#### Bug Fixes

* JSXTransformer: Make sourcemaps an option when using APIs directly (eg, for react-rails)


## 0.11.2 (September 16, 2014)

### React Core

#### New Features

* Added support for `<dialog>` element and associated `open` attribute
* Added support for `<picture>` element and associated `media` and `sizes` attributes
* Added `React.createElement` API in preparation for React v0.12
  * `React.createDescriptor` has been deprecated as a result

### JSX

* `<picture>` is now parsed into `React.DOM.picture`

### React Tools

* Update `esprima` and `jstransform` for correctness fixes
* The `jsx` executable now exposes a `--strip-types` flag which can be used to remove TypeScript-like type annotations
  * This option is also exposed to `require('react-tools').transform` as `stripTypes`

## 0.11.1 (July 24, 2014)

### React Core

#### Bug Fixes
* `setState` can be called inside `componentWillMount` in non-DOM environments
* `SyntheticMouseEvent.getEventModifierState` correctly renamed to `getModifierState`
* `getModifierState` correctly returns a `boolean`
* `getModifierState` is now correctly case sensitive
* Empty Text node used in IE8 `innerHTML` workaround is now removed, fixing rerendering in certain cases

### JSX
* Fix duplicate variable declaration in JSXTransformer (caused issues in some browsers)


## 0.11.0 (July 17, 2014)

### React Core

#### Breaking Changes
* `getDefaultProps()` is now called once per class and shared across all instances
* `MyComponent()` now returns a descriptor, not an instance
* `React.isValidComponent` and `React.PropTypes.component` validate *descriptors*, not component instances
* Custom `propType` validators should return an `Error` instead of logging directly

#### New Features
* Rendering to `null`
* Keyboard events include normalized `e.key` and `e.getModifierState()` properties
* New normalized `onBeforeInput` event
* `React.Children.count` has been added as a helper for counting the number of children

#### Bug Fixes

* Re-renders are batched in more cases
* Events: `e.view` properly normalized
* Added Support for more HTML attributes (`coords`, `crossOrigin`, `download`, `hrefLang`, `mediaGroup`, `muted`, `scrolling`, `shape`, `srcSet`, `start`, `useMap`)
* Improved SVG support
  * Changing `className` on a mounted SVG component now works correctly
  * Added support for elements `mask` and `tspan`
  * Added support for attributes `dx`, `dy`, `fillOpacity`, `fontFamily`, `fontSize`, `markerEnd`, `markerMid`, `markerStart`, `opacity`, `patternContentUnits`, `patternUnits`, `preserveAspectRatio`, `strokeDasharray`, `strokeOpacity`
* CSS property names with vendor prefixes (`Webkit`, `ms`, `Moz`, `O`) are now handled properly
* Duplicate keys no longer cause a hard error; now a warning is logged (and only one of the children with the same key is shown)
* `img` event listeners are now unbound properly, preventing the error "Two valid but unequal nodes with the same `data-reactid`"
* Added explicit warning when missing polyfills

### React With Addons
* PureRenderMixin: a mixin which helps optimize "pure" components
* Perf: a new set of tools to help with performance analysis
* Update: New `$apply` command to transform values
* TransitionGroup bug fixes with null elements, Android

### React NPM Module
* Now includes the pre-built packages under `dist/`.
* `envify` is properly listed as a dependency instead of a peer dependency

### JSX
* Added support for namespaces, eg `<Components.Checkbox />`
* JSXTransformer
  * Enable the same `harmony` features available in the command line with `<script type="text/jsx;harmony=true">`
  * Scripts are downloaded in parallel for more speed. They are still executed in order (as you would expect with normal script tags)
  * Fixed a bug preventing sourcemaps from working in Firefox

### React Tools Module
* Improved readme with usage and API information
* Improved ES6 transforms available with `--harmony` option
* Added `--source-map-inline` option to the `jsx` executable
* New `transformWithDetails` API which gives access to the raw sourcemap data


## 0.10.0 (March 21, 2014)

### React Core

#### New Features
* Added warnings to help migrate towards descriptors
* Made it possible to server render without React-related markup (`data-reactid`, `data-react-checksum`). This DOM will not be mountable by React. [Read the docs for `React.renderComponentToStaticMarkup`](http://facebook.github.io/react/docs/top-level-api.html#react.rendercomponenttostaticmarkup)
* Added support for more attributes:
  * `srcSet` for `<img>` to specify images at different pixel ratios
  * `textAnchor` for SVG

#### Bug Fixes
* Ensure all void elements don’t insert a closing tag into the markup.
* Ensure `className={false}` behaves consistently
* Ensure `this.refs` is defined, even if no refs are specified.

### Addons

* `update` function to deal with immutable data. [Read the docs](http://facebook.github.io/react/docs/update.html)

### react-tools
* Added an option argument to `transform` function. The only option supported is `harmony`, which behaves the same as `jsx --harmony` on the command line. This uses the ES6 transforms from [jstransform](https://github.com/facebook/jstransform).


## 0.9.0 (February 20, 2014)

### React Core

#### Breaking Changes

- The lifecycle methods `componentDidMount` and `componentDidUpdate` no longer receive the root node as a parameter; use `this.getDOMNode()` instead
- Whenever a prop is equal to `undefined`, the default value returned by `getDefaultProps` will now be used instead
- `React.unmountAndReleaseReactRootNode` was previously deprecated and has now been removed
- `React.renderComponentToString` is now synchronous and returns the generated HTML string
- Full-page rendering (that is, rendering the `<html>` tag using React) is now supported only when starting with server-rendered markup
- On mouse wheel events, `deltaY` is no longer negated
- When prop types validation fails, a warning is logged instead of an error thrown (with the production build of React, type checks are now skipped for performance)
- On `input`, `select`, and `textarea` elements, `.getValue()` is no longer supported; use `.getDOMNode().value` instead
- `this.context` on components is now reserved for internal use by React

#### New Features

- React now never rethrows errors, so stack traces are more accurate and Chrome's purple break-on-error stop sign now works properly
- Added support for SVG tags `defs`, `linearGradient`, `polygon`, `radialGradient`, `stop`
- Added support for more attributes:
  - `crossOrigin` for CORS requests
  - `download` and `hrefLang` for `<a>` tags
  - `mediaGroup` and `muted` for `<audio>` and `<video>` tags
  - `noValidate` and `formNoValidate` for forms
  - `property` for Open Graph `<meta>` tags
  - `sandbox`, `seamless`, and `srcDoc` for `<iframe>` tags
  - `scope` for screen readers
  - `span` for `<colgroup>` tags
- Added support for defining `propTypes` in mixins
- Added `any`, `arrayOf`, `component`, `oneOfType`, `renderable`, `shape` to `React.PropTypes`
- Added support for `statics` on component spec for static component methods
- On all events, `.currentTarget` is now properly set
- On keyboard events, `.key` is now polyfilled in all browsers for special (non-printable) keys
- On clipboard events, `.clipboardData` is now polyfilled in IE
- On drag events, `.dragTransfer` is now present
- Added support for `onMouseOver` and `onMouseOut` in addition to the existing `onMouseEnter` and `onMouseLeave` events
- Added support for `onLoad` and `onError` on `<img>` elements
- Added support for `onReset` on `<form>` elements
- The `autoFocus` attribute is now polyfilled consistently on `input`, `select`, and `textarea`

#### Bug Fixes

- React no longer adds an `__owner__` property to each component's `props` object; passed-in props are now never mutated
- When nesting top-level components (e.g., calling `React.renderComponent` within `componentDidMount`), events now properly bubble to the parent component
- Fixed a case where nesting top-level components would throw an error when updating
- Passing an invalid or misspelled propTypes type now throws an error
- On mouse enter/leave events, `.target`, `.relatedTarget`, and `.type` are now set properly
- On composition events, `.data` is now properly normalized in IE9 and IE10
- CSS property values no longer have `px` appended for the unitless properties `columnCount`, `flex`, `flexGrow`, `flexShrink`, `lineClamp`, `order`, `widows`
- Fixed a memory leak when unmounting children with a `componentWillUnmount` handler
- Fixed a memory leak when `renderComponentToString` would store event handlers
- Fixed an error that could be thrown when removing form elements during a click handler
- Boolean attributes such as `disabled` are rendered without a value (previously `disabled="true"`, now simply `disabled`)
- `key` values containing `.` are now supported
- Shortened `data-reactid` values for performance
- Components now always remount when the `key` property changes
- Event handlers are attached to `document` only when necessary, improving performance in some cases
- Events no longer use `.returnValue` in modern browsers, eliminating a warning in Chrome
- `scrollLeft` and `scrollTop` are no longer accessed on document.body, eliminating a warning in Chrome
- General performance fixes, memory optimizations, improvements to warnings and error messages

### React with Addons

- `React.addons.TestUtils` was added to help write unit tests
- `React.addons.TransitionGroup` was renamed to `React.addons.CSSTransitionGroup`
- `React.addons.TransitionGroup` was added as a more general animation wrapper
- `React.addons.cloneWithProps` was added for cloning components and modifying their props
- Bug fix for adding back nodes during an exit transition for CSSTransitionGroup
- Bug fix for changing `transitionLeave` in CSSTransitionGroup
- Performance optimizations for CSSTransitionGroup
- On checkbox `<input>` elements, `checkedLink` is now supported for two-way binding

### JSX Compiler and react-tools Package

- Whitespace normalization has changed; now space between two tags on the same line will be preserved, while newlines between two tags will be removed
- The `react-tools` npm package no longer includes the React core libraries; use the `react` package instead.
- `displayName` is now added in more cases, improving error messages and names in the React Dev Tools
- Fixed an issue where an invalid token error was thrown after a JSX closing tag
- `JSXTransformer` now uses source maps automatically in modern browsers
- `JSXTransformer` error messages now include the filename and problematic line contents when a file fails to parse

## 0.8.0 (December 19, 2013)

### React

* Added support for more attributes:
  * `rows` & `cols` for `<textarea>`
  * `defer` & `async` for `<script>`
  * `loop` for `<audio>` & `<video>`
  * `autoCorrect` for form fields (a non-standard attribute only supported by mobile WebKit)
* Improved error messages
* Fixed Selection events in IE11
* Added `onContextMenu` events

### React with Addons

* Fixed bugs with TransitionGroup when children were undefined
* Added support for `onTransition`

### react-tools

* Upgraded `jstransform` and `esprima-fb`

### JSXTransformer

* Added support for use in IE8
* Upgraded browserify, which reduced file size by ~65KB (16KB gzipped)


## 0.5.2, 0.4.2 (December 18, 2013)

### React

* Fixed a potential XSS vulnerability when using user content as a `key`: [CVE-2013-7035](https://groups.google.com/forum/#!topic/reactjs/OIqxlB2aGfU)


## 0.5.1 (October 29, 2013)

### React

* Fixed bug with `<input type="range">` and selection events.
* Fixed bug with selection and focus.
* Made it possible to unmount components from the document root.
* Fixed bug for `disabled` attribute handling on non-`<input>` elements.

### React with Addons

* Fixed bug with transition and animation event detection.


## 0.5.0 (October 16, 2013)

### React

* Memory usage improvements - reduced allocations in core which will help with GC pauses
* Performance improvements - in addition to speeding things up, we made some tweaks to stay out of slow path code in V8 and Nitro.
* Standardized prop -> DOM attribute process. This previously resulting in additional type checking and overhead as well as confusing cases for users. Now we will always convert your value to a string before inserting it into the DOM.
* Support for Selection events.
* Support for [Composition events](https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent).
* Support for additional DOM properties (`charSet`, `content`, `form`, `httpEquiv`, `rowSpan`, `autoCapitalize`).
* Support for additional SVG properties (`rx`, `ry`).
* Support for using `getInitialState` and `getDefaultProps` in mixins.
* Support mounting into iframes.
* Bug fixes for controlled form components.
* Bug fixes for SVG element creation.
* Added `React.version`.
* Added `React.isValidClass` - Used to determine if a value is a valid component constructor.
* Removed `React.autoBind` - This was deprecated in v0.4 and now properly removed.
* Renamed  `React.unmountAndReleaseReactRootNode` to `React.unmountComponentAtNode`.
* Began laying down work for refined performance analysis.
* Better support for server-side rendering - [react-page](https://github.com/facebook/react-page) has helped improve the stability for server-side rendering.
* Made it possible to use React in environments enforcing a strict [Content Security Policy](https://developer.mozilla.org/en-US/docs/Security/CSP/Introducing_Content_Security_Policy). This also makes it possible to use React to build Chrome extensions.

### React with Addons (New!)

* Introduced a separate build with several "addons" which we think can help improve the React experience. We plan to deprecate this in the long-term, instead shipping each as standalone pieces. [Read more in the docs](http://facebook.github.io/react/docs/addons.html).

### JSX

* No longer transform `class` to `className` as part of the transform! This is a breaking change - if you were using `class`, you *must* change this to `className` or your components will be visually broken.
* Added warnings to the in-browser transformer to make it clear it is not intended for production use.
* Improved compatibility for Windows
* Improved support for maintaining line numbers when transforming.


## 0.4.1 (July 26, 2013)

### React

* `setState` callbacks are now executed in the scope of your component.
* `click` events now work on Mobile Safari.
* Prevent a potential error in event handling if `Object.prototype` is extended.
* Don't set DOM attributes to the string `"undefined"` on update when previously defined.
* Improved support for `<iframe>` attributes.
* Added checksums to detect and correct cases where server-side rendering markup mismatches what React expects client-side.

### JSXTransformer

* Improved environment detection so it can be run in a non-browser environment.


## 0.4.0 (July 17, 2013)

### React

* Switch from using `id` attribute to `data-reactid` to track DOM nodes. This allows you to integrate with other JS and CSS libraries more easily.
* Support for more DOM elements and attributes (e.g., `<canvas>`)
* Improved server-side rendering APIs. `React.renderComponentToString(<component>, callback)` allows you to use React on the server and generate markup which can be sent down to the browser.
* `prop` improvements: validation and default values. [Read our blog post for details...](http://facebook.github.io/react/blog/2013/07/11/react-v0-4-prop-validation-and-default-values.html)
* Support for the `key` prop, which allows for finer control over reconciliation. [Read the docs for details...](http://facebook.github.io/react/docs/multiple-components.html)
* Removed `React.autoBind`. [Read our blog post for details...](http://facebook.github.io/react/blog/2013/07/02/react-v0-4-autobind-by-default.html)
* Improvements to forms. We've written wrappers around `<input>`, `<textarea>`, `<option>`, and `<select>` in order to standardize many inconsistencies in browser implementations. This includes support for `defaultValue`, and improved implementation of the `onChange` event, and circuit completion. [Read the docs for details...](http://facebook.github.io/react/docs/forms.html)
* We've implemented an improved synthetic event system that conforms to the W3C spec.
* Updates to your component are batched now, which may result in a significantly faster re-render of components. `this.setState` now takes an optional callback as it's second parameter. If you were using `onClick={this.setState.bind(this, state)}` previously, you'll want to make sure you add a third parameter so that the event is not treated as the callback.

### JSX

* Support for comment nodes `<div>{/* this is a comment and won't be rendered */}</div>`
* Children are now transformed directly into arguments instead of being wrapped in an array
  E.g. `<div><Component1/><Component2/></div>` is transformed into `React.DOM.div(null, Component1(null), Component2(null))`.
  Previously this would be transformed into `React.DOM.div(null, [Component1(null), Component2(null)])`.
  If you were using React without JSX previously, your code should still work.

### react-tools

* Fixed a number of bugs when transforming directories
* No longer re-write `require()`s to be relative unless specified


## 0.3.3 (June 20, 2013)

### React

* Allow reusing the same DOM node to render different components. e.g. `React.renderComponent(<div/>, domNode); React.renderComponent(<span/>, domNode);` will work now.

### JSX

* Improved the in-browser transformer so that transformed scripts will execute in the expected scope. The allows components to be defined and used from separate files.

### react-tools

* Upgrade Commoner so `require` statements are no longer relativized when passing through the transformer. This was a feature needed when building React, but doesn't translate well for other consumers of `bin/jsx`.
* Upgraded our dependencies on Commoner and Recast so they use a different directory for their cache.
* Freeze our esprima dependency.


## 0.3.2 (May 31, 2013)

### JSX

* Improved compatability with other coding styles (specifically, multiple assignments with a single `var`).

### react-tools

* Switch from using the browserified build to shipping individual modules. This allows react-tools to be used with [browserify](https://github.com/substack/node-browserify).


## 0.3.1 (May 30, 2013)

### react-tools

* Fix bug in packaging resulting in broken module.


## 0.3.0 (May 29, 2013)

* Initial public release

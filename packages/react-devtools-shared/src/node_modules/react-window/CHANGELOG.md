Changelog
------------

### 1.8.0
* 🎉 Added new "smart" align option for grid and list scroll-to-item methods ([gaearon](https://github.com/gaearon) - [#209](https://github.com/bvaughn/react-window/pull/209))

### 1.7.2
* 🐛 Add guards to avoid invalid scroll offsets when `scrollTo()` is called with a negative offset or when `scrollToItem` is called with invalid indices (negative or too large).

### 1.7.1
* 🐛 Fix SSR regression introduced in 1.7.0 - ([Betree](https://github.com/Betree) - [#185](https://github.com/bvaughn/react-window/pull/185))

### 1.7.0
* 🎉 Grid `scrollToItem` supports optional `rowIndex` and `columnIndex` params ([jgoz](https://github.com/jgoz) - [#174](https://github.com/bvaughn/react-window/pull/174))
* DEV mode checks for `WeakSet` support before using it to avoid requiring a polyfill for IE11 - ([jgoz](https://github.com/jgoz) - [#167](https://github.com/bvaughn/react-window/pull/167))

### 1.6.2
* 🐛 Bugfix for RTL  when scrolling back towards the beginning (right) of the list.

### 1.6.1
* 🐛 Bugfix to account for differences between Chrome and non-Chrome browsers with regard to RTL and "scroll" events.

### 1.6.0
* 🎉 RTL support added for lists and grids. Special thanks to [davidgarsan](https://github.com/davidgarsan) for his support. - [#156](https://github.com/bvaughn/react-window/pull/156)
* 🐛 Grid `scrollToItem` methods take scrollbar size into account when aligning items - [#153](https://github.com/bvaughn/react-window/issues/153)

### 1.5.2
* 🐛 Edge case bug fix for `VariableSizeList` and `VariableSizeGrid` when the number of items decreases while a scroll is in progress. - ([iamsolankiamit](https://github.com/iamsolankiamit) - [#138](https://github.com/bvaughn/react-window/pull/138))

### 1.5.1
* 🐛 Updated `getDerivedState` Flow annotations to address a warning in a newer version of Flow.

### 1.5.0
* 🎉 Added advanced memoization helpers methods `areEqual` and `shouldComponentUpdate` for item renderers. - [#114](https://github.com/bvaughn/react-window/issues/114)

### 1.4.0
* 🎉 List and Grid components now "overscan" (pre-render) in both directions when scrolling is not active. When scrolling is in progress, cells are only pre-rendered in the direction being scrolled. This change has been made in an effort to reduce visible flicker when scrolling starts without adding additional overhead during scroll (which is the most performance sensitive time).
* 🎉 Grid components now support separate `overscanColumnsCount` and `overscanRowsCount` props. Legacy `overscanCount` prop will continue to work, but with a deprecation warning in DEV mode.
* 🐛 Replaced `setTimeout` with `requestAnimationFrame` based timer, to avoid starvation issue for `isScrolling` reset. - [#106](https://github.com/bvaughn/react-window/issues/106)
* 🎉 Renamed List and Grid `innerTagName` and `outerTagName` props to `innerElementType` and `outerElementType` to formalize support for attaching arbitrary props (e.g. test ids) to List and Grid inner and outer DOM elements. Legacy `innerTagName` and `outerTagName` props will continue to work, but with a deprecation warning in DEV mode.
* 🐛 List re-renders items if `direction` prop changes. - [#104](https://github.com/bvaughn/react-window/issues/104)

### 1.3.1
* 🎉 Pass `itemData` value to custom `itemKey` callbacks when present - [#90](https://github.com/bvaughn/react-window/issues/90))

### 1.3.0
* (Skipped)

### 1.2.4
* 🐛 Added Flow annotations to memoized methods to avoid a Flow warning for newer versions of Flow

### 1.2.3
* 🐛 Relaxed `children` validation checks. They were too strict and didn't support new React APIs like `memo`.

### 1.2.2
* 🐛 Improved Flow types for class component item renderers - ([nicholas-l](https://github.com/nicholas-l) - [#77](https://github.com/bvaughn/react-window/pull/77))

### 1.2.1
* 🎉 Improved Flow types to include optional `itemData` parameter. ([TrySound](https://github.com/TrySound) - [#66](https://github.com/bvaughn/react-window/pull/66))
* 🐛 `VariableSizeList` and `VariableSizeGrid` no longer call size getter functions with invalid index when item count is zero.

### 1.2.0
* 🎉 Flow types added to NPM package. ([TrySound](https://github.com/TrySound) - [#40](https://github.com/bvaughn/react-window/pull/40))
* 🎉 Relaxed grid `scrollTo` method to make `scrollLeft` and `scrollTop` params _optional_ (so you can only update one axis if desired). - [#63](https://github.com/bvaughn/react-window/pull/63))
* 🐛 Fixed invalid `this` pointer in `VariableSizeGrid` that broke the `resetAfter*` methods - [#58](https://github.com/bvaughn/react-window/pull/58))
* Upgraded to babel 7 and used shared runtime helpers to reduce package size slightly. ([TrySound](https://github.com/TrySound) - [#48](https://github.com/bvaughn/react-window/pull/48))
* Remove `overflow:hidden` from inner container ([souporserious](https://github.com/souporserious) - [#56](https://github.com/bvaughn/react-window/pull/56))

### 1.1.2
* 🐛 Fixed edge case `scrollToItem` bug that caused lists/grids with very few items to have negative scroll offsets.

### 1.1.1
* 🐛 `FixedSizeGrid` and `FixedSizeList` automatically clear style cache when item size props change.

### 1.1.0
* 🎉 Use explicit `constructor` and `super` to generate cleaner component code. ([Andarist](https://github.com/Andarist) - [#26](https://github.com/bvaughn/react-window/pull/26))
* 🎉 Add optional `shouldForceUpdate` param reset-index methods to specify `forceUpdate` behavior. ([nihgwu](https://github.com/nihgwu) - [#32](https://github.com/bvaughn/react-window/pull/32))

### 1.0.3
* 🐛 Avoid unnecessary scrollbars for lists (e.g. no horizontal scrollbar for a vertical list) unless content requires them.

### 1.0.2

* 🎉 Enable Babel `annotate-pure-calls` option so that classes compiled by "transform-es2015-classes" are annotated with `#__PURE__`. This enables [UglifyJS to remove them if they are not referenced](https://github.com/mishoo/UglifyJS2/pull/1448), improving dead code elimination in application code. ([Andarist](https://github.com/Andarist) - [#20](https://github.com/bvaughn/react-window/pull/20))
* 🎉 Update "rollup-plugin-peer-deps-external" and use new `includeDependencies` flag so that the "memoize-one" dependency does not get inlined into the Rollup bundle. ([Andarist](https://github.com/Andarist) - [#19](https://github.com/bvaughn/react-window/pull/19))
* 🎉 Enable [Babel "loose" mode](https://babeljs.io/docs/en/babel-preset-env#loose) to reduce package size (-8%). ([Andarist](https://github.com/Andarist) - [#18](https://github.com/bvaughn/react-window/pull/18))

### 1.0.1
Updated `README.md` file to remove `@alpha` tag from NPM installation instructions.

# 1.0.0
Initial release of library. Includes the following components:
* `FixedSizeGrid`
* `FixedSizeList`
* `VariableSizeGrid`
* `VariableSizeList`

# React DevTools changelog

<details>
  <summary>
    Changes that have landed in master but are not yet released.
    Click to see more.
  </summary>
  
  <!-- Upcoming changes go here -->
</details>

## 4.7.0 (May 18, 2020)

#### Features
* Improved appended component stacks for third party warnings to be more like native ([bvaughn](https://github.com/bvaughn) in [#18656](https://github.com/facebook/react/pull/18656))
* Improve inline search results by highlighting match on HOC badge ([bl00mber](https://github.com/bl00mber) in [#18802](https://github.com/facebook/react/pull/18802))
* Add key badge to inspected element in right hand pane ([karlhorky]](https://github.com/karlhorky) in [#18737](https://github.com/facebook/react/pull/18737))
* Improve Profiler snapshot selector drag-and-drop UX ([bl00mber](https://github.com/bl00mber) in [#18852](https://github.com/facebook/react/pull/18852))
* Profiler tooltip now includes self duration to make it easier to scan times without requiring selection ([bvaughn](https://github.com/bvaughn) in [#18510](https://github.com/facebook/react/pull/18510))
* Rendered by list also now highlights native elements on hover ([hristo-kanchev](https://github.com/hristo-kanchev) in [#18479](https://github.com/facebook/react/pull/18479))
* Add in-page highlighting for mouse-over interactions in Profiler ([bl00mber](https://github.com/bl00mber) in [#18745](https://github.com/facebook/react/pull/18745))

#### Bugfix
* Fix Profiler bug "_Could not find commit data for root_" by resetting selected node on root change ([bl00mber](https://github.com/bl00mber) in [#18880](https://github.com/facebook/react/pull/18880))
* Add `imported` flag to Profiling data to more reliably differentiate between imported and session data ([bl00mber](https://github.com/bl00mber) in [#18913](https://github.com/facebook/react/pull/18913))
* Disable Profiler filtering to avoid edge case runtime error "_Cannot read property 'duration' of undefined_" ([bvaughn](https://github.com/bvaughn) in [#18862](https://github.com/facebook/react/pull/18862))
* Fix Profiler bug "_cannot read property 'memoizedState' of null_" ([bvaughn](https://github.com/bvaughn) in [#18522](https://github.com/facebook/react/pull/18522))
* Whitespace search results highlighting bug fix ([bvaughn](https://github.com/bvaughn) in [#18527](https://github.com/facebook/react/pull/18527))
* Improved confusing Profiler tooltip text for components that did not render ([bvaughn](https://github.com/bvaughn) in [#18523](https://github.com/facebook/react/pull/18523))
* Fix edge case performance issue when highlight elements enabled ([Faelivrinx](https://github.com/Faelivrinx) in [#18498](https://github.com/facebook/react/pull/18498))
* Disabled Webpack auto polyfill for `setImmediate` ([bvaughn](https://github.com/bvaughn) in [#18860](https://github.com/facebook/react/pull/18860))
* Fix mouse interactions for standalone DevTools on Linux ([bl00mber](https://github.com/bl00mber) in [#18772](https://github.com/facebook/react/pull/18772))

## 4.6.0 (March 26, 2020)

#### Features
* Add shortcut keys for tab switching ([kerolloz](https://github.com/kerolloz) in [#18248](https://github.com/facebook/react/pull/18248))

#### Bugfix
* Improve display of complex values for `useDebugValue` ([eps1lon](https://github.com/eps1lon) in [#18070](https://github.com/facebook/react/pull/18070))
* Fix minor CSS layout issue that broke Profiler commit selector UI ([bvaughn](https://github.com/bvaughn) in [#18286](https://github.com/facebook/react/pull/18286))
* Inlined DevTools event emitter implementation to fix a source of Profiler bugs ([bvaughn](https://github.com/bvaughn) in [#18378](https://github.com/facebook/react/pull/18378))

#### Cleanup
* Remove "es6-symbol" dependency from "react-devtools-inline" package ([bvaughn](https://github.com/bvaughn) in [#18397](https://github.com/facebook/react/pull/18397))

## 4.5.0 (March 3, 2020)

#### Features
* Improve function props display for inspected elements ([bvaughn](https://github.com/bvaughn) in [#17789](https://github.com/facebook/react/pull/17789))
* Re-enabled context menu for Firefox extension ([bvaughn](https://github.com/bvaughn) in [#17838](https://github.com/facebook/react/pull/17838))
* Apply changes to props/state/hooks on blur (rather than on ENTER) ([muratcatal](https://github.com/muratcatal) in [#17062](https://github.com/facebook/react/pull/17062))
* Add info tooltip to nodes in Profiler ([M-Izadmehr](https://github.com/M-Izadmehr) in [#18048](https://github.com/facebook/react/pull/18048))
* Added resize support to Components panel ([hristo-kanchev](https://github.com/hristo-kanchev) in [#18046](https://github.com/facebook/react/pull/18046))

#### Bugfix
* Improve how empty commits are filtered ([nutboltu](https://github.com/nutboltu) in [#17931](https://github.com/facebook/react/pull/17931))
* BigInt serialize issue in devtools copy to clipboard ([bvaughn](https://github.com/bvaughn) in [#17771](https://github.com/facebook/react/pull/17771))
* Renamed "backend.js" to "react_devtools_backend.js" to reduce potential confusion from profiling ([bvaughn](https://github.com/bvaughn) in [#17790](https://github.com/facebook/react/pull/17790))
* Update root styles to prevent `box-sizing` style from leaking outside of inline target ([GasimGasimzada](https://github.com/GasimGasimzada) in [#17775](https://github.com/facebook/react/pull/17775))
* Fix "_Cannot read property 'sub' of undefined_" error when navigating to plain-text pages ([wfnuser](https://github.com/wfnuser) in [#17848](https://github.com/facebook/react/pull/17848))
* Fix potential error with composite hooks during shallow re-rendering ([bvaughn](https://github.com/bvaughn) in [#18130](https://github.com/facebook/react/pull/18130))
* Scope dev tools wildcard styles within DevTools CSS class ([@GasimGasimzada](https://github.com/GasimGasimzada) in [9cc094a](https://github.com/facebook/react/commit/9cc094a19a9e43d33ba5ac713935e657ea4e3cdd#diff-ab5ee5655b2aac3260e1f836546a13c9))

###### Info summary tooltips

![Profiler tooltips in Flamegraph chart](https://user-images.githubusercontent.com/28848972/74614074-09468100-5115-11ea-8c87-c224d229ef15.gif)

![Profiler tooltips in Ranked chart](https://user-images.githubusercontent.com/28848972/74614072-08155400-5115-11ea-8d19-7ab3d27b9b0a.gif)

###### Components panel resize

![Horizontal Components panel resizing](https://user-images.githubusercontent.com/23095052/74603147-ca7edf80-50b0-11ea-887f-db7ada855c50.gif)

![Vertical Components panel resizing](https://user-images.githubusercontent.com/23095052/74603149-d074c080-50b0-11ea-820f-63db30b4c285.gif)

## 4.4.0 (January 3, 2020)
#### Features
* Re-enabled "copy" prop/state/hooks context menu option for Firefox ([bvaughn](https://github.com/bvaughn),[rpl](https://github.com/rpl) in [#17740](https://github.com/facebook/react/pull/17740))
* Shift+Enter focuses previous search result in Components tree ([Bo-Duke](https://github.com/Bo-Duke) in [#17005](https://github.com/facebook/react/pull/17005))
* Properly display formatted `RegExp` values in props/state panel([bvaughn](https://github.com/bvaughn) in [#17690](https://github.com/facebook/react/pull/17690))
* Profiler commit selector wraps around for easier navigation of large profiles ([bvaughn](https://github.com/bvaughn) in [#17760](https://github.com/facebook/react/pull/17760))
#### Bugfix
* Check `document.contentType` before injecting hook to avoid breaking XML file syntax highlighting in Firefox ([bvaughn](https://github.com/bvaughn) in [#17739](https://github.com/facebook/react/pull/17739))
* Fix standalone UI not responding to mouse interactions due to `webkit-app-region` style ([cwatson88](https://github.com/cwatson88) in [#17584](https://github.com/facebook/react/pull/17584))
* Support inspecting object values with null protos ([bvaughn](https://github.com/bvaughn) in [#17757](https://github.com/facebook/react/pull/17757))
* Support inspecting values that have overridden `hasOwnProperty` attribute ([bvaughn](https://github.com/bvaughn) in [#17768](https://github.com/facebook/react/pull/17768))
* Fixed regression that made Profiler "Could not find node…" error happen more frequently ([bvaughn](https://github.com/bvaughn) in [#17759](https://github.com/facebook/react/pull/17759))

## 4.3.0 (December 20, 2019)
#### Features
* Show component location for selected element in bottom/right panel ([bvaughn](https://github.com/bvaughn) in [#17567](https://github.com/facebook/react/pull/17567))
* Improved inspected element values with inline previews ([bvaughn](https://github.com/bvaughn) in [#17579](https://github.com/facebook/react/pull/17579))
* Improved selection and toggling for inspected element panel ([bvaughn](https://github.com/bvaughn) in [#17588](https://github.com/facebook/react/pull/17588))
* Copy context menu for inspecting and copying props/state/hooks/context values ([bvaughn](https://github.com/bvaughn) in [#17608](https://github.com/facebook/react/pull/17608))
#### Bug fixes
* Fix serialization for `BigInt` type so that it does not break inspection panel. ([nutboltu](https://github.com/nutboltu) in [#17233](https://github.com/facebook/react/pull/17233))
* Fix display name logic for `forwardRef`s that use `displayName` property ([zthxxx](https://github.com/zthxxx) in [#17613](https://github.com/facebook/react/pull/17613))

## 4.2.1 (November 27, 2019)
#### Bug fixes
* Profiler automatically filters certain types of empty (no work) commits. ([bvaughn](https://github.com/bvaughn) in [#17253](https://github.com/facebook/react/pull/17253))
* Fix memoized components showing as "Anonymous" in Components tab. ([wsmd](https://github.com/wsmd) in [#17274](https://github.com/facebook/react/pull/17274))
* Edge-case bugfix for non-string element keys. ([bvaughn](https://github.com/bvaughn) in [#17164](https://github.com/facebook/react/pull/17164))

## 4.2.0 (October 3, 2019)
#### Features
* "Highlight updates" feature added for browser extensions and `react-devtools-inline` NPM package. ([bvaughn](https://github.com/bvaughn) in [#16989](https://github.com/facebook/react/pull/16989))

## 4.1.3 (September 30, 2019)
#### Bug fixes
* Fixed regression where DevTools wouldn't properly connect with apps when using the `file://` protocol. ([linshunghuang](https://github.com/linshunghuang) in [#16953](https://github.com/facebook/react/pull/16953))

## 4.1.2 (September 27, 2019)
#### Bug fixes
* Fixed an infinite loop that occurred in some cases with prop values of `NaN`. ([bvaughn](https://github.com/bvaughn) in [#16934](https://github.com/facebook/react/pull/16934))

## 4.1.1 (September 26, 2019)
#### Bug fixes
* Fixed bug where Components panel was always empty for certain users. ([linshunghuang](https://github.com/linshunghuang) in [#16900](https://github.com/facebook/react/pull/16900))
* Fixed regression in DevTools editable hooks interface that caused primitive values to be shown as `undefined`. ([bvaughn](https://github.com/bvaughn) in [#16867](https://github.com/facebook/react/pull/16867))
* Fixed bug where DevTools showed stale values in props/state/hooks editing interface. ([bvaughn](https://github.com/bvaughn) in [#16878](https://github.com/facebook/react/pull/16878))
* Show unsupported version dialog with downgrade instructions. ([bvaughn](https://github.com/bvaughn) in [#16897](https://github.com/facebook/react/pull/16897))

## 4.1.0 (September 19, 2019)
#### Features
* Props/state editor supports adding new values and changing value types. ([hristo-kanchev](https://github.com/hristo-kanchev) in [#16700](https://github.com/facebook/react/pull/16700))
#### Bug fixes
* Profiler correctly saves/exports profiling data in Firefox now. ([hristo-kanchev](https://github.com/hristo-kanchev) in [#16612](https://github.com/facebook/react/pull/16612))
* Class components now show "legacy context" header (rather than "context") for legacy API. ([hristo-kanchev](https://github.com/hristo-kanchev) in [#16617](https://github.com/facebook/react/pull/16617))
* Show component source button ("<>") now highlights the `render` method for class components. ([theKashey](https://github.com/theKashey) in [#16759](https://github.com/facebook/react/pull/16759))
* Bugfix for components with non-standard object values for `function.name`. ([LetItRock](https://github.com/LetItRock) in [#16798](https://github.com/facebook/react/pull/16798))

## 4.0.6 (August 26, 2019)
#### Bug fixes
* Remove ⚛️ emoji prefix from Firefox extension tab labels
* Standalone polyfills `Symbol` usage

## 4.0.5 (August 19, 2019)
#### Bug fixes
* Props, state, and context values are alpha sorted.
* Standalone DevTools properly serves backend script over localhost:8097

## 4.0.4 (August 18, 2019)
#### Bug fixes
* Bugfix for potential error if a min-duration commit filter is applied after selecting a fiber in the Profiler UI.

## 4.0.3 (August 17, 2019)
#### Bug fixes
* ES6 `Map` and `Set`, typed arrays, and other unserializable types (e.g. Immutable JS) can now be inspected.
* Empty objects and arrays now display an "(empty)" label to the right to reduce confusion.
* Components that use only the `useContext` hook now properly display hooks values in side panel.
* Style editor now supports single quotes around string values (e.g. both `"red"` and `'red'`).
* Fixed edge case bug that prevented profiling when both React v16 and v15 were present on a page.

## 4.0.2 (August 15, 2019)
#### Permissions cleanup
* Removed unnecessary `webNavigation ` permission from Chrome and Firefox extensions.

## 4.0.1 (August 15, 2019)
#### Permissions cleanup
* Removed unnecessary `<all_urls>`, `background`, and `tabs` permissions from Chrome and Firefox extensions.

## 4.0.0 (August 15, 2019)

### General changes

#### Improved performance
The legacy DevTools extension used to add significant performance overhead, making it unusable for some larger React applications. That overhead has been effectively eliminated in version 4.

[Learn more](https://github.com/facebook/react/blob/master/packages/react-devtools/OVERVIEW.md) about the performance optimizations that made this possible.

#### Component stacks

React component authors have often requested a way to log warnings that include the React ["component stack"](https://reactjs.org/docs/error-boundaries.html#component-stack-traces). DevTools now provides an option to automatically append this information to warnings (`console.warn`) and errors (`console.error`).

![Example console warning with component stack added](https://user-images.githubusercontent.com/29597/62228120-eec3da80-b371-11e9-81bb-018c1e577389.png)

It can be disabled in the general settings panel:

![Settings panel showing "component stacks" option](https://user-images.githubusercontent.com/29597/62227882-8f65ca80-b371-11e9-8a4e-5d27011ad1aa.png)

### Components tree changes

#### Component filters

Large component trees can sometimes be hard to navigate. DevTools now provides a way to filter components so that you can hide ones you're not interested in seeing.

![Component filter demo video](https://user-images.githubusercontent.com/29597/62229209-0bf9a880-b374-11e9-8f84-cebd6c1a016b.gif)

Host nodes (e.g. HTML `<div>`, React Native `View`) are now hidden by default, but you can see them by disabling that filter.

Filter preferences are remembered between sessions.

#### No more inline props

Components in the tree no longer show inline props. This was done to [make DevTools faster](https://github.com/facebook/react/blob/master/packages/react-devtools/OVERVIEW.md) and to make it easier to browse larger component trees.

You can view a component's props, state, and hooks by selecting it:

![Inspecting props](https://user-images.githubusercontent.com/29597/62303001-37da6400-b430-11e9-87fd-10a94df88efa.png)

#### "Rendered by" list

In React, an element's "owner" refers to the thing that rendered it. Sometimes an element's parent is also its owner, but usually they're different. This distinction is important because props come from owners.

![Example code](https://user-images.githubusercontent.com/29597/62229551-bbcf1600-b374-11e9-8411-8ff411f4f847.png)

When you are debugging an unexpected prop value, you can save time if you skip over the parents.

DevTools v4 adds a new "rendered by" list in the right hand pane that allows you to quickly step through the list of owners to speed up your debugging.

![Example video showing the "rendered by" list](https://user-images.githubusercontent.com/29597/62229747-4152c600-b375-11e9-9930-3f6b3b92be7a.gif)

#### Owners tree

The inverse of the "rendered by" list is called the "owners tree". It is the list of things rendered by a particular component- (the things it "owns"). This view is kind of like looking at the source of the component's render method, and can be a helpful way to explore large, unfamiliar React applications.

Double click a component to view the owners tree and click the "x" button to return to the full component tree:

![Demo showing "owners tree" feature](https://user-images.githubusercontent.com/29597/62229452-84f90000-b374-11e9-818a-61eec6be0bb4.gif)

#### No more horizontal scrolling

Deeply nested components used to require both vertical and horizontal scrolling to see, making it easy to "get lost" within large component trees. DevTools now dynamically adjusts nesting indentation to eliminate horizontal scrolling.

![Video demonstration dynamic indentation to eliminate horizontal scrolling](https://user-images.githubusercontent.com/29597/62246661-f8ad0400-b398-11e9-885f-284f150a6d76.gif)

#### Improved hooks support

Hooks now have the same level of support as props and state: values can be edited, arrays and objects can be drilled into, etc.

![Video demonstrating hooks support](https://user-images.githubusercontent.com/29597/62230532-d86c4d80-b376-11e9-8629-1b2129b210d6.gif)

#### Improved search UX

Legacy DevTools search filtered the components tree to show matching nodes as roots. This made the overall structure of the application harder to reason about, because it displayed ancestors as siblings.

Search results are now shown inline similar to the browser's find-in-page search.

![Video demonstrating the search UX](https://user-images.githubusercontent.com/29597/62230923-c63edf00-b377-11e9-9f95-aa62ddc8f62c.gif)

#### Higher order components

[Higher order components](https://reactjs.org/docs/higher-order-components.html) (or HOCs) often provide a [custom `displayName`](https://reactjs.org/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging) following a convention of `withHOC(InnerComponentName)` in order to make it easier to identify components in React warnings and in DevTools.

The new Components tree formats these HOC names (along with several built-in utilities like `React.memo` and `React.forwardRef`) as a special badge to the right of the decorated component name.

![Screenshot showing HOC badges](https://user-images.githubusercontent.com/29597/62302774-c4385700-b42f-11e9-9ef4-49c5f18d6276.png)

Components decorated with multiple HOCs show the topmost badge and a count. Selecting the component shows all of the HOCs badges in the properties panel.

![Screenshot showing a component with multiple HOC badges](https://user-images.githubusercontent.com/29597/62303729-7fadbb00-b431-11e9-8685-45f5ab52b30b.png)

#### Restoring selection between reloads

DevTools now attempts to restore the previously selected element when you reload the page.

![Video demonstrating selection persistence](https://user-images.githubusercontent.com/810438/63130054-2c02ac00-bfb1-11e9-92fa-382e9e433638.gif)

#### Suspense toggle

React's experimental [Suspense API](https://reactjs.org/docs/react-api.html#suspense) lets components "wait" for something before rendering. `<Suspense>` components can be used to specify loading states when components deeper in the tree are waiting to render.

DevTools lets you test these loading states with a new toggle:

![Video demonstrating suspense toggle UI](https://user-images.githubusercontent.com/29597/62231446-e15e1e80-b378-11e9-92d4-086751dc65fc.gif)

### Profiler changes

#### Reload and profile

The profiler is a powerful tool for performance tuning React components. Legacy DevTools supported profiling, but only after it detected a profiling-capable version of React. Because of this there was no way to profile the initial _mount_ (one of the most performance sensitive parts) of an application.

This feature is now supported with a "reload and profile" action:

![Video demonstrating the reload-and-profile feature](https://user-images.githubusercontent.com/29597/62233455-7a8f3400-b37d-11e9-9563-ec334bfb2572.gif)

#### Import/export

Profiler data can now be exported and shared with other developers to enable easier collaboration.

![Video demonstrating exporting and importing profiler data](https://user-images.githubusercontent.com/29597/62233911-6566d500-b37e-11e9-9052-692378c92538.gif)

Exports include all commits, timings, interactions, etc.

#### "Why did this render?"

"Why did this render?" is a common question when profiling. The profiler now helps answer this question by recording which props and state change between renders.

![Video demonstrating profiler "why did this render?" feature](https://user-images.githubusercontent.com/29597/62234698-0f932c80-b380-11e9-8cf3-a5183af0c388.gif)

Because this feature adds a small amount of overhead, it can be disabled in the profiler settings panel.

#### Component renders list

The profiler now displays a list of each time the selected component rendered during a profiling session, along with the duration of each render. This list can be used to quickly jump between commits when analyzing the performance of a specific component.

![Video demonstrating profiler's component renders list](https://user-images.githubusercontent.com/29597/62234547-bcb97500-b37f-11e9-9615-54fba8b574b9.gif)

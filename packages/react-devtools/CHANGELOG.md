# React DevTools changelog

<!-- RELEASE_SCRIPT_TOKEN -->

---

### 4.27.4
March 24, 2023

#### Bugfixes
* missing file name in react-devtools package.json for electron ([mondaychen](https://github.com/mondaychen) in [#26469](https://github.com/facebook/react/pull/26469))

---

### 4.27.3
March 22, 2023

#### Bugfixes
* prevent StyleX plugin from throwing when inspecting CSS ([mondaychen](https://github.com/mondaychen) in [#26364](https://github.com/facebook/react/pull/26364))
* remove script tag immediately ([mondaychen](https://github.com/mondaychen) in [#26233](https://github.com/facebook/react/pull/26233))

#### Others
* upgrade electron to latest version & security improvements ([mondaychen](https://github.com/mondaychen) in [#26337](https://github.com/facebook/react/pull/26337))
* improve troubleshooting in README ([mondaychen](https://github.com/mondaychen) in [#26235](https://github.com/facebook/react/pull/26235))
* Remove renderer.js from extension build ([mondaychen](https://github.com/mondaychen) in [#26234](https://github.com/facebook/react/pull/26234))
* permanently polyfill for rAF in devtools_page ([mondaychen](https://github.com/mondaychen) in [#26193](https://github.com/facebook/react/pull/26193))

---

### 4.27.2
February 16, 2023

* Replace DevTools `semver` usages with `compare-versions` for smaller bundle size ([markerikson](https://github.com/markerikson) in [#26122](https://github.com/facebook/react/pull/26122))
* Support highlights for React Native apps in dev tools ([ryancat](https://github.com/ryancat) in [#26060](https://github.com/facebook/react/pull/26060))
* improve error handling in extension ([mondaychen](https://github.com/mondaychen) in [#26068](https://github.com/facebook/react/pull/26068))

---

### 4.27.1
December 6, 2022

* [bug fix] revert values in ReactFiberFlags to keep consistency for devtools ([mondaychen](https://github.com/mondaychen) in [#25832](https://github.com/facebook/react/pull/25832))

---

### 4.27.0
November 28, 2022

#### Features
* add support for new host type fibers for server components use cases ([mondaychen](https://github.com/mondaychen) in [#25616](https://github.com/facebook/react/pull/25616))
* [react devtools] Device storage support ([rbalicki2](https://github.com/rbalicki2) in [#25452](https://github.com/facebook/react/pull/25452))
* upgrade to Manifest V3 ([mondaychen](https://github.com/mondaychen) in [#25145](https://github.com/facebook/react/pull/25145))

#### Bugfixes
* bug fix for Hydrating fibers ([mondaychen](https://github.com/mondaychen) in [#25663](https://github.com/facebook/react/pull/25663))



---

### 4.26.1
October 13, 2022

* [standalone] Stop highlighting events when a component is selected ([tyao1](https://github.com/tyao1) in [#25448](https://github.com/facebook/react/pull/25448))

---

### 4.26.0
September 16, 2022

* Show DevTools icons in Edge browser panel ([itskolli](https://github.com/itskolli) in [#25257](https://github.com/facebook/react/pull/25257))
* [Bugfix] Don't hide fragment if it has a key ([lunaruan](https://github.com/lunaruan) in [#25197](https://github.com/facebook/react/pull/25197))
* Handle info, group, and groupCollapsed in Strict Mode logging ([timneutkens](https://github.com/timneutkens) in [#25172](https://github.com/facebook/react/pull/25172))
* Highlight RN elements on hover ([tyao1](https://github.com/tyao1) in [#25106](https://github.com/facebook/react/pull/25106))
* Remove ForwardRef/Memo from display name if `displayName` is set ([eps1lon](https://github.com/eps1lon) in [#21952](https://github.com/facebook/react/pull/21952))

---

### 4.25.0
July 13, 2022

* Timeline Profiler Sidebar with component tree ([lunaruan](https://github.com/lunaruan) and [blakef](https://github.com/blakef) in [#24816](https://github.com/facebook/react/pull/24816), [#24815](https://github.com/facebook/react/pull/24815), [#24814](https://github.com/facebook/react/pull/24814), [#24805](https://github.com/facebook/react/pull/24805), [#24776](https://github.com/facebook/react/pull/24776))
* [DevTools][Bugfix] Fix DevTools Perf Issue When Unmounting Large React Subtrees ([lunaruan](https://github.com/lunaruan) in [#24863](https://github.com/facebook/react/pull/24863))
* Enable "reload & profile" button for timeline view ([mondaychen](https://github.com/mondaychen) in [#24702](https://github.com/facebook/react/pull/24702))
* Find best renderer when inspecting app with mutilple react roots ([mondaychen](https://github.com/mondaychen) in [#24665](https://github.com/facebook/react/pull/24665))
* Only polyfill requestAnimationFrame when necessary ([mondaychen](https://github.com/mondaychen) in [#24651](https://github.com/facebook/react/pull/24651))

---

### 4.24.7
May 31, 2022

* mock requestAnimationFrame with setTimeout as a temporary fix for #24626 ([mondaychen](https://github.com/mondaychen) in [#24633](https://github.com/facebook/react/pull/24633))
* Fix formatWithStyles not styling the results if the first argument is an object + Added unit tests ([lunaruan](https://github.com/lunaruan) in [#24554](https://github.com/facebook/react/pull/24554))

---

### 4.24.6
May 12, 2022

* fix a bug in console.log with non-string args ([mondaychen](https://github.com/mondaychen) in [#24546](https://github.com/facebook/react/pull/24546))
* Add Pragma to Only Run Tests if Version Requirement Satisfied ([lunaruan](https://github.com/lunaruan) in [#24533](https://github.com/facebook/react/pull/24533))
* [DevTools][Bug] Fix Race Condition When Unmounting Fibers ([lunaruan](https://github.com/lunaruan) in [#24510](https://github.com/facebook/react/pull/24510))
* [React DevTools] Improve DevTools UI when Inspecting a user Component that Throws an Error  ([mondaychen](https://github.com/mondaychen) in [#24248](https://github.com/facebook/react/pull/24248))

---

### 4.24.5
May 5, 2022

* Fixed potential undefined error in `TreeContext` reducer ([bvaughn](https://github.com/bvaughn) in [#24501](https://github.com/facebook/react/pull/24501))
* Fix error where Profiler sometimes incorrectlyed reported that a `forwardRef` did not render ([lunaruan](https://github.com/lunaruan) in [#24494](https://github.com/facebook/react/pull/24494))
* Fix regex for `formateWithStyles` function ([lunaruan](https://github.com/lunaruan) in [#24486](https://github.com/facebook/react/pull/24486))
* Fixed wrong method call for LRU cache ([bvaughn](https://github.com/bvaughn) in [#24477](https://github.com/facebook/react/pull/24477))
* Synchronize implementations of second render logging ([billyjanitsch](https://github.com/billyjanitsch) in [#24381](https://github.com/facebook/react/pull/24381))
* Don't stringify objects for console log second render ([lunaruan](https://github.com/lunaruan) in [#24373](https://github.com/facebook/react/pull/24373))

---

### 4.24.4
April 8, 2022

* Allow react-devtools-inline `createStore()` method to override Store config params ([bvaughn](https://github.com/bvaughn) in [#24303](https://github.com/facebook/react/pull/24303))
* [ReactDebugTools] wrap uncaught error from rendering user's component ([mondaychen](https://github.com/mondaychen) in [#24216](https://github.com/facebook/react/pull/24216))

---

### 4.24.3
March 29, 2022

#### Bugfix
* Profiler should only report stateful hooks that change between renders ([bvaughn](https://github.com/bvaughn) in [#24189](https://github.com/facebook/react/pull/24189))
* Ignore duplicate welcome "message" events ([bvaughn](https://github.com/bvaughn) in [#24186](https://github.com/facebook/react/pull/24186))
* Attach DevTools Tree keyboard events to the Tree container (not the document) ([bvaughn](https://github.com/bvaughn) in [#24164](https://github.com/facebook/react/pull/24164))

---

### 4.24.2
March 24, 2022

#### Bugfix
* Show upgrade/downgrade instructions inline for errors thrown by the Store due to incompatible protocol (mismatched backend and frontend versions) ([bvaughn](https://github.com/bvaughn) in [#24147](https://github.com/facebook/react/pull/24147))
* Inspecting an element in a nested renderer no longer throws ([lunaruan](https://github.com/lunaruan) in [#24116](https://github.com/facebook/react/pull/24116))

---

### 4.24.1
March 15, 2022

#### Bugfix
* Disable unsupported Bridge protocol version dialog and add workaround for old protocol operations format ([bvaughn](https://github.com/bvaughn) in [#24093](https://github.com/facebook/react/pull/24093))

---

### 4.24.0
March 10, 2022

#### Feature
* Show DevTools backend and frontend versions in UI ([bvaughn](https://github.com/bvaughn) in [#23399](https://github.com/facebook/react/pull/23399))
* Timeline profiler refactored to support reading basic profiling data directly from React ([bvaughn](https://github.com/bvaughn) in [#22529](https://github.com/facebook/react/issues/22529))

#### Bugfix
* Better handle undefined `Error` stacks in DevTools error boundary ([bvaughn](https://github.com/bvaughn) in [#24065](https://github.com/facebook/react/pull/24065))
* Fixed edge case bug in Profiler commit filtering ([bvaughn](https://github.com/bvaughn) in [#24031](https://github.com/facebook/react/pull/24031))
* Gracefully handle empty "xstyle" prop values ([lunaruan](https://github.com/lunaruan) in [#23279](https://github.com/facebook/react/pull/23279) and [bvaughn](https://github.com/bvaughn) in [#23190](https://github.com/facebook/react/pull/23190))
* Add `<TracingMarker>` component boilerplate ([lunaruan](https://github.com/lunaruan) in [#23275](https://github.com/facebook/react/pull/23275))

#### Misc
* Remove object-assign polyfill ([sebmarkbage](https://github.com/sebmarkbage) in [#23351](https://github.com/facebook/react/pull/23351))

#### Breaking change
* Move createRoot/hydrateRoot to react-dom/client ([sebmarkbage](https://github.com/sebmarkbage) in [#23385](https://github.com/facebook/react/pull/23385)).

Technically this is a breaking change for projects using `react-devtools-inline`, but since this package already depends on the _experimental_ release channel, we are going to include it in 4.24.

---

### 4.23.0
January 24, 2022

#### Feature
* DevTools: Only show StrictMode badge on root elements ([bvaughn](https://github.com/bvaughn) in [#23012](https://github.com/facebook/react/pull/23012))

#### Bugfix
* Don't crawl unmounted subtrees when profiling starts ([bvaughn](https://github.com/bvaughn) in [#23162](https://github.com/facebook/react/pull/23162))
* Filter deleted components from the updaters list to avoid runtime errors later ([lunaruan](https://github.com/lunaruan) in [#23156](https://github.com/facebook/react/pull/23156))

#### Misc
* DevTools (not React) logs Timeline performance data to the User Timing API ([bvaughn](https://github.com/bvaughn) in [#23102](https://github.com/facebook/react/pull/23102))

---

### 4.22.1
December 14, 2021

* Fix invalid `require()` statements in `react-devtools-inline` ([bvaughn](https://github.com/bvaughn) in [#22961](https://github.com/facebook/react/pull/22961))
* Fix invalid `files` array in `react-devtools` `package.json` ([bvaughn](https://github.com/bvaughn) in [#22960](https://github.com/facebook/react/pull/22960))

---

### 4.22.0
December 13, 2021

#### A note for React Native users
React DevTools has [two main pieces](https://github.com/facebook/react/blob/main/packages/react-devtools/OVERVIEW.md#overview):
* The *frontend* users interact with (the Components tree, the Profiler, etc.).
* The *backend* which runs in the same context as React itself. (In the web page with React DOM or shipped on the device with the React Native runtime.)

This release updates the [**protocol** that DevTools uses](https://github.com/facebook/react/blob/main/packages/react-devtools/OVERVIEW.md#serializing-the-tree) to communicate between the "frontend" and "backend" components.

Because React Native embeds a copy of the React DevTools "backend" ([`react-devtools-core/backend`](https://www.npmjs.com/package/react-devtools-core)), the "frontend" (UI) needs to match. This means you may be prompted to upgrade (or downgrade) your React DevTools based on which version of React Native your app uses.

#### Features
* Support multiple DevTools instances per page ([@bvaughn](https://github.com/bvaughn) in [#22949](https://github.com/facebook/react/pull/22949))
* Advocate for StrictMode usage within Components tree ([@bvaughn](https://github.com/bvaughn) in [#22886](https://github.com/facebook/react/pull/22886))
* StyleX plug-in for resolving atomic styles to values for props.xstyle ([@bvaughn](https://github.com/bvaughn) in [#22808](https://github.com/facebook/react/pull/22808))
* Timeline search ([@bvaughn](https://github.com/bvaughn) in [#22799](https://github.com/facebook/react/pull/22799))
* Timeline: Improved snapshot view ([@bvaughn](https://github.com/bvaughn) in [#22706](https://github.com/facebook/react/pull/22706))
* Display root type for root updates in "what caused this update?" ([@eps1lon](https://github.com/eps1lon) in [#22599](https://github.com/facebook/react/pull/22599))

#### Bugfix
* DevTools should inject itself for XHTML pages too (not just HTML) ([@bvaughn](https://github.com/bvaughn) in [#22932](https://github.com/facebook/react/pull/22932))
* Don't restore profiling data if we're profling ([@eps1lon](https://github.com/eps1lon) in [#22753](https://github.com/facebook/react/pull/22753))
* DevTools should properly report re-renders due to (use)context changes ([@bvaughn](https://github.com/bvaughn) in [#22746](https://github.com/facebook/react/pull/22746))
* Filter empty commits (all Fibers bailed out) from Profiler ([@bvaughn](https://github.com/bvaughn) in [#22745](https://github.com/facebook/react/pull/22745))
* Accept json file in import fileinput ([@jyash97](https://github.com/jyash97) in [#22717](https://github.com/facebook/react/pull/22717))
* Expose css vars to reach-ui portal components ([@jyash97](https://github.com/jyash97) in [#22716](https://github.com/facebook/react/pull/22716))
* Fix DevTools advanced tooltip display conditional check ([@bvaughn](https://github.com/bvaughn) in [#22669](https://github.com/facebook/react/pull/22669))

#### Misc
* Emit new event when DevTools connects in standalone app ([@jstejada](https://github.com/jstejada) in [#22848](https://github.com/facebook/react/pull/22848))

---

### 4.21.0
October 31, 2021

#### Features
* Scheduling Profiler: Add marks for component effects (mount and unmount) ([@bvaughn](https://github.com/bvaughn) in [#22578](https://github.com/facebook/react/pull/22578))
* Scheduling Profiler: De-emphasize React internal frames ([bvaughn](https://github.com/bvaughn) in [#22588](https://github.com/facebook/react/pull/22588))


#### Bugfix
* Revert logic for checking for duplicate installations of DevTools potentially causing issues loading Components tab ([@jstejada](https://github.com/jstejada) in [#22638](https://github.com/facebook/react/pull/22638))
* Scheduling Profiler does not warn about long transitions ([@bvaughn](https://github.com/bvaughn) in [#22614](https://github.com/facebook/react/pull/22614))
* Re-enable 'Reload and Start Profiling' for Microsoft Edge ([@eoandersson](https://github.com/eoandersson) in [#22631](https://github.com/facebook/react/pull/22631))


#### Misc
* DevTools supports ENV-injected version for better internal bug reports ([@bvaughn](https://github.com/bvaughn) in [#22635](https://github.com/facebook/react/pull/22635))
* Fix typos ([@KonstHardy](https://github.com/KonstHardy) in [#22494](https://github.com/facebook/react/pull/22494))

---

### 4.20.2
October 20, 2021

#### Bugfix
* Dev Tools: Relax constraint on passing extensionId for backend init ([@jstejada](https://github.com/jstejada) in [#22597](https://github.com/facebook/react/pull/22597))
* DevTools: Fix passing extensionId in evaled postMessage calls ([@jstejada](https://github.com/jstejada) in [#22590](https://github.com/facebook/react/pull/22590))

---

### 4.20.1
October 19, 2021

#### Bugfix
* Only show DevTools warning about unrecognized build in Chrome ([@jstejada](https://github.com/jstejada) in [#22571](https://github.com/facebook/react/pull/22571))
* DevTools: Include Edge in browser name detection ([@jstejada](https://github.com/jstejada) in [#22584](https://github.com/facebook/react/pull/22584))

---

### 4.20.0
October 15, 2021

#### Features
* Allow to use the Profiler when no client is connected in standalone DevTools ([@gabrieltrompiz](https://github.com/gabrieltrompiz) in [#22551](https://github.com/facebook/react/pull/22551))

#### Bugfix
* Surface backend errors during inspection in the frontend UI ([@bvaughn](https://github.com/bvaughn) in [#22546](https://github.com/facebook/react/pull/22546))
* Prevent splash page in standalone app from becoming unresponsive after the disconnection of a client  (#22558) ([@gabrieltrompiz](https://github.com/gabrieltrompiz) in [#22560](https://github.com/facebook/react/pull/22560))
* Prevent errors/crashing when multiple installs of DevTools are present ([@jstejada](https://github.com/jstejada) in [#22517](https://github.com/facebook/react/pull/22517))
* Update Fiber logic in backend renderer to match implementation in React ([@jstejada](https://github.com/jstejada) in [#22527](https://github.com/facebook/react/pull/22527))

#### Misc
* Show warning in UI when duplicate installations of DevTools extension are detected ([@jstejada](https://github.com/jstejada) in [#22563](https://github.com/facebook/react/pull/22563))
* Improved filenames of built worker files ([@akgupta0777](https://github.com/akgupta0777) in [#22559](https://github.com/facebook/react/pull/22559))

---

### 4.19.2
October 8, 2021

#### Bugfix
* Show different error boundary UI for timeouts than normal errors ([bvaughn](https://github.com/bvaughn) in [#22483](https://github.com/facebook/react/pull/22483))
* Fixed bug where deleting a component filter would also close the settings modal ([Biki-das](https://github.com/Biki-das) in [#22484](https://github.com/facebook/react/pull/22484))

---

### 4.19.1
October 1, 2021

#### Bugfix
* Fixed potential cache miss when inspecting elements ([bvaughn](https://github.com/bvaughn) in [#22472](https://github.com/facebook/react/pull/22472))

---

### 4.19.0
September 29, 2021

#### Features
* Scheduling Profiler: Show Suspense resource .displayName ([bvaughn](https://github.com/bvaughn) in [#22451](https://github.com/facebook/react/pull/22451))
* Scheduling Profiler marks should include thrown Errors ([bvaughn](https://github.com/bvaughn) in [#22419](https://github.com/facebook/react/pull/22419))
* Don't patch console during first render in strict mode ([lunaruan](https://github.com/lunaruan) in [#22308](https://github.com/facebook/react/pull/22308))
* Show which hook indices changed when profiling for all builds ([bvaughn](https://github.com/bvaughn) in [#22365](https://github.com/facebook/react/pull/22365))
* Display actual ReactDOM API name in root type ([eps1lon](https://github.com/eps1lon) in [#22363](https://github.com/facebook/react/pull/22363))
* Add named hooks support to standalone and inline DevTools ([jstejada](https://github.com/jstejada) in [#22320](https://github.com/facebook/react/pull/22320) and [bvaughn](https://github.com/bvaughn) in [#22263](https://github.com/facebook/react/pull/22263))
#### Bugfix
* DevTools encoding supports multibyte characters (e.g. "🟩") ([bvaughn](https://github.com/bvaughn) in [#22424](https://github.com/facebook/react/pull/22424))
* Improve DEV errors if string coercion throws (Temporal.*, Symbol, etc.) ([justingrant](https://github.com/justingrant) in [#22064](https://github.com/facebook/react/pull/22064))
* Fix memory leak caused by not storing alternate Fiber pointer ([bvaughn](https://github.com/bvaughn) in [#22346](https://github.com/facebook/react/pull/22346))
* Fix call stack exceeded error in `utfDecodeString()` ([bvaughn](https://github.com/bvaughn) in [#22330](https://github.com/facebook/react/pull/22330))
* Fix runtime error when inspecting an element times out ([jstejada](https://github.com/jstejada) in [#22329](https://github.com/facebook/react/pull/22329))

#### Performance
* DevTools: Lazily parse indexed map sections ([bvaughn](https://github.com/bvaughn) in [#22415](https://github.com/facebook/react/pull/22415))
* DevTools: Hook names optimizations ([bvaughn](https://github.com/bvaughn) in [#22403](https://github.com/facebook/react/pull/22403))
* Replaced `network.onRequestFinished()` caching with `network.getHAR()` ([bvaughn](https://github.com/bvaughn) in [#22285](https://github.com/facebook/react/pull/22285))

---

### 4.18.0
September 1, 2021

#### Features
* DevTools: Improve named hooks network caching ([bvaughn](https://github.com/bvaughn) in [#22198](https://github.com/facebook/react/pull/22198))
* Console Logging for StrictMode Double Rendering ([lunaruan](https://github.com/lunaruan) in [#22030](https://github.com/facebook/react/pull/22030))

---

### Bugfix
* Fix react-devtools-inline size issues ([lunaruan](https://github.com/lunaruan) in [#22232](https://github.com/facebook/react/pull/22232))
* devtools: Don't display hook index of useContext ([eps1lon](https://github.com/eps1lon) in [#22200](https://github.com/facebook/react/pull/22200))
* Throw error in console without interfering with logs ([lunaruan](https://github.com/lunaruan) in [#22175](https://github.com/facebook/react/pull/22175))


---

### 4.17.0
August 24, 2021

#### Features
* Scheduling Profiler: Add network measures ([bvaughn](https://github.com/bvaughn) in [#22112](https://github.com/facebook/react/pull/22112))
* Add options for disabling some features ([hbenl](https://github.com/hbenl) in [#22136](https://github.com/facebook/react/pull/22136))

#### Bugfix
* Fixed broken scroll-to error or warning feature ([bvaughn](https://github.com/bvaughn) and [eps1lon](https://github.com/eps1lon) in [#22147](https://github.com/facebook/react/pull/22147) and [#22144](https://github.com/facebook/react/pull/22144))
* Replaced WeakMap with LRU for inspected element cache ([bvaughn](https://github.com/bvaughn) in [#22160](https://github.com/facebook/react/pull/22160))
* Add more detailed error handling if profiling data does not have any React marks ([byronluk](https://github.com/byronluk) in [#22157](https://github.com/facebook/react/pull/22157))
* Various named hooks bug fixes ([jstejada](https://github.com/jstejada) in [#22129](https://github.com/facebook/react/pull/22129), [#22128](https://github.com/facebook/react/pull/22128), [#22096](https://github.com/facebook/react/pull/22096), and [#22148](https://github.com/facebook/react/pull/22148))
* Fix tooltip wheel event regression ([bvaughn](https://github.com/bvaughn) in [#22130](https://github.com/facebook/react/pull/22130))
* Replace `source-map` library with `source-map-js` for named hooks source map parsing ([bvaughn](https://github.com/bvaughn) in [#22126](https://github.com/facebook/react/pull/22126))

---

### 4.16.0
August 16, 2021
#### Features
* Scheduling Profiler: Inline snapshots ([bvaughn](https://github.com/bvaughn) in [#22091](https://github.com/facebook/react/pull/22091) and[bvaughn](https://github.com/bvaughn) in [#22088](https://github.com/facebook/react/pull/22088))
#### Bugfix
* split parsing code to unblock Firefox release ([lunaruan](https://github.com/lunaruan) in [#22102](https://github.com/facebook/react/pull/22102))
* Scheduling profiler: Canvas views clip by default ([bvaughn](https://github.com/bvaughn) in [#22100](https://github.com/facebook/react/pull/22100))
* Fixed Components tree indentation bug for Chrome extension ([bvaughn](https://github.com/bvaughn) in [#22083](https://github.com/facebook/react/pull/22083))

---

### 4.15.0
August 11, 2021

#### Features
* Added new scheduling profiler tool ([bvaughn](https://github.com/bvaughn), [kartikcho](https://github.com/kartikcho), and [taneliang](https://github.com/taneliang) in [#22006](https://github.com/facebook/react/pull/22006), [#21990](https://github.com/facebook/react/pull/21990), [#22013](https://github.com/facebook/react/pull/22013), [#21897](https://github.com/facebook/react/pull/21897), [#22029](https://github.com/facebook/react/pull/22029), [#22038](https://github.com/facebook/react/pull/22038), [#22043](https://github.com/facebook/react/pull/22043), [#21947](https://github.com/facebook/react/pull/21947), [#21966](https://github.com/facebook/react/pull/21966), [#21970](https://github.com/facebook/react/pull/21970), [#21971](https://github.com/facebook/react/pull/21971), [#21975](https://github.com/facebook/react/pull/21975)).
* Parsing source code for extracting names for hooks now happens in a worker ([tsirlucas](https://github.com/tsirlucas) in [#21902](https://github.com/facebook/react/pull/21902)).
* Format hyperlink text as a clickable link ([kkragoth](https://github.com/kkragoth) in [#21964](https://github.com/facebook/react/pull/21964)).
* Named hooks can now be extracted from extended source maps ([jstejada](https://github.com/jstejada) [#22010](https://github.com/facebook/react/pull/22010), [#22073](https://github.com/facebook/react/pull/22073)).
* Hook indices now show up as a reason why a component rendered in the profiler ([mrkev](https://github.com/mrkev) in [#22073](https://github.com/facebook/react/pull/22073)).
* Optimize images in DevTools ([ilhamsyahids](https://github.com/ilhamsyahids) in [#21968](https://github.com/facebook/react/pull/21968)).

#### Bugfix
* Named hooks cache is correctly cleared after Fast Refresh ([bvaughn](https://github.com/bvaughn) in [#21891](https://github.com/facebook/react/pull/21891)).
* Hook names are correctly extracted when parsing nested hook calls ([jstejada](https://github.com/jstejada) in [#22037](https://github.com/facebook/react/pull/22037), [#21996](https://github.com/facebook/react/pull/21996)).
* Highlight updates with memoized components ([Selnapenek](https://github.com/Selnapenek) in [#22008](https://github.com/facebook/react/pull/22008)).
* Set app icon on MacOS ([christian-schulze](https://github.com/christian-schulze) in [#21908](https://github.com/facebook/react/pull/21908)).
* Updated @reach packages to fix unmount bug ([bvaughn](https://github.com/bvaughn) in [#22075](https://github.com/facebook/react/pull/22075)).

#### Misc
* Refactor imperative theme code ([houssemchebeb](https://github.com/houssemchebeb) in [#21950](https://github.com/facebook/react/pull/21950)).
* Change some remaining instances of master -> main ([shubham9411](https://github.com/shubham9411) in [#21982](https://github.com/facebook/react/pull/21982)).

##### Scheduling profiler

###### What is React working on?

React’s previous Profiler primarily reports how fast (or slow) components are when rendering. It didn’t provide an overview of *what React is doing* (the actual cooperative scheduling bits). The new profiler does. It shows when components schedule state updates and when React works on them. It also shows how React categorizes and prioritizing what it works on.

Here’s a profile for a simple app that uses only the legacy (synchronous) `ReactDOM.render` API. The profiler shows that all of the work scheduled and rendered by this app is done at *synchronous* priority:

https://user-images.githubusercontent.com/29597/129042321-56985f5a-264e-4f3a-a8b7-9371d75c690f.mp4

Here’s a more interesting profile for an app that’s rendered at _default_ priority using the new [`createRoot` API](https://github.com/reactwg/react-18/discussions/5), then updates _synchronously_ in response to an “input” event to manage a ["controlled component"](https://reactjs.org/docs/forms.html#controlled-components):

https://user-images.githubusercontent.com/29597/129074959-50912a63-0215-4be5-b51b-1e0004fcd2a1.mp4

Here’s part of a profile showing an idle app (no JavaScript running). In this case, React does some pre-rendering work for components that are “offscreen” (not currently displayed).

https://user-images.githubusercontent.com/29597/128971757-612f232f-c64f-4447-a766-66a0516e8f49.mp4

Note that “offscreen” refers to a new API and set of features that we haven’t talked about much yet except for [some passing references](https://github.com/reactwg/react-18/discussions/18#discussioncomment-795661). We’ll talk more about it in future posts.

###### What are “transitions” and how do they work?
We recently shared an update about the new [`startTransition` API](https://github.com/reactwg/react-18/discussions/41). This API helps apps feel responsive even when there are large updates by splitting the work into (1) a quick update to show that the app has received some input and (2) a slower update (the “transition”) that actually does any heavy lifting needed as a result of the input.

Here is an example profile that uses the transition API. First React renders a small update that shows the user some visual feedback (like updating a controlled component or showing an inline loading indicator). Then it renders a larger update that, in this case, computes some expensive value.

https://user-images.githubusercontent.com/29597/129079176-0995c8c0-e95a-4f44-8d55-891a7efa35c0.mp4

###### How does Suspense impact rendering performance?

You may have heard mention of “suspense” in past talks or seen it referenced [in our docs](https://reactjs.org/docs/react-api.html#suspense). Although full support for data fetching via Suspense is [expected to be released sometime after React 18.0](https://github.com/reactwg/react-18/discussions/47#discussioncomment-847004), you can use Suspense today for things like lazy-loading React components. The new profiler shows when components suspend during render and how that impacts overall rendering performance.

Here’s an example profile that suspends during the initial render to lazy-load a component using [`React.lazy`](https://reactjs.org/docs/code-splitting.html#reactlazy). While this component is loading, React shows a “fallback“ (placeholder UI). Once the component finishes loading, React retries the render and commits the final UI.

https://user-images.githubusercontent.com/29597/129054366-2700e7e8-0172-4f61-9453-475acd740456.mp4

We plan to expand support for Suspense in the coming weeks to more explicitly show when suspense fallbacks are rendered and which subsequent renders are related to an initial update that suspended.

###### What else might cause a render to get delayed?

Suspense can cause a render to get delayed as React waits for data to load, but React can also get stuck waiting on a lot of JavaScript to run.

React profiling tools have previously focused on only reporting what React (or React components) are doing, but any JavaScript the browser runs affects performance. The new profiler shows non-React JavaScript as well, making it easy to see when it delays React from rendering.

https://user-images.githubusercontent.com/29597/128971952-7c4e7e11-f4fb-497e-b643-4d9b3994b590.mp4

###### What can you do to improve performance?

Until now, DevTools (and the Profiler) has provided information without commentary. The new profiler takes a more active approach– highlighting where we think performance can be improved and providing suggestions.

For example, suspending during an update is generally a bad user experience because it causes previously shown components to be unmounted (hidden) so the fallback can be shown while data loads. This can be avoided using the new [Transition API](https://github.com/reactwg/react-18/discussions/41). If you forget to add a transition to an update that suspends, the new profiler will warn you about this:

https://user-images.githubusercontent.com/29597/128972228-3b23f01a-8017-43ad-b371-975ffed26c06.mp4

The new profiler also warns about scheduling a long, synchronous React update inside of event handler.

https://user-images.githubusercontent.com/29597/128972000-d7477ba3-b779-46f2-b141-aaa712e9d6d2.mp4

Another thing the new profiler will warn about is long-running renders scheduled from layout effects (`useLayoutEffect` or `componentDidMount`/`componentDidUpdate`). These updates (called “nested updates”) are sometimes necessary to adjust layout before the browser paints, but they should be *fast*. Slow nested updates make the browser feel unresponsive.

https://user-images.githubusercontent.com/29597/128972017-3ed0e682-751c-46fb-a6c5-271f255c8087.mp4

---

### 4.14.0
July 17, 2021
#### Features
* Display hook names for inspected components ([saphal1998](https://github.com/saphal1998), [VibhorCodecianGupta](https://github.com/VibhorCodecianGupta), [bvaughn](https://github.com/bvaughn), and [motiz88](https://github.com/motiz88) in [#21641](https://github.com/facebook/react/pull/21641), [#21790](https://github.com/facebook/react/pull/21790), [#21814](https://github.com/facebook/react/pull/21814), [#21815](https://github.com/facebook/react/pull/21815), [#21831](https://github.com/facebook/react/pull/21831), [#21833](https://github.com/facebook/react/pull/21833), [#21835](https://github.com/facebook/react/pull/21835), [#21865](https://github.com/facebook/react/pull/21865), [#21871](https://github.com/facebook/react/pull/21871), [#21874](https://github.com/facebook/react/pull/21874), [#21891](https://github.com/facebook/react/pull/21891))
* Control for manually toggling error boundaries ([baopham](https://github.com/baopham) in [#21583](https://github.com/facebook/react/pull/21583))
* Allow user to manually enter Profiler commit number to jump between commits ([srubin](https://github.com/srubin) in [#19957](https://github.com/facebook/react/pull/19957))

##### Display hook names for inspected components
![DevTools parsing hook names](https://user-images.githubusercontent.com/29597/124013541-68c2cb00-d9b0-11eb-83ab-81a5180da46b.gif)

##### Control for manually toggling error boundaries
![DevTools error boundary toggle](https://user-images.githubusercontent.com/29597/125891522-30f0d99d-407f-4c31-b5a7-e9d0bd3fa554.gif)

---

### 4.13.5
May 25, 2021
#### Bugfix
* Handle edge case where a component mounts before its "owner" (in DEV mode) that previously caused a validation error ([bvaughn](https://github.com/bvaughn) in [#21562](https://github.com/facebook/react/pull/21562))

---

### 4.13.4
May 20, 2021
#### Bugfix
* Fix edge-case Fast Refresh bug that caused Fibers with warnings/errors to be untracked prematurely (which broke componentinspection in DevTools) ([bvaughn](https://github.com/bvaughn) in [#21536](https://github.com/facebook/react/pull/21536))
* Revert force deep re-mount when Fast Refresh detected (was no longer necessary) ([bvaughn](https://github.com/bvaughn) in [#21539](https://github.com/facebook/react/pull/21539))

---

### 4.13.3
May 19, 2021
#### Misc
* Updated `react` and `react-dom` API imports in preparation for upcoming stable release ([bvaughn](https://github.com/bvaughn) in [#21488](https://github.com/facebook/react/pull/21488))

#### Bugfix
* Reload all roots after Fast Refresh force-remount (to avoid corrupted Store state) ([bvaughn](https://github.com/bvaughn) in [#21516](https://github.com/facebook/react/pull/21516) and [#21523](https://github.com/facebook/react/pull/21523))
* Errors thrown by Store can be dismissed so DevTools remain usable in many cases ([bvaughn](https://github.com/bvaughn) in [#21520](https://github.com/facebook/react/pull/21520))
* Bugfix for `useState()` object with `hasOwnProperty` key ([bvaughn](https://github.com/bvaughn) in [#21524](https://github.com/facebook/react/pull/21524))
* Fixed string concatenation problem when a `Symbol` was logged to `console.error` or `console.warn` ([bvaughn](https://github.com/bvaughn) in [#21521](https://github.com/facebook/react/pull/21521))
* DevTools: Fixed version range NPM syntax
 ([bvaughn](https://github.com/bvaughn) in [9cf1069](https://github.com/facebook/react/commit/9cf1069ffc5f3835506e314ef8c2e80bbfa8bdca#diff))
* Tweaked DevTools error template title to match issue form template ([bvaughn](https://github.com/bvaughn) in [1a2d792](https://github.com/facebook/react/commit/1a2d7925035531e5767ff31ff8d0d581b5f94d49))

---

### 4.13.2
May 7, 2021
#### Misc
* Improved bug report template to use new [GitHub issue forms](https://gh-community.github.io/issue-template-feedback/structured/) ([bvaughn](https://github.com/bvaughn) in [#21450](https://github.com/facebook/react/pull/21450))

---

### 4.13.1
April 28, 2021
#### Bugfix
* Improve display name logic for `React.memo` components ([bvaughn](https://github.com/bvaughn) in [#21392](https://github.com/facebook/react/pull/21392))
* Fixed potential runtime error with Suspense in versions <= 17 ([bvaughn](https://github.com/bvaughn) in [#21432](https://github.com/facebook/react/pull/21432))
* Errors thrown in the Store are no longer silent ([bvaughn](https://github.com/bvaughn) in [#21426](https://github.com/facebook/react/pull/21426))

#### Misc
* Improved bug report template ([bvaughn](https://github.com/bvaughn) in [#21413](https://github.com/facebook/react/pull/21413)), [#21421](https://github.com/facebook/react/pull/21421))

---

### 4.13.0
April 28, 2021
#### Features
* Add Bridge protocol version backend/frontend ([bvaughn](https://github.com/bvaughn) in [#21331](https://github.com/facebook/react/pull/21331))

#### Bugfix
* DevTools iterates over siblings during mount (rather than recursing) to avoid stack overflow errors ([bvaughn](https://github.com/bvaughn) in [#21377](https://github.com/facebook/react/pull/21377))
* Multiple error dialogs can be visible at once ([bvaughn](https://github.com/bvaughn) in [#21370](https://github.com/facebook/react/pull/21370))
* Console patching should handle Symbols without erroring ([bvaughn](https://github.com/bvaughn) in [#21368](https://github.com/facebook/react/pull/21368))

###### Bridge protocol version backend/frontend
During initialization, DevTools now checks to ensure it's compatible with the ["backend"](https://github.com/facebook/react/blob/main/packages/react-devtools/OVERVIEW.md#overview) that's embedded within a renderer like React Native. If the two aren't compatible, upgrade instructions will be shown:

<img width="400" height="233" alt="Dialog displaying downgrade instructions for the React DevTools frontend to connect to an older backend version" src="https://user-images.githubusercontent.com/29597/115997927-f77f2a00-a5b2-11eb-9098-20042b664cea.png">
    
<img width="400" height="233" alt="Dialog displaying upgrade instructions for the React DevTools frontend to connect to a newer backend version" src="https://user-images.githubusercontent.com/29597/115997965-167dbc00-a5b3-11eb-9cbc-082c65077a6e.png">

Learn more about this change at [fb.me/devtools-unsupported-bridge-protocol](https://fb.me/devtools-unsupported-bridge-protocol)

---

### 4.12.4
April 19, 2021
#### Bugfix
* Remove `@octokit/rest` dependency because of a problem with transitive dependencies ([bvaughn](https://github.com/bvaughn) in [#21317](https://github.com/facebook/react/pull/21317))

---

### 4.12.3
April 19, 2021
#### Bugfix
* Wrapped quotation marks around Fiber ids or indices for all DevTools errors to better support GitHub fuzzy error search ([bvaughn](https://github.com/bvaughn) in [#21314](https://github.com/facebook/react/pull/21314))

---

### 4.12.2
April 16, 2021
#### Bugfix
* DevTools reliably suppresses console logs when generating component stacks ([bvaughn](https://github.com/bvaughn) in [#21301](https://github.com/facebook/react/pull/21301))

---

### 4.12.1
April 14, 2021
Although this release is being made for all NPM packages, only the `react-devtools-inline` package contains changes.
#### Bugfix
* Fixed `react-devtools-inline` bug in frontend `initialize` method ([bvaughn](https://github.com/bvaughn) in [#21265](https://github.com/facebook/react/pull/21265))

---

### 4.12.0
April 12, 2021
Although this release is being made for all NPM packages, only the `react-devtools-inline` package contains changes.
#### Features
* Added `createBridge` and `createStore` exports to the `react-devtools-inline/frontend` entrypoint to support advanced use cases ([bvaughn](https://github.com/bvaughn) in [#21032](https://github.com/facebook/react/pull/21032))

---

### 4.11.1
April 11, 2021
#### Bugfix
* Fixed broken import in `react-devtools-inline` for feature flags file ([bvaughn](https://github.com/bvaughn) in [#21237](https://github.com/facebook/react/pull/21237))

---

### 4.11.0
April 9, 2021
#### Bugfix
* `$r` should contain hooks property when it is `forwardRef` or `memo` component  ([meowtec](https://github.com/meowtec) in [#20626](https://github.com/facebook/react/pull/20626))
* Ensure `sync-xhr` is allowed before reload and profile ([ChrisDobby](https://github.com/ChrisDobby) in [#20879](https://github.com/facebook/react/pull/20879))
* Bump electron version from 9.1.0 to 11.1.0 for darwin-arm64 builds ([jaiwanth-v](https://github.com/jaiwanth-v) in [#20496](https://github.com/facebook/react/pull/20496))
* Fixed primitive hook badge colors for light theme ([bvaughn](https://github.com/bvaughn) in [#21034](https://github.com/facebook/react/pull/21034))
* Increased minimum Chrome/Firefox versions from 51/54 to 60/55 to reduce polyfill code. ([bvaughn](https://github.com/bvaughn) in [#21185](https://github.com/facebook/react/pull/21185))
* Fix can't expand prop value in some scenario ([iChenLei](https://github.com/iChenLei) in [#20534](https://github.com/facebook/react/pull/20534))
* Flush updated passive warning/error info after delay ([bvaughn](https://github.com/bvaughn) in [#20931](https://github.com/facebook/react/pull/20931))
* Patch console methods even when only show-inline-warnings/errors enabled ([bvaughn](https://github.com/bvaughn) in [#20688](https://github.com/facebook/react/pull/20688))
* React Native fixes for new inline errors feature ([bvaughn](https://github.com/bvaughn) in [#20502](https://github.com/facebook/react/pull/20502))
* Fixed invalid work tag constants that affected a certain range of React versions ([bvaughn](https://github.com/bvaughn) in [#20362](https://github.com/facebook/react/pull/20362))

#### Features
* Improve Profiler commit-selector UX ([bvaughn](https://github.com/bvaughn) in [#20943](https://github.com/facebook/react/pull/20943))
* Swap `log` with `cbrt` for commit bar height ([bvaughn](https://github.com/bvaughn) in [#20952](https://github.com/facebook/react/pull/20952))
* Integrate with new experimental React Suspense features to improve props loading and inspection UX ([bvaughn](https://github.com/bvaughn) in [#20548](https://github.com/facebook/react/pull/20548), [#20789](https://github.com/facebook/react/pull/20789), [#20458](https://github.com/facebook/react/pull/20458))
* Expose DEV-mode warnings in devtools UI ([eps1lon](https://github.com/eps1lon) in [#20463](https://github.com/facebook/react/pull/20463))
* Display shortcuts for prev/next search result ([eps1lon](https://github.com/eps1lon) in [#20470](https://github.com/facebook/react/pull/20470))
* Increase the clickable area of the prop value ([TryingToImprove](https://github.com/TryingToImprove) in [#20428](https://github.com/facebook/react/pull/20428))

#### Experimental features
The following features are only enabled when used with (experimental) builds of React:
* Shows which fibers scheduled the current update ([bvaughn](https://github.com/bvaughn) in [#21171](https://github.com/facebook/react/pull/21171))
* Add commit and post-commit durations to Profiler UI ([bvaughn](https://github.com/bvaughn) in [#20984](https://github.com/facebook/react/pull/20984), [#21183](https://github.com/facebook/react/pull/21183))
* Show which hooks (indices) changed when profiling ([bvaughn](https://github.com/bvaughn) in [#20998](https://github.com/facebook/react/pull/20998))

###### Improve Profiler commit-selector UX

![Video demonstrating tooltip with commit duration and time](https://user-images.githubusercontent.com/29597/110225725-30a1f480-7eb6-11eb-9825-4c762ffde0bb.gif)

![Graphic illustrating Profiler bar heights using different scales](https://user-images.githubusercontent.com/29597/110361997-bafd6c00-800e-11eb-92d8-d411e6c79d84.png)

###### Expose DEV-mode warnings in devtools UI
![Inline warnings and errors](https://user-images.githubusercontent.com/29597/114225729-adeed800-9940-11eb-8df2-34d8b0ead3b8.png)

###### Shows which fibers scheduled the current update
![Shows which fibers scheduled the current update](https://user-images.githubusercontent.com/29597/114225931-eee6ec80-9940-11eb-90cc-fe6630fbfc08.gif)

###### Add commit and post-commit durations to Profiler UI
![Add commit and post-commit durations to Profiler UI](https://user-images.githubusercontent.com/29597/114225991-00c88f80-9941-11eb-84df-e2af04ecef1c.gif)

###### Show which hooks (indices) changed when profiling
![Show which hooks (indices) changed when profiling](https://user-images.githubusercontent.com/29597/114225838-d37be180-9940-11eb-93f8-93e0115421c8.png)

---

### 4.10.4
May 20, 2021
#### Bugfix
* Ported passive effects sync flushing/bubbling bugfix ([bvaughn](https://github.com/bvaughn) in [#21540](https://github.com/facebook/react/pull/21540))

---

### 4.10.3
April 27, 2021
#### Bugfix
* Replaced Facebook-internal fburl.com link with public fb.me link for Bridge protocol mismatch info page ([bvaughn](https://github.com/bvaughn) in [#21344](https://github.com/facebook/react/pull/21344))

---

### 4.10.2
April 27, 2021
#### Features
* Added Bridge protocol check and warning dialog if embedded DevTools backend is incompatible with DevTools UI ([bvaughn](https://github.com/bvaughn) in [#21344](https://github.com/facebook/react/pull/21344))

---

### 4.10.1
November 12, 2020
#### Bugfix
* Fixed invalid internal work tag mappings ([bvaughn](https://github.com/bvaughn) in [#20362](https://github.com/facebook/react/pull/20362))

---

### 4.10.0
November 12, 2020
#### Features
* Make DevTools Websocket retry delay configurable ([bvaughn](https://github.com/bvaughn) in [#20107](https://github.com/facebook/react/pull/20107))
#### Bugfix
* Fix error loading source maps for devtools extension ([sytranvn](https://github.com/sytranvn) in [#20079](https://github.com/facebook/react/pull/20079))
* Remove css-sourcemap for `react-devtools-inline` ([sean9keenan](https://github.com/sean9keenan) in [#20170](https://github.com/facebook/react/pull/20170))
* Decrease NPM update notification/prompt for standalone DevTools ([recurx](https://github.com/recurx) in [#20078](https://github.com/facebook/react/pull/20078))

---

### 4.9.0
October 19, 2020
#### Features
* [Improved DevTools editing interface](#improved-devtools-editing-interface) ([bvaughn](https://github.com/bvaughn) in [#19774](https://github.com/facebook/react/pull/19774))
* Add ⎇ + arrow key navigation ([bvaughn](https://github.com/bvaughn) in [#19741](https://github.com/facebook/react/pull/19741))
* Add checkbox toggle for boolean values ([mdaj06](https://github.com/mdaj06) in [#19714](https://github.com/facebook/react/pull/19714))
* Show symbols used as keys in state ([omarsy](https://github.com/omarsy) in [#19786](https://github.com/facebook/react/pull/19786))
* Add new (unstable) `SuspenseList` component type ([bpernick](https://github.com/bpernick) in [#19684](https://github.com/facebook/react/pull/19684))

#### Bugfix
* Show proper icon/tooltip for restricted browser pages ([sktguha](https://github.com/sktguha) in [#20023](https://github.com/facebook/react/pull/20023))
* Fix emoji character shown in Chrome developer tools panel ([bvaughn](https://github.com/bvaughn) in [#19603](https://github.com/facebook/react/pull/19603))
* Don't open two tabs in Firefox when clicking on troubleshooting instructions ([unbyte](https://github.com/unbyte) in [#19632](https://github.com/facebook/react/pull/19632))
* Support inner component `_debugOwner` in memo ([bvaughn](https://github.com/bvaughn) in [#19556](https://github.com/facebook/react/pull/19556))
* Proxied methods should be safely dehydrated for display ([@pfongkye](https://github.com/pfongkye) in [b6e1d08](https://github.com/facebook/react/commit/b6e1d08)
* Property list values should show whitespace ([sammarks](https://github.com/sammarks) in [#19640](https://github.com/facebook/react/pull/19640))
* Fix crash when inspecting document.all ([omarsy](https://github.com/omarsy) in [#19619](https://github.com/facebook/react/pull/19619))
* Don't call generators during inspection since they may be stateful ([todortotev](https://github.com/todortotev) in [#19831](https://github.com/facebook/react/pull/19831))
* Fix bad null check in DevTools highlight code ([bvaughn](https://github.com/bvaughn) in [#20010](https://github.com/facebook/react/pull/20010))
* Handled a missing suspense fiber when suspense is filtered on the profiler ([IDrissAitHafid](https://github.com/IDrissAitHafid) in [#ISSUE](https://github.com/facebook/react/pull/ISSUE))
* Fixed unfound node error when Suspense is filtered ([IDrissAitHafid](https://github.com/IDrissAitHafid) in [#20019](https://github.com/facebook/react/pull/20019))
* Always overrides the dispatcher when shallow rendering ([bvaughn](https://github.com/bvaughn) in [#20011](https://github.com/facebook/react/pull/20011))
* Frevent phishing attacks ([iamwilson](https://github.com/iamwilson) in [#19934](https://github.com/facebook/react/pull/19934))

---

### Other
* Enable source maps for DevTools production builds ([jpribyl ](https://github.com/jpribyl ) in [#19773](https://github.com/facebook/react/pull/19773))
* Drop support for IE 11 ([bvaughn](https://github.com/bvaughn) in [#19875](https://github.com/facebook/react/pull/19875))
* Remove ReactJS.org version check "cheat" ([sktguha](https://github.com/sktguha) in [#19939](https://github.com/facebook/react/pull/19939))
* Update outdated links and fix two broken links ([sktguha](https://github.com/sktguha) in [#19985](https://github.com/facebook/react/pull/19985))
* Remove support for deprecated/unreleased React Flare event system ([trueadm](https://github.com/trueadm) in [#19520](https://github.com/facebook/react/pull/19520))

###### Improved DevTools editing interface

**Improved parsing**
Value parsing logic has been relaxed so as to no longer require quotes around strings or double quotes:
![looser parsing logic](https://user-images.githubusercontent.com/29597/93407442-36504300-f860-11ea-90e8-5ad54c9b8b34.gif)

**Modifying arrays**
New values can be added to array props/state/hooks now. Existing values can also be deleted:
![adding and removing values from an array](https://user-images.githubusercontent.com/29597/93407457-3ea87e00-f860-11ea-8b85-a41904e6c25f.gif)

**Modifying objects**
New keys can be added to object props/state/hooks now. Existing keys can be renamed or deleted entirely:
![adding/renaming/removing object properties](https://user-images.githubusercontent.com/29597/93407464-449e5f00-f860-11ea-909b-49dafb56f6c5.gif)

---

### 4.8.2
July 15, 2020
#### Bugfix
* Fix broken `Suspense` heuristic ([bvaughn](https://github.com/bvaughn) in [#19373](https://github.com/facebook/react/pull/19373))
* Fixed error with standalone in HTTPS mode ([b-ponomarenko](https://github.com/b-ponomarenko) in [#19336](https://github.com/facebook/react/pull/19336))
* Disable DevTools minification ([bvaughn](https://github.com/bvaughn) in [#19369](https://github.com/facebook/react/pull/19369))

---

### 4.8.1
July 10, 2020
#### Bugfix
* Fix break-on-warning to truly be off by default. ([gaearon](https://github.com/gaearon) in [#19309](https://github.com/facebook/react/pull/19309))

---

### 4.8.0
July 9, 2020
#### Features
* Add SSL support to React devtools standalone ([ittaibaratz](https://github.com/ittaibaratz) in [#19191](https://github.com/facebook/react/pull/19191))
* New break-on-warning feature (off by default) ([bvaughn](https://github.com/bvaughn) in [#19048](https://github.com/facebook/react/pull/19048))

#### Bugfix
* Updates Electron version for react-devtools to pull in several security fixes ([gsimone](https://github.com/gsimone) in [#19280](https://github.com/facebook/react/pull/19280))
* Remove unnecessary tag end from CommitRanked view ([finico](https://github.com/finico) in [#19195](https://github.com/facebook/react/pull/19195))
* Shutdown DevTools Bridge synchronously when unmounting ([bvaughn](https://github.com/bvaughn) in [#19180](https://github.com/facebook/react/pull/19180))

---

### 4.7.0
May 18, 2020

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

---

### 4.6.0
March 26, 2020

#### Features
* Add shortcut keys for tab switching ([kerolloz](https://github.com/kerolloz) in [#18248](https://github.com/facebook/react/pull/18248))

#### Bugfix
* Improve display of complex values for `useDebugValue` ([eps1lon](https://github.com/eps1lon) in [#18070](https://github.com/facebook/react/pull/18070))
* Fix minor CSS layout issue that broke Profiler commit selector UI ([bvaughn](https://github.com/bvaughn) in [#18286](https://github.com/facebook/react/pull/18286))
* Inlined DevTools event emitter implementation to fix a source of Profiler bugs ([bvaughn](https://github.com/bvaughn) in [#18378](https://github.com/facebook/react/pull/18378))

#### Cleanup
* Remove "es6-symbol" dependency from "react-devtools-inline" package ([bvaughn](https://github.com/bvaughn) in [#18397](https://github.com/facebook/react/pull/18397))

---

### 4.5.0
March 3, 2020

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

---

### 4.4.0
January 3, 2020
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

---

### 4.3.0
December 20, 2019
#### Features
* Show component location for selected element in bottom/right panel ([bvaughn](https://github.com/bvaughn) in [#17567](https://github.com/facebook/react/pull/17567))
* Improved inspected element values with inline previews ([bvaughn](https://github.com/bvaughn) in [#17579](https://github.com/facebook/react/pull/17579))
* Improved selection and toggling for inspected element panel ([bvaughn](https://github.com/bvaughn) in [#17588](https://github.com/facebook/react/pull/17588))
* Copy context menu for inspecting and copying props/state/hooks/context values ([bvaughn](https://github.com/bvaughn) in [#17608](https://github.com/facebook/react/pull/17608))
#### Bug fixes
* Fix serialization for `BigInt` type so that it does not break inspection panel. ([nutboltu](https://github.com/nutboltu) in [#17233](https://github.com/facebook/react/pull/17233))
* Fix display name logic for `forwardRef`s that use `displayName` property ([zthxxx](https://github.com/zthxxx) in [#17613](https://github.com/facebook/react/pull/17613))

---

### 4.2.1
November 27, 2019
#### Bug fixes
* Profiler automatically filters certain types of empty (no work) commits. ([bvaughn](https://github.com/bvaughn) in [#17253](https://github.com/facebook/react/pull/17253))
* Fix memoized components showing as "Anonymous" in Components tab. ([wsmd](https://github.com/wsmd) in [#17274](https://github.com/facebook/react/pull/17274))
* Edge-case bugfix for non-string element keys. ([bvaughn](https://github.com/bvaughn) in [#17164](https://github.com/facebook/react/pull/17164))

---

### 4.2.0
October 3, 2019
#### Features
* "Highlight updates" feature added for browser extensions and `react-devtools-inline` NPM package. ([bvaughn](https://github.com/bvaughn) in [#16989](https://github.com/facebook/react/pull/16989))

---

### 4.1.3
September 30, 2019
#### Bug fixes
* Fixed regression where DevTools wouldn't properly connect with apps when using the `file://` protocol. ([linshunghuang](https://github.com/linshunghuang) in [#16953](https://github.com/facebook/react/pull/16953))

---

### 4.1.2
September 27, 2019
#### Bug fixes
* Fixed an infinite loop that occurred in some cases with prop values of `NaN`. ([bvaughn](https://github.com/bvaughn) in [#16934](https://github.com/facebook/react/pull/16934))

---

### 4.1.1
September 26, 2019
#### Bug fixes
* Fixed bug where Components panel was always empty for certain users. ([linshunghuang](https://github.com/linshunghuang) in [#16900](https://github.com/facebook/react/pull/16900))
* Fixed regression in DevTools editable hooks interface that caused primitive values to be shown as `undefined`. ([bvaughn](https://github.com/bvaughn) in [#16867](https://github.com/facebook/react/pull/16867))
* Fixed bug where DevTools showed stale values in props/state/hooks editing interface. ([bvaughn](https://github.com/bvaughn) in [#16878](https://github.com/facebook/react/pull/16878))
* Show unsupported version dialog with downgrade instructions. ([bvaughn](https://github.com/bvaughn) in [#16897](https://github.com/facebook/react/pull/16897))

---

### 4.1.0
September 19, 2019
#### Features
* Props/state editor supports adding new values and changing value types. ([hristo-kanchev](https://github.com/hristo-kanchev) in [#16700](https://github.com/facebook/react/pull/16700))
#### Bug fixes
* Profiler correctly saves/exports profiling data in Firefox now. ([hristo-kanchev](https://github.com/hristo-kanchev) in [#16612](https://github.com/facebook/react/pull/16612))
* Class components now show "legacy context" header (rather than "context") for legacy API. ([hristo-kanchev](https://github.com/hristo-kanchev) in [#16617](https://github.com/facebook/react/pull/16617))
* Show component source button ("<>") now highlights the `render` method for class components. ([theKashey](https://github.com/theKashey) in [#16759](https://github.com/facebook/react/pull/16759))
* Bugfix for components with non-standard object values for `function.name`. ([LetItRock](https://github.com/LetItRock) in [#16798](https://github.com/facebook/react/pull/16798))

---

### 4.0.6
August 26, 2019
#### Bug fixes
* Remove ⚛️ emoji prefix from Firefox extension tab labels
* Standalone polyfills `Symbol` usage

---

### 4.0.5
August 19, 2019
#### Bug fixes
* Props, state, and context values are alpha sorted.
* Standalone DevTools properly serves backend script over localhost:8097

---

### 4.0.4
August 18, 2019
#### Bug fixes
* Bugfix for potential error if a min-duration commit filter is applied after selecting a fiber in the Profiler UI.

---

### 4.0.3
August 17, 2019
#### Bug fixes
* ES6 `Map` and `Set`, typed arrays, and other unserializable types (e.g. Immutable JS) can now be inspected.
* Empty objects and arrays now display an "(empty)" label to the right to reduce confusion.
* Components that use only the `useContext` hook now properly display hooks values in side panel.
* Style editor now supports single quotes around string values (e.g. both `"red"` and `'red'`).
* Fixed edge case bug that prevented profiling when both React v16 and v15 were present on a page.

---

### 4.0.2
August 15, 2019
#### Permissions cleanup
* Removed unnecessary `webNavigation ` permission from Chrome and Firefox extensions.

---

### 4.0.1
August 15, 2019
#### Permissions cleanup
* Removed unnecessary `<all_urls>`, `background`, and `tabs` permissions from Chrome and Firefox extensions.

---

### 4.0.0
August 15, 2019

---

### General changes

#### Improved performance
The legacy DevTools extension used to add significant performance overhead, making it unusable for some larger React applications. That overhead has been effectively eliminated in version 4.

[Learn more](https://github.com/facebook/react/blob/main/packages/react-devtools/OVERVIEW.md) about the performance optimizations that made this possible.

#### Component stacks

React component authors have often requested a way to log warnings that include the React ["component stack"](https://reactjs.org/docs/error-boundaries.html#component-stack-traces). DevTools now provides an option to automatically append this information to warnings (`console.warn`) and errors (`console.error`).

![Example console warning with component stack added](https://user-images.githubusercontent.com/29597/62228120-eec3da80-b371-11e9-81bb-018c1e577389.png)

It can be disabled in the general settings panel:

![Settings panel showing "component stacks" option](https://user-images.githubusercontent.com/29597/62227882-8f65ca80-b371-11e9-8a4e-5d27011ad1aa.png)

---

### Components tree changes

#### Component filters

Large component trees can sometimes be hard to navigate. DevTools now provides a way to filter components so that you can hide ones you're not interested in seeing.

![Component filter demo video](https://user-images.githubusercontent.com/29597/62229209-0bf9a880-b374-11e9-8f84-cebd6c1a016b.gif)

Host nodes (e.g. HTML `<div>`, React Native `View`) are now hidden by default, but you can see them by disabling that filter.

Filter preferences are remembered between sessions.

#### No more inline props

Components in the tree no longer show inline props. This was done to [make DevTools faster](https://github.com/facebook/react/blob/main/packages/react-devtools/OVERVIEW.md) and to make it easier to browse larger component trees.

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

---

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

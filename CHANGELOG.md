## 15.6.2 (August 10, 2017)

### React DOM

* Fix a bug where modifying document.documentMode would trigger IE detection in other browsers, breaking change events ([@aweary](https://github.com/aweary) in [#10032](https://github.com/facebook/react/pull/10032)
* CSS Columns are treated as unitless numbers ([@aweary](https://github.com/aweary) in [#10115](https://github.com/facebook/react/pull/10115)
* Fix bug in QtWebKit when wrapping synthetic events in proxies ([@walrusfruitcake](https://github.com/walrusfruitcake) in [#10115](https://github.com/facebook/react/pull/10011)
* Prevent event handlers from recieving extra argument (dev only) ([@aweary](https://github.com/aweary) in [#10115](https://github.com/facebook/react/pull/8363)
* Fix cases where onChange would not fire with defaultChecked on radio inputs ([@jquense](https://github.com/jquense) in [#10156](https://github.com/facebook/react/pull/10156))
* Add support for controlList attribute to DOM property whitelist ([@nhunzaker](https://github.com/nhunzaker) in [#9940](https://github.com/facebook/react/pull/9940))

## 15.6.1 (June 14, 2017)

### React DOM

* Fix a crash on iOS Safari. ([@jquense](https://github.com/jquense) in [#9960](https://github.com/facebook/react/pull/9960))
* Don't add `px` to custom CSS property values. ([@TrySound](https://github.com/TrySound) in [#9966](https://github.com/facebook/react/pull/9966))

## 15.6.0 (June 13, 2017)

### React

* Downgrade deprecation warnings to use `console.warn` instead of `console.error`. ([@flarnie](https://github.com/flarnie) in [#9753](https://github.com/facebook/react/pull/9753))
* Add a deprecation warning for `React.createClass`. Points users to `create-react-class` instead. ([@flarnie](https://github.com/flarnie) in [#9771](https://github.com/facebook/react/pull/9771))
* Add deprecation warnings and separate module for `React.DOM` factory helpers. ([@nhunzaker](https://github.com/nhunzaker) in [#8356](https://github.com/facebook/react/pull/8356))
* Warn for deprecation of `React.createMixin` helper, which was never used. ([@aweary](https://github.com/aweary) in [#8853](https://github.com/facebook/react/pull/8853))

### React DOM

* Add support for CSS variables in `style` attribute. ([@aweary](https://github.com/aweary) in [#9302](https://github.com/facebook/react/pull/9302))
* Add support for CSS Grid style properties. ([@ericsakmar](https://github.com/ericsakmar) in [#9185](https://github.com/facebook/react/pull/9185))
* Fix bug where inputs mutated value on type conversion. ([@nhunzaker](https://github.com/mhunzaker) in [#9806](https://github.com/facebook/react/pull/9806))
* Fix issues with `onChange` not firing properly for some inputs. ([@jquense](https://github.com/jquense) in [#8575](https://github.com/facebook/react/pull/8575))
* Fix bug where controlled number input mistakenly allowed period. ([@nhunzaker](https://github.com/nhunzaker) in [#9584](https://github.com/facebook/react/pull/9584))
* Fix bug where performance entries were being cleared. ([@chrisui](https://github.com/chrisui) in [#9451](https://github.com/facebook/react/pull/9451))

### React Addons

* Fix AMD support for addons depending on `react`. ([@flarnie](https://github.com/flarnie) in [#9919](https://github.com/facebook/react/issues/9919))
* Fix `isMounted()` to return `true` in `componentWillUnmount`. ([@mridgway](https://github.com/mridgway) in [#9638](https://github.com/facebook/react/issues/9638))
* Fix `react-addons-update` to not depend on native `Object.assign`. ([@gaearon](https://github.com/gaearon) in [#9937](https://github.com/facebook/react/pull/9937))
* Remove broken Google Closure Compiler annotation from `create-react-class`. ([@gaearon](https://github.com/gaearon) in [#9933](https://github.com/facebook/react/pull/9933))
* Remove unnecessary dependency from `react-linked-input`. ([@gaearon](https://github.com/gaearon) in [#9766](https://github.com/facebook/react/pull/9766))
* Point `react-addons-(css-)transition-group` to the new package. ([@gaearon](https://github.com/gaearon) in [#9937](https://github.com/facebook/react/pull/9937))

## 15.5.4 (April 11, 2017)

### React Addons
* **Critical Bugfix:** Update the version of `prop-types` to fix critical bug.  ([@gaearon](https://github.com/gaearon) in [545c87f](https://github.com/facebook/react/commit/545c87fdc348f82eb0c3830bef715ed180785390))
* Fix `react-addons-create-fragment` package to include `loose-envify` transform for Browserify users. ([@mridgway](https://github.com/mridgway) in [#9642](https://github.com/facebook/react/pull/9642))

### React Test Renderer
* Fix compatibility with Enzyme by exposing `batchedUpdates` on shallow renderer. ([@gaearon](https://github.com/gaearon) in [9382](https://github.com/facebook/react/commit/69933e25c37cf5453a9ef132177241203ee8d2fd))

## 15.5.3 (April 7, 2017)

**Note: this release has a critical issue and was deprecated. Please update to 15.5.4 or higher.**

### React Addons
* Fix `react-addons-create-fragment` package to export correct thing. ([@gaearon](https://github.com/gaearon) in [#9385](https://github.com/facebook/react/pull/9383))
* Fix `create-react-class` package to include `loose-envify` transform for Browserify users. ([@mridgway](https://github.com/mridgway) in [#9642](https://github.com/facebook/react/pull/9642))

## 15.5.2 (April 7, 2017)

**Note: this release has a critical issue and was deprecated. Please update to 15.5.4 or higher.**

### React Addons
* Fix the production single-file builds to not include the development code. ([@gaearon](https://github.com/gaearon) in [#9385](https://github.com/facebook/react/pull/9383))
* Apply better minification to production single-file builds. ([@gaearon](https://github.com/gaearon) in [#9385](https://github.com/facebook/react/pull/9383))
* Add missing and remove unnecessary dependencies to packages. ([@gaearon](https://github.com/gaearon) in [#9385](https://github.com/facebook/react/pull/9383))

## 15.5.1 (April 7, 2017)

**Note: this release has a critical issue and was deprecated. Please update to 15.5.4 or higher.**

### React
* Fix erroneous PropTypes access warning. ([@acdlite](https://github.com/acdlite) in ([ec97ebb](https://github.com/facebook/react/commit/ec97ebbe7f15b58ae2f1323df39d06f119873344))

## 15.5.0 (April 7, 2017)

**Note: this release has a critical issue and was deprecated. Please update to 15.5.4 or higher.**

### React
* <s>Added a deprecation warning for `React.createClass`. Points users to create-react-class instead. ([@acdlite](https://github.com/acdlite) in [#d9a4fa4](https://github.com/facebook/react/commit/d9a4fa4f51c6da895e1655f32255cf72c0fe620e))</s>
* Added a deprecation warning for `React.PropTypes`. Points users to prop-types instead. ([@acdlite](https://github.com/acdlite) in [#043845c](https://github.com/facebook/react/commit/043845ce75ea0812286bbbd9d34994bb7e01eb28))
* Fixed an issue when using `ReactDOM` together with `ReactDOMServer`. ([@wacii](https://github.com/wacii) in [#9005](https://github.com/facebook/react/pull/9005))
* Fixed issue with Closure Compiler. ([@anmonteiro](https://github.com/anmonteiro) in [#8895](https://github.com/facebook/react/pull/8895))
* Another fix for Closure Compiler. ([@Shastel](https://github.com/Shastel) in [#8882](https://github.com/facebook/react/pull/8882))
* Added component stack info to invalid element type warning. ([@n3tr](https://github.com/n3tr) in [#8495](https://github.com/facebook/react/pull/8495))

### React DOM
* Fixed Chrome bug when backspacing in number inputs. ([@nhunzaker](https://github.com/nhunzaker) in [#7359](https://github.com/facebook/react/pull/7359))
* Added `react-dom/test-utils`, which exports the React Test Utils. ([@bvaughn](https://github.com/bvaughn))

### React Test Renderer
* Fixed bug where `componentWillUnmount` was not called for children. ([@gre](https://github.com/gre) in [#8512](https://github.com/facebook/react/pull/8512))
* Added `react-test-renderer/shallow`, which exports the shallow renderer. ([@bvaughn](https://github.com/bvaughn))

### React Addons
* Last release for addons; they will no longer be actively maintained.
* Removed `peerDependencies` so that addons continue to work indefinitely. ([@acdlite](https://github.com/acdlite) and [@bvaughn](https://github.com/bvaughn) in [8a06cd7](https://github.com/facebook/react/commit/8a06cd7a786822fce229197cac8125a551e8abfa) and [67a8db3](https://github.com/facebook/react/commit/67a8db3650d724a51e70be130e9008806402678a))
* Updated to remove references to `React.createClass` and `React.PropTypes` ([@acdlite](https://github.com/acdlite) in [12a96b9](https://github.com/facebook/react/commit/12a96b94823d6b6de6b1ac13bd576864abd50175))
* `react-addons-test-utils` is deprecated. Use `react-dom/test-utils` and `react-test-renderer/shallow` instead. ([@bvaughn](https://github.com/bvaughn))

## 15.4.2 (January 6, 2017)

### React
* Fixed build issues with the Brunch bundler. ([@gaearon](https://github.com/gaearon) in [#8686](https://github.com/facebook/react/pull/8686))
* Improved error messages for invalid element types. ([@spicyj](https://github.com/spicyj) in [#8612](https://github.com/facebook/react/pull/8612))
* Removed a warning about `getInitialState` when `this.state` is set. ([@bvaughn](https://github.com/bvaughn) in [#8594](https://github.com/facebook/react/pull/8594))
* Removed some dead code. ([@diegomura](https://github.com/diegomura) in [#8050](https://github.com/facebook/react/pull/8050), [@dfrownfelter](https://github.com/dfrownfelter) in [#8597](https://github.com/facebook/react/pull/8597))

### React DOM
* Fixed a decimal point issue on uncontrolled number inputs. ([@nhunzaker](https://github.com/nhunzaker) in [#7750](https://github.com/facebook/react/pull/7750))
* Fixed rendering of textarea placeholder in IE11. ([@aweary](https://github.com/aweary) in [#8020](https://github.com/facebook/react/pull/8020))
* Worked around a script engine bug in IE9. ([@eoin](https://github.com/eoin) in [#8018](https://github.com/facebook/react/pull/8018))

### React Addons
* Fixed build issues in RequireJS and SystemJS environments. ([@gaearon](https://github.com/gaearon) in [#8686](https://github.com/facebook/react/pull/8686))
* Added missing package dependencies. ([@kweiberth](https://github.com/kweiberth) in [#8467](https://github.com/facebook/react/pull/8467))

## 15.4.1 (November 22, 2016)

### React
* Restructure variable assignment to work around a Rollup bug ([@gaearon](https://github.com/gaearon) in [#8384](https://github.com/facebook/react/pull/8384))

### React DOM
* Fixed event handling on disabled button elements ([@spicyj](https://github.com/spicyj) in [#8387](https://github.com/facebook/react/pull/8387))
* Fixed compatibility of browser build with AMD environments ([@zpao](https://github.com/zpao) in [#8374](https://github.com/facebook/react/pull/8374))

## 15.4.0 (November 16, 2016)

### React
* React package and browser build no longer "secretly" includes React DOM. ([@sebmarkbage](https://github.com/sebmarkbage) in [#7164](https://github.com/facebook/react/pull/7164) and [#7168](https://github.com/facebook/react/pull/7168))
* Required PropTypes now fail with specific messages for null and undefined. ([@chenglou](https://github.com/chenglou) in [#7291](https://github.com/facebook/react/pull/7291))
* Improved development performance by freezing children instead of copying. ([@keyanzhang](https://github.com/keyanzhang) in [#7455](https://github.com/facebook/react/pull/7455))

### React DOM
* Fixed occasional test failures when React DOM is used together with shallow renderer. ([@goatslacker](https://github.com/goatslacker) in [#8097](https://github.com/facebook/react/pull/8097))
* Added a warning for invalid `aria-` attributes. ([@jessebeach](https://github.com/jessebeach) in [#7744](https://github.com/facebook/react/pull/7744))
* Added a warning for using `autofocus` rather than `autoFocus`. ([@hkal](https://github.com/hkal) in [#7694](https://github.com/facebook/react/pull/7694))
* Removed an unnecessary warning about polyfilling `String.prototype.split`. ([@nhunzaker](https://github.com/nhunzaker) in [#7629](https://github.com/facebook/react/pull/7629))
* Clarified the warning about not calling PropTypes manually. ([@jedwards1211](https://github.com/jedwards1211) in [#7777](https://github.com/facebook/react/pull/7777))
* The unstable `batchedUpdates` API now passes the wrapped function's return value through. ([@bgnorlov](https://github.com/bgnorlov) in [#7444](https://github.com/facebook/react/pull/7444))
* Fixed a bug with updating text in IE 8. ([@mnpenner](https://github.com/mnpenner) in [#7832](https://github.com/facebook/react/pull/7832))

### React Perf
* When ReactPerf is started, you can now view the relative time spent in components as a chart in Chrome Timeline. ([@gaearon](https://github.com/gaearon) in [#7549](https://github.com/facebook/react/pull/7549))

### React Test Utils
* If you call `Simulate.click()` on a `<input disabled onClick={foo} />` then `foo` will get called whereas it didn't before. ([@nhunzaker](https://github.com/nhunzaker) in [#7642](https://github.com/facebook/react/pull/7642))

### React Test Renderer
* Due to packaging changes, it no longer crashes when imported together with React DOM in the same file. ([@sebmarkbage](https://github.com/sebmarkbage) in [#7164](https://github.com/facebook/react/pull/7164) and [#7168](https://github.com/facebook/react/pull/7168))
* `ReactTestRenderer.create()` now accepts `{createNodeMock: element => mock}` as an optional argument so you can mock refs with snapshot testing. ([@Aweary](https://github.com/Aweary) in [#7649](https://github.com/facebook/react/pull/7649), [#8261](https://github.com/facebook/react/pull/8261))


## 15.3.2 (September 19, 2016)

### React
- Remove plain object warning from React.createElement & React.cloneElement. ([@spudly](https://github.com/spudly) in [#7724](https://github.com/facebook/react/pull/7724))

### React DOM
- Add `playsInline` to supported HTML attributes. ([@reaperhulk](https://github.com/reaperhulk) in [#7519](https://github.com/facebook/react/pull/7519))
- Add `as` to supported HTML attributes. ([@kevinslin](https://github.com/kevinslin) in [#7582](https://github.com/facebook/react/pull/7582))
- Improve DOM nesting validation warning about whitespace. ([@spicyj](https://github.com/spicyj) in [#7515](https://github.com/facebook/react/pull/7515))
- Avoid "Member not found" exception in IE10 when calling `preventDefault()` in Synthetic Events. ([@g-palmer](https://github.com/g-palmer) in [#7411](https://github.com/facebook/react/pull/7411))
- Fix memory leak in `onSelect` implementation. ([@AgtLucas](https://github.com/AgtLucas) in [#7533](https://github.com/facebook/react/pull/7533))
- Improve robustness of `document.documentMode` checks to handle Google Tag Manager. ([@SchleyB](https://github.com/SchleyB) in [#7594](https://github.com/facebook/react/pull/7594))
- Add more cases to controlled inputs warning. ([@marcin-mazurek](https://github.com/marcin-mazurek) in [#7544](https://github.com/facebook/react/pull/7544))
- Handle case of popup blockers overriding `document.createEvent`. ([@Andarist](https://github.com/Andarist) in [#7621](https://github.com/facebook/react/pull/7621))
- Fix issue with `dangerouslySetInnerHTML` and SVG in Internet Explorer. ([@zpao](https://github.com/zpao) in [#7618](https://github.com/facebook/react/pull/7618))
- Improve handling of Japanese IME on Internet Explorer. ([@msmania](https://github.com/msmania) in [#7107](https://github.com/facebook/react/pull/7107))

### React Test Renderer
- Support error boundaries. ([@millermedeiros](https://github.com/millermedeiros) in [#7558](https://github.com/facebook/react/pull/7558), [#7569](https://github.com/facebook/react/pull/7569), [#7619](https://github.com/facebook/react/pull/7619))
- Skip null ref warning. ([@Aweary](https://github.com/Aweary) in [#7658](https://github.com/facebook/react/pull/7658))

### React Perf Add-on
- Ensure lifecycle timers are stopped on errors. ([@gaearon](https://github.com/gaearon) in [#7548](https://github.com/facebook/react/pull/7548))


## 15.3.1 (August 19, 2016)

### React

- Improve performance of development builds in various ways. ([@gaearon](https://github.com/gaearon) in [#7461](https://github.com/facebook/react/pull/7461), [#7463](https://github.com/facebook/react/pull/7463), [#7483](https://github.com/facebook/react/pull/7483), [#7488](https://github.com/facebook/react/pull/7488), [#7491](https://github.com/facebook/react/pull/7491), [#7510](https://github.com/facebook/react/pull/7510))
- Cleanup internal hooks to improve performance of development builds. ([@gaearon](https://github.com/gaearon) in [#7464](https://github.com/facebook/react/pull/7464), [#7472](https://github.com/facebook/react/pull/7472), [#7481](https://github.com/facebook/react/pull/7481), [#7496](https://github.com/facebook/react/pull/7496))
- Upgrade fbjs to pick up another performance improvement from [@gaearon](https://github.com/gaearon) for development builds. ([@zpao](https://github.com/zpao) in [#7532](https://github.com/facebook/react/pull/7532))
- Improve startup time of React in Node. ([@zertosh](https://github.com/zertosh) in [#7493](https://github.com/facebook/react/pull/7493))
- Improve error message of `React.Children.only`. ([@spicyj](https://github.com/spicyj) in [#7514](https://github.com/facebook/react/pull/7514))

### React DOM
- Avoid `<input>` validation warning from browsers when changing `type`. ([@nhunzaker](https://github.com/nhunzaker) in [#7333](https://github.com/facebook/react/pull/7333))
- Avoid "Member not found" exception in IE10 when calling `stopPropagation()` in Synthetic Events. ([@nhunzaker](https://github.com/nhunzaker) in [#7343](https://github.com/facebook/react/pull/7343))
- Fix issue resulting in inability to update some `<input>` elements in mobile browsers. ([@keyanzhang](https://github.com/keyanzhang) in [#7397](https://github.com/facebook/react/pull/7397))
- Fix memory leak in server rendering. ([@keyanzhang](https://github.com/keyanzhang) in [#7410](https://github.com/facebook/react/pull/7410))
- Fix issue resulting in `<input type="range">` values not updating when changing `min` or `max`. ([@troydemonbreun](https://github.com/troydemonbreun) in [#7486](https://github.com/facebook/react/pull/7486))
- Add new warning for rare case of attempting to unmount a container owned by a different copy of React. ([@ventuno](https://github.com/ventuno) in [#7456](https://github.com/facebook/react/pull/7456))

### React Test Renderer
- Fix ReactTestInstance::toJSON() with empty top-level components. ([@Morhaus](https://github.com/Morhaus) in [#7523](https://github.com/facebook/react/pull/7523))

### React Native Renderer
- Change `trackedTouchCount` invariant into a console.error for better reliability. ([@yungsters](https://github.com/yungsters) in [#7400](https://github.com/facebook/react/pull/7400))


## 15.3.0 (July 29, 2016)

### React
- Add `React.PureComponent` - a new base class to extend, replacing `react-addons-pure-render-mixin` now that mixins don't work with ES2015 classes. ([@spicyj](https://github.com/spicyj) in [#7195](https://github.com/facebook/react/pull/7195))
- Add new warning when modifying `this.props.children`. ([@jimfb](https://github.com/jimfb) in [#7001](https://github.com/facebook/react/pull/7001))
- Fixed issue with ref resolution order. ([@gaearon](https://github.com/gaearon) in [#7101](https://github.com/facebook/react/pull/7101))
- Warn when mixin is undefined. ([@swaroopsm](https://github.com/swaroopsm) in [#6158](https://github.com/facebook/react/pull/6158))
- Downgrade "unexpected batch number" invariant to a warning. ([@spicyj](https://github.com/spicyj) in [#7133](https://github.com/facebook/react/pull/7133))
- Validate arguments to `oneOf` and `oneOfType` PropTypes sooner. ([@troydemonbreun](https://github.com/troydemonbreun) in [#6316](https://github.com/facebook/react/pull/6316))
- Warn when calling PropTypes directly. ([@Aweary](https://github.com/Aweary) in [#7132](https://github.com/facebook/react/pull/7132), [#7194](https://github.com/facebook/react/pull/7194))
- Improve warning when using Maps as children. ([@keyanzhang](https://github.com/keyanzhang) in [#7260](https://github.com/facebook/react/pull/7260))
- Add additional type information to the `PropTypes.element` warning. ([@alexzherdev](https://github.com/alexzherdev) in [#7319](https://github.com/facebook/react/pull/7319))
- Improve component identification in no-op `setState` warning. ([@keyanzhang](https://github.com/keyanzhang) in [#7326](https://github.com/facebook/react/pull/7326))

### React DOM
- Fix issue with nested server rendering. ([@Aweary](https://github.com/Aweary) in [#7033](https://github.com/facebook/react/pull/7033))
- Add `xmlns`, `xmlnsXlink` to supported SVG attributes. ([@salzhrani](https://github.com/salzhrani) in [#6471](https://github.com/facebook/react/pull/6471))
- Add `referrerPolicy` to supported HTML attributes. ([@Aweary](https://github.com/Aweary) in [#7274](https://github.com/facebook/react/pull/7274))
- Fix issue resulting in `<input type="range">` initial value being rounded. ([@troydemonbreun](https://github.com/troydemonbreun) in [#7251](https://github.com/facebook/react/pull/7251))

### React Test Renderer
- Initial public release of package allowing more focused testing. Install with `npm install react-test-renderer`. ([@spicyj](https://github.com/spicyj) in [#6944](https://github.com/facebook/react/pull/6944), [#7258](https://github.com/facebook/react/pull/7258), [@iamdustan](https://github.com/iamdustan) in [#7362](https://github.com/facebook/react/pull/7362))

### React Perf Add-on
- Fix issue resulting in excessive warnings when encountering an internal measurement error. ([@sassanh](https://github.com/sassanh) in [#7299](https://github.com/facebook/react/pull/7299))

### React TestUtils Add-on
- Implement `type` property on for events created via `TestUtils.Simulate.*`. ([@yaycmyk](https://github.com/yaycmyk) in [#6154](https://github.com/facebook/react/pull/6154))
- Fix crash when running TestUtils with the production build of React. ([@gaearon](https://github.com/gaearon) in [#7246](https://github.com/facebook/react/pull/7246))


## 15.2.1 (July 8, 2016)

### React
- Fix errant warning about missing React element. ([@gaearon](https://github.com/gaearon) in [#7193](https://github.com/facebook/react/pull/7193))
- Better removal of dev-only code, leading to a small reduction in the minified production bundle size. ([@gaearon](https://github.com/gaearon) in [#7188](https://github.com/facebook/react/pull/7188), [#7189](https://github.com/facebook/react/pull/7189))

### React DOM
- Add stack trace to null input value warning. ([@jimfb](https://github.com/jimfb) in [#7040](https://github.com/facebook/react/pull/7040))
- Fix webcomponents example. ([@jalexanderfox](https://github.com/jalexanderfox) in [#7057](https://github.com/facebook/react/pull/7057))
- Fix `unstable_renderSubtreeIntoContainer` so that context properly updates when linked to state. ([@gaearon](https://github.com/gaearon) in [#7125](https://github.com/facebook/react/pull/7125))
- Improve invariant wording for void elements. ([@starkch](https://github.com/starkch) in [#7066](https://github.com/facebook/react/pull/7066))
- Ensure no errors are thrown due to event handlers in server rendering. ([@rricard](https://github.com/rricard) in [#7127](https://github.com/facebook/react/pull/7127))
- Fix regression resulting in `value`-less submit and reset inputs removing the browser-default text. ([@zpao](https://github.com/zpao) in [#7197](https://github.com/facebook/react/pull/7197))
- Fix regression resulting in empty `name` attribute being added to inputs when not provided. ([@okonet](https://github.com/okonet) in [#7199](https://github.com/facebook/react/pull/7199))
- Fix issue with nested server rendering. ([@Aweary](https://github.com/Aweary) in [#7033](https://github.com/facebook/react/pull/7033))

### React Perf Add-on
- Make `ReactPerf.start()` work properly during lifecycle methods. ([@gaearon](https://github.com/gaearon) in [#7208](https://github.com/facebook/react/pull/7208)).

### React CSSTransitionGroup Add-on
- Fix issue resulting in spurious unknown property warnings. ([@batusai513](https://github.com/batusai513) in [#7165](https://github.com/facebook/react/pull/7165))

### React Native Renderer
- Improve error handling in cross-platform touch event handling. ([@yungsters](https://github.com/yungsters) in [#7143](https://github.com/facebook/react/pull/7143))


## 15.2.0 (July 1, 2016)

### React
- Add error codes to production invariants, with links to the view the full error text. ([@keyanzhang](https://github.com/keyanzhang) in [#6948](https://github.com/facebook/react/pull/6948))
- Include component stack information in PropType validation warnings. ([@troydemonbreun](https://github.com/troydemonbreun) in [#6398](https://github.com/facebook/react/pull/6398), [@spicyj](https://github.com/spicyj) in [#6771](https://github.com/facebook/react/pull/6771))
- Include component stack information in key warnings. ([@keyanzhang](https://github.com/keyanzhang) in [#6799](https://github.com/facebook/react/pull/6799))
- Stop validating props at mount time, only validate at element creation. ([@keyanzhang](https://github.com/keyanzhang) in [#6824](https://github.com/facebook/react/pull/6824))
- New invariant providing actionable error in missing instance case. ([@yungsters](https://github.com/yungsters) in [#6990](https://github.com/facebook/react/pull/6990))
- Add `React.PropTypes.symbol` to support ES2015 Symbols as props. ([@puradox](https://github.com/puradox) in [#6377](https://github.com/facebook/react/pull/6377))
- Fix incorrect coercion of ref or key that are undefined in development ([@gaearon](https://github.com/gaearon) in [#6880](https://github.com/facebook/react/pull/6880))
- Fix a false positive when passing other element’s props to cloneElement ([@ericmatthys](https://github.com/ericmatthys) in [#6268](https://github.com/facebook/react/pull/6268))
- Warn if you attempt to define `childContextTypes` on a functional component ([@Aweary](https://github.com/Aweary) in [#6933](https://github.com/facebook/react/pull/6933))

### React DOM
- Add warning for unknown properties on DOM elements. ([@jimfb](https://github.com/jimfb) in [#6800](https://github.com/facebook/react/pull/6800), [@gm758](https://github.com/gm758) in [#7152](https://github.com/facebook/react/pull/7152))
- Properly remove attributes from custom elements. ([@grassator](https://github.com/grassator) in [#6748](https://github.com/facebook/react/pull/6748))
- Fix invalid unicode escape in attribute name regular expression. ([@nbjahan](https://github.com/nbjahan) in [#6772](https://github.com/facebook/react/pull/6772))
- Add `onLoad` handling to `<link>` element. ([@roderickhsiao](https://github.com/roderickhsiao) in [#6815](https://github.com/facebook/react/pull/6815))
- Add `onError` handling to `<source>` element. ([@wadahiro](https://github.com/wadahiro) in [#6941](https://github.com/facebook/react/pull/6941))
- Handle `value` and `defaultValue` more accurately in the DOM. ([@jimfb](https://github.com/jimfb) in [#6406](https://github.com/facebook/react/pull/6406))
- Fix events issue in environments with mutated `Object.prototype`. ([@Weizenlol](https://github.com/Weizenlol) in [#6886](https://github.com/facebook/react/pull/6886))
- Fix issue where `is="null"` ended up in the DOM in Firefox. ([@darobin](https://github.com/darobin) in [#6896](https://github.com/facebook/react/pull/6896))
- Improved performance of text escaping by using [escape-html](https://github.com/component/escape-html). ([@aickin](https://github.com/aickin) in [#6862](https://github.com/facebook/react/pull/6862))
- Fix issue with `dangerouslySetInnerHTML` and SVG in Internet Explorer. ([@joshhunt](https://github.com/joshhunt) in [#6982](https://github.com/facebook/react/pull/6982))
- Fix issue with `<textarea>` placeholders. ([@jimfb](https://github.com/jimfb) in [#7002](https://github.com/facebook/react/pull/7002))
- Fix controlled vs uncontrolled detection of `<input type="radio"/>`. ([@jimfb](https://github.com/jimfb) in [#7003](https://github.com/facebook/react/pull/7003))
- Improve performance of updating text content. ([@trueadm](https://github.com/trueadm) in [#7005](https://github.com/facebook/react/pull/7005))
- Ensure controlled `<select>` components behave the same on initial render as they do on updates. ([@yiminghe](https://github.com/yiminghe) in [#5362](https://github.com/facebook/react/pull/5362))

### React Perf Add-on
- Add `isRunning()` API. ([@nfcampos](https://github.com/nfcampos) in [#6763](https://github.com/facebook/react/pull/6763))
- Improve accuracy of lifecycle hook timing. ([@gaearon](https://github.com/gaearon) in [#6858](https://github.com/facebook/react/pull/6858))
- Fix internal errors when using ReactPerf with portal components. ([@gaearon](https://github.com/gaearon) in [#6860](https://github.com/facebook/react/pull/6860))
- Fix performance regression. ([@spicyj](https://github.com/spicyj) in [#6770](https://github.com/facebook/react/pull/6770))
- Add warning that ReactPerf is not enabled in production. ([@sashashakun](https://github.com/sashashakun) in [#6884](https://github.com/facebook/react/pull/6884))

### React CSSTransitionGroup Add-on
- Fix timing issue with `null` node. ([@keyanzhang](https://github.com/keyanzhang) in [#6958](https://github.com/facebook/react/pull/6958))

### React Native Renderer
- Dependencies on React Native modules use CommonJS requires instead of providesModule. ([@davidaurelio](https://github.com/davidaurelio) in [#6715](https://github.com/facebook/react/pull/6715))


## 15.1.0 (May 20, 2016)

### React
- Ensure we're using the latest `object-assign`, which has protection against a non-spec-compliant native `Object.assign`. ([@zpao](https://github.com/zpao) in [#6681](https://github.com/facebook/react/pull/6681))
- Add a new warning to communicate that `props` objects passed to `createElement` must be plain objects. ([@richardscarrott](https://github.com/richardscarrott) in [#6134](https://github.com/facebook/react/pull/6134))
- Fix a batching bug resulting in some lifecycle methods incorrectly being called multiple times. ([@spicyj](https://github.com/spicyj) in [#6650](https://github.com/facebook/react/pull/6650))

### React DOM
- Fix regression in custom elements support. ([@jscissr](https://github.com/jscissr) in [#6570](https://github.com/facebook/react/pull/6570))
- Stop incorrectly warning about using `onScroll` event handler with server rendering. ([@Aweary](https://github.com/Aweary) in [#6678](https://github.com/facebook/react/pull/6678))
- Fix grammar in the controlled input warning. ([@jakeboone02](https://github.com/jakeboone02) in [#6657](https://github.com/facebook/react/pull/6657))
- Fix issue preventing `<object>` nodes from being able to read `<param>` nodes in IE. ([@syranide](https://github.com/syranide) in [#6691](https://github.com/facebook/react/pull/6691))
- Fix issue resulting in crash when using experimental error boundaries with server rendering. ([@jimfb](https://github.com/jimfb) in [#6694](https://github.com/facebook/react/pull/6694))
- Add additional information to the controlled input warning. ([@borisyankov](https://github.com/borisyankov) in [#6341](https://github.com/facebook/react/pull/6341))

### React Perf Add-on
- Completely rewritten to collect data more accurately and to be easier to maintain. ([@gaearon](https://github.com/gaearon) in [#6647](https://github.com/facebook/react/pull/6647), [#6046](https://github.com/facebook/react/pull/6046))

### React Native Renderer
- Remove some special cases for platform specific branching. ([@sebmarkbage](https://github.com/sebmarkbage) in [#6660](https://github.com/facebook/react/pull/6660))
- Remove use of `merge` utility. ([@sebmarkbage](https://github.com/sebmarkbage) in [#6634](https://github.com/facebook/react/pull/6634))
- Renamed some modules to better indicate usage ([@javache](https://github.com/javache) in [#6643](https://github.com/facebook/react/pull/6643))


## 15.0.2 (April 29, 2016)

### React
- Removed extraneous files from npm package. ([@gaearon](https://github.com/gaearon) in [#6388](https://github.com/facebook/react/pull/6388))
- Ensure `componentWillUnmount` is only called once. ([@jimfb](https://github.com/jimfb) in [#6613](https://github.com/facebook/react/pull/6613))

### ReactDOM
- Fixed bug resulting in disabled buttons responding to mouse events in IE. ([@nhunzaker](https://github.com/nhunzaker) in [#6215](https://github.com/facebook/react/pull/6215))
- Ensure `<option>`s are correctly selected when inside `<optgroup>`. ([@trevorsmith](https://github.com/trevorsmith) in [#6442](https://github.com/facebook/react/pull/6442))
- Restore support for rendering into a shadow root. ([@Wildhoney](https://github.com/Wildhoney) in [#6462](https://github.com/facebook/react/pull/6462))
- Ensure nested `<body>` elements are caught when warning for invalid markup. ([@keyanzhang](https://github.com/keyanzhang) in [#6469](https://github.com/facebook/react/pull/6469))
- Improve warning when encountering multiple elements with the same key. ([@hkal](https://github.com/hkal) in [#6500](https://github.com/facebook/react/pull/6500))

### React TestUtils Add-on
- Ensure that functional components do not have an owner. ([@gaearon](https://github.com/gaearon) in [#6362](https://github.com/facebook/react/pull/6362))
- Handle invalid arguments to `scryRenderedDOMComponentsWithClass` better. ([@ipeters90](https://github.com/ipeters90) in [#6529](https://github.com/facebook/react/pull/6529))

### React Perf Add-on
- Ignore DOM operations that occur outside the batch operation. ([@gaearon](https://github.com/gaearon) in [#6516](https://github.com/facebook/react/pull/6516))

### React Native Renderer
- These files are now shipped inside the React npm package. They have no impact on React core or ReactDOM.


## 15.0.1 (April 8, 2016)

### React
- Restore `React.__spread` API to unbreak code compiled with some tools making use of this undocumented API. It is now officially deprecated. ([@zpao](https://github.com/zpao) in [#6444](https://github.com/facebook/react/pull/6444))

### ReactDOM
- Fixed issue resulting in loss of cursor position in controlled inputs. ([@spicyj](https://github.com/spicyj) in [#6449](https://github.com/facebook/react/pull/6449))


## 15.0.0 (April 7, 2016)

### Major changes

- **Initial render now uses `document.createElement` instead of generating HTML.** Previously we would generate a large string of HTML and then set `node.innerHTML`. At the time, this was decided to be faster than using `document.createElement` for the majority of cases and browsers that we supported. Browsers have continued to improve and so overwhelmingly this is no longer true. By using `createElement` we can make other parts of React faster. ([@spicyj](https://github.com/spicyj) in [#5205](https://github.com/facebook/react/pull/5205))
- **`data-reactid` is no longer on every node.** As a result of using `document.createElement`, we can prime the node cache as we create DOM nodes, allowing us to skip a potential lookup (which used the `data-reactid` attribute). Root nodes will have a `data-reactroot` attribute and server generated markup will still contain `data-reactid`. ([@spicyj](https://github.com/spicyj) in [#5205](https://github.com/facebook/react/pull/5205))
- **No more extra `<span>`s.** ReactDOM will now render plain text nodes interspersed with comment nodes that are used for demarcation. This gives us the same ability to update individual pieces of text, without creating extra nested nodes. If you were targeting these `<span>`s in your CSS, you will need to adjust accordingly. You can always render them explicitly in your components. ([@mwiencek](https://github.com/mwiencek) in [#5753](https://github.com/facebook/react/pull/5753))
- **Rendering `null` now uses comment nodes.** Previously `null` would render to `<noscript>` elements. We now use comment nodes. This may cause issues if making use of `:nth-child` CSS selectors. While we consider this rendering behavior an implementation detail of React, it's worth noting the potential problem. ([@spicyj](https://github.com/spicyj) in [#5451](https://github.com/facebook/react/pull/5451))
- **Functional components can now return `null`.** We added support for [defining stateless components as functions](/react/blog/2015/09/10/react-v0.14-rc1.html#stateless-function-components) in React 0.14. However, React 0.14 still allowed you to define a class component without extending `React.Component` or using `React.createClass()`, so [we couldn’t reliably tell if your component is a function or a class](https://github.com/facebook/react/issues/5355), and did not allow returning `null` from it. This issue is solved in React 15, and you can now return `null` from any component, whether it is a class or a function. ([@jimfb](https://github.com/jimfb) in [#5884](https://github.com/facebook/react/pull/5884))
- **Improved SVG support.** All SVG tags are now fully supported. (Uncommon SVG tags are not present on the `React.DOM` element helper, but JSX and `React.createElement` work on all tag names.) All SVG attributes that are implemented by the browsers should be supported too. If you find any attributes that we have missed, please [let us know in this issue](https://github.com/facebook/react/issues/1657). ([@zpao](https://github.com/zpao) in [#6243](https://github.com/facebook/react/pull/6243))

### Breaking changes

- **No more extra `<span>`s.**
- **`React.cloneElement()` now resolves `defaultProps`.** We fixed a bug in `React.cloneElement()` that some components may rely on. If some of the `props` received by `cloneElement()` are `undefined`, it used to return an element with `undefined` values for those props. We’re changing it to be consistent with `createElement()`. Now any `undefined` props passed to `cloneElement()` are resolved to the corresponding component’s `defaultProps`. ([@truongduy134](https://github.com/truongduy134) in [#5997](https://github.com/facebook/react/pull/5997))
- **`ReactPerf.getLastMeasurements()` is opaque.** This change won’t affect applications but may break some third-party tools. We are [revamping `ReactPerf` implementation](https://github.com/facebook/react/pull/6046) and plan to release it during the 15.x cycle. The internal performance measurement format is subject to change so, for the time being, we consider the return value of `ReactPerf.getLastMeasurements()` an opaque data structure that should not be relied upon. ([@gaearon](https://github.com/gaearon) in [#6286](https://github.com/facebook/react/pull/6286))

#### Removed deprecations

These deprecations were introduced nine months ago in v0.14 with a warning and are removed:

- Deprecated APIs are removed from the `React` top-level export: `findDOMNode`, `render`, `renderToString`, `renderToStaticMarkup`, and `unmountComponentAtNode`. As a reminder, they are now available on `ReactDOM` and `ReactDOMServer`. ([@jimfb](https://github.com/jimfb) in [#5832](https://github.com/facebook/react/pull/5832))
- Deprecated addons are removed: `batchedUpdates` and `cloneWithProps`. ([@jimfb](https://github.com/jimfb) in [#5859](https://github.com/facebook/react/pull/5859), [@zpao](https://github.com/zpao) in [#6016](https://github.com/facebook/react/pull/6016))
- Deprecated component instance methods are removed: `setProps`, `replaceProps`, and `getDOMNode`. ([@jimfb](https://github.com/jimfb) in [#5570](https://github.com/facebook/react/pull/5570))
- Deprecated CommonJS `react/addons` entry point is removed. As a reminder, you should use separate `react-addons-*` packages instead. This only applies if you use the CommonJS builds. ([@gaearon](https://github.com/gaearon) in [#6285](https://github.com/facebook/react/pull/6285))
- Passing `children` to void elements like `<input>` was deprecated, and now throws an error. ([@jonhester](https://github.com/jonhester) in [#3372](https://github.com/facebook/react/pull/3372))
- React-specific properties on DOM `refs` (e.g. `this.refs.div.props`) were deprecated, and are removed now. ([@jimfb](https://github.com/jimfb) in [#5495](https://github.com/facebook/react/pull/5495))

### New deprecations, introduced with a warning

Each of these changes will continue to work as before with a new warning until the release of React 16 so you can upgrade your code gradually.

- `LinkedStateMixin` and `valueLink` are now deprecated due to very low popularity. If you need this, you can use a wrapper component that implements the same behavior: [react-linked-input](https://www.npmjs.com/package/react-linked-input). ([@jimfb](https://github.com/jimfb) in [#6127](https://github.com/facebook/react/pull/6127))
- Future versions of React will treat `<input value={null}>` as a request to clear the input. However, React 0.14 has been ignoring `value={null}`. React 15 warns you on a `null` input value and offers you to clarify your intention. To fix the warning, you may explicitly pass an empty string to clear a controlled input, or pass `undefined` to make the input uncontrolled. ([@antoaravinth](https://github.com/antoaravinth) in [#5048](https://github.com/facebook/react/pull/5048))
- `ReactPerf.printDOM()` was renamed to `ReactPerf.printOperations()`, and `ReactPerf.getMeasurementsSummaryMap()` was renamed to `ReactPerf.getWasted()`. ([@gaearon](https://github.com/gaearon) in [#6287](https://github.com/facebook/react/pull/6287))

### New helpful warnings

- If you use a minified copy of the _development_ build, React DOM kindly encourages you to use the faster production build instead. ([@spicyj](https://github.com/spicyj) in [#5083](https://github.com/facebook/react/pull/5083))
- React DOM: When specifying a unit-less CSS value as a string, a future version will not add `px` automatically. This version now warns in this case (ex: writing `style={{'{{'}}width: '300'}}`. Unitless *number* values like `width: 300` are unchanged. ([@pluma](https://github.com/pluma) in [#5140](https://github.com/facebook/react/pull/5140))
- Synthetic Events will now warn when setting and accessing properties (which will not get cleared appropriately), as well as warn on access after an event has been returned to the pool. ([@kentcdodds](https://github.com/kentcdodds) in [#5940](https://github.com/facebook/react/pull/5940) and [@koba04](https://github.com/koba04) in [#5947](https://github.com/facebook/react/pull/5947))
- Elements will now warn when attempting to read `ref` and `key` from the props. ([@prometheansacrifice](https://github.com/prometheansacrifice) in [#5744](https://github.com/facebook/react/pull/5744))
- React will now warn if you pass a different `props` object to `super()` in the constructor. ([@prometheansacrifice](https://github.com/prometheansacrifice) in [#5346](https://github.com/facebook/react/pull/5346))
- React will now warn if you call `setState()` inside `getChildContext()`. ([@raineroviir](https://github.com/raineroviir) in [#6121](https://github.com/facebook/react/pull/6121))
- React DOM now attempts to warn for mistyped event handlers on DOM elements, such as `onclick` which should be `onClick`. ([@ali](https://github.com/ali) in [#5361](https://github.com/facebook/react/pull/5361))
- React DOM now warns about `NaN` values in `style`. ([@jontewks](https://github.com/jontewks) in [#5811](https://github.com/facebook/react/pull/5811))
- React DOM now warns if you specify both `value` and `defaultValue` for an input. ([@mgmcdermott](https://github.com/mgmcdermott) in [#5823](https://github.com/facebook/react/pull/5823))
- React DOM now warns if an input switches between being controlled and uncontrolled. ([@TheBlasfem](https://github.com/TheBlasfem) in [#5864](https://github.com/facebook/react/pull/5864))
- React DOM now warns if you specify `onFocusIn` or `onFocusOut` handlers as they are unnecessary in React. ([@jontewks](https://github.com/jontewks) in [#6296](https://github.com/facebook/react/pull/6296))
- React now prints a descriptive error message when you pass an invalid callback as the last argument to `ReactDOM.render()`, `this.setState()`, or `this.forceUpdate()`. ([@conorhastings](https://github.com/conorhastings) in [#5193](https://github.com/facebook/react/pull/5193) and [@gaearon](https://github.com/gaearon) in [#6310](https://github.com/facebook/react/pull/6310))
- Add-Ons: `TestUtils.Simulate()` now prints a helpful message if you attempt to use it with shallow rendering. ([@conorhastings](https://github.com/conorhastings) in [#5358](https://github.com/facebook/react/pull/5358))
- PropTypes: `arrayOf()` and `objectOf()` provide better error messages for invalid arguments. ([@chicoxyzzy](https://github.com/chicoxyzzy) in [#5390](https://github.com/facebook/react/pull/5390))

### Notable bug fixes

- Fixed multiple small memory leaks. ([@spicyj](https://github.com/spicyj) in [#4983](https://github.com/facebook/react/pull/4983) and [@victor-homyakov](https://github.com/victor-homyakov) in [#6309](https://github.com/facebook/react/pull/6309))
- Input events are handled more reliably in IE 10 and IE 11; spurious events no longer fire when using a placeholder. ([@jquense](https://github.com/jquense) in [#4051](https://github.com/facebook/react/pull/4051))
- The `componentWillReceiveProps()` lifecycle method is now consistently called when `context` changes. ([@milesj](https://github.com/milesj) in [#5787](https://github.com/facebook/react/pull/5787))
- `React.cloneElement()` doesn’t append slash to an existing `key` when used inside `React.Children.map()`. ([@ianobermiller](https://github.com/ianobermiller) in [#5892](https://github.com/facebook/react/pull/5892))
- React DOM now supports the `cite` and `profile` HTML attributes. ([@AprilArcus](https://github.com/AprilArcus) in [#6094](https://github.com/facebook/react/pull/6094) and [@saiichihashimoto](https://github.com/saiichihashimoto) in [#6032](https://github.com/facebook/react/pull/6032))
- React DOM now supports `cssFloat`, `gridRow` and `gridColumn` CSS properties. ([@stevenvachon](https://github.com/stevenvachon) in [#6133](https://github.com/facebook/react/pull/6133) and  [@mnordick](https://github.com/mnordick) in [#4779](https://github.com/facebook/react/pull/4779))
- React DOM now correctly handles `borderImageOutset`, `borderImageWidth`, `borderImageSlice`, `floodOpacity`, `strokeDasharray`, and `strokeMiterlimit` as unitless CSS properties. ([@rofrischmann](https://github.com/rofrischmann) in [#6210](https://github.com/facebook/react/pull/6210) and [#6270](https://github.com/facebook/react/pull/6270))
- React DOM now supports the `onAnimationStart`, `onAnimationEnd`, `onAnimationIteration`, `onTransitionEnd`, and `onInvalid` events. Support for `onLoad` has been added to `object` elements. ([@tomduncalf](https://github.com/tomduncalf) in [#5187](https://github.com/facebook/react/pull/5187),  [@milesj](https://github.com/milesj) in [#6005](https://github.com/facebook/react/pull/6005), and [@ara4n](https://github.com/ara4n) in [#5781](https://github.com/facebook/react/pull/5781))
- React DOM now defaults to using DOM attributes instead of properties, which fixes a few edge case bugs. Additionally the nullification of values (ex: `href={null}`) now results in the forceful removal, no longer trying to set to the default value used by browsers in the absence of a value. ([@syranide](https://github.com/syranide) in [#1510](https://github.com/facebook/react/pull/1510))
- React DOM does not mistakingly coerce `children` to strings for Web Components. ([@jimfb](https://github.com/jimfb) in [#5093](https://github.com/facebook/react/pull/5093))
- React DOM now correctly normalizes SVG `<use>` events. ([@edmellum](https://github.com/edmellum) in [#5720](https://github.com/facebook/react/pull/5720))
- React DOM does not throw if a `<select>` is unmounted while its `onChange` handler is executing. ([@sambev](https://github.com/sambev) in [#6028](https://github.com/facebook/react/pull/6028))
- React DOM does not throw in Windows 8 apps. ([@Andrew8xx8](https://github.com/Andrew8xx8) in [#6063](https://github.com/facebook/react/pull/6063))
- React DOM does not throw when asynchronously unmounting a child with a `ref`. ([@yiminghe](https://github.com/yiminghe) in [#6095](https://github.com/facebook/react/pull/6095))
- React DOM no longer forces synchronous layout because of scroll position tracking. ([@syranide](https://github.com/syranide) in [#2271](https://github.com/facebook/react/pull/2271))
- `Object.is` is used in a number of places to compare values, which leads to fewer false positives, especially involving `NaN`. In particular, this affects the `shallowCompare` add-on. ([@chicoxyzzy](https://github.com/chicoxyzzy) in [#6132](https://github.com/facebook/react/pull/6132))
- Add-Ons: ReactPerf no longer instruments adding or removing an event listener because they don’t really touch the DOM due to event delegation. ([@antoaravinth](https://github.com/antoaravinth) in [#5209](https://github.com/facebook/react/pull/5209))

### Other improvements

- React now uses `loose-envify` instead of `envify` so it installs fewer transitive dependencies. ([@qerub](https://github.com/qerub) in [#6303](https://github.com/facebook/react/pull/6303))
- Shallow renderer now exposes `getMountedInstance()`. ([@glenjamin](https://github.com/glenjamin) in [#4918](https://github.com/facebook/react/pull/4918))
- Shallow renderer now returns the rendered output from `render()`. ([@simonewebdesign](https://github.com/simonewebdesign) in [#5411](https://github.com/facebook/react/pull/5411))
- React no longer depends on ES5 *shams* for `Object.create` and `Object.freeze` in older environments. It still, however, requires ES5 *shims* in those environments. ([@dgreensp](https://github.com/dgreensp) in [#4959](https://github.com/facebook/react/pull/4959))
- React DOM now allows `data-` attributes with names that start with numbers. ([@nLight](https://github.com/nLight) in [#5216](https://github.com/facebook/react/pull/5216))
- React DOM adds a new `suppressContentEditableWarning` prop for components like [Draft.js](https://facebook.github.io/draft-js/) that intentionally manage `contentEditable` children with React. ([@mxstbr](https://github.com/mxstbr) in [#6112](https://github.com/facebook/react/pull/6112))
- React improves the performance for `createClass()` on complex specs. ([@spicyj](https://github.com/spicyj) in [#5550](https://github.com/facebook/react/pull/5550))


## 0.14.8 (March 29, 2016)

### React
- Fixed memory leak when rendering on the server

## 0.14.7 (January 28, 2016)

### React
- Fixed bug with `<option>` tags when using `dangerouslySetInnerHTML`
- Fixed memory leak in synthetic event system

### React TestUtils Add-on
- Fixed bug with calling `setState` in `componentWillMount` when using shallow rendering


## 0.14.6 (January 6, 2016)

### React
- Updated `fbjs` dependency to pick up change affecting handling of undefined document.


## 0.14.5 (December 29, 2015)

### React
- More minor internal changes for better compatibility with React Native


## 0.14.4 (December 29, 2015)

### React
- Minor internal changes for better compatibility with React Native

### React DOM
- The `autoCapitalize` and `autoCorrect` props are now set as attributes in the DOM instead of properties to improve cross-browser compatibility
- Fixed bug with controlled `<select>` elements not handling updates properly

### React Perf Add-on
- Some DOM operation names have been updated for clarity in the output of `.printDOM()`


## 0.14.3 (November 18, 2015)

### React DOM
- Added support for `nonce` attribute for `<script>` and `<style>` elements
- Added support for `reversed` attribute for `<ol>` elements

### React TestUtils Add-on
- Fixed bug with shallow rendering and function refs

### React CSSTransitionGroup Add-on
- Fixed bug resulting in timeouts firing incorrectly when mounting and unmounting rapidly

### React on Bower
- Added `react-dom-server.js` to expose `renderToString` and `renderToStaticMarkup` for usage in the browser


## 0.14.2 (November 2, 2015)

### React DOM
- Fixed bug with development build preventing events from firing in some versions of Internet Explorer & Edge
- Fixed bug with development build when using es5-sham in older versions of Internet Explorer
- Added support for `integrity` attribute
- Fixed bug resulting in `children` prop being coerced to a string for custom elements, which was not the desired behavior
- Moved `react` from `dependencies` to `peerDependencies` to match expectations and align with `react-addons-*` packages


## 0.14.1 (October 28, 2015)

### React DOM
- Fixed bug where events wouldn't fire in old browsers when using React in development mode
- Fixed bug preventing use of `dangerouslySetInnerHTML` with Closure Compiler Advanced mode
- Added support for `srcLang`, `default`, and `kind` attributes for `<track>` elements
- Added support for `color` attribute
- Ensured legacy `.props` access on DOM nodes is updated on re-renders

### React TestUtils Add-on
- Fixed `scryRenderedDOMComponentsWithClass` so it works with SVG

### React CSSTransitionGroup Add-on
- Fix bug preventing `0` to be used as a timeout value

### React on Bower
- Added `react-dom.js` to `main` to improve compatibility with tooling


## 0.14.0 (October 7, 2015)

### Major changes

- Split the main `react` package into two: `react` and `react-dom`.  This paves the way to writing components that can be shared between the web version of React and React Native.  This means you will need to include both files and some functions have been moved from `React` to `ReactDOM`.
- Addons have been moved to separate packages (`react-addons-clone-with-props`, `react-addons-create-fragment`, `react-addons-css-transition-group`, `react-addons-linked-state-mixin`, `react-addons-perf`, `react-addons-pure-render-mixin`, `react-addons-shallow-compare`, `react-addons-test-utils`, `react-addons-transition-group`, `react-addons-update`, `ReactDOM.unstable_batchedUpdates`).
- Stateless functional components - React components were previously created using React.createClass or using ES6 classes.  This release adds a [new syntax](https://facebook.github.io/react/docs/reusable-components.html#stateless-functions) where a user defines a single [stateless render function](https://facebook.github.io/react/docs/reusable-components.html#stateless-functions) (with one parameter: `props`) which returns a JSX element, and this function may be used as a component.
- Refs to DOM components as the DOM node itself. Previously the only useful thing you can do with a DOM component is call `getDOMNode()` to get the underlying DOM node. Starting with this release, a ref to a DOM component _is_ the actual DOM node. **Note that refs to custom (user-defined) components work exactly as before; only the built-in DOM components are affected by this change.**


### Breaking changes

- `React.initializeTouchEvents` is no longer necessary and has been removed completely. Touch events now work automatically.
- Add-Ons: Due to the DOM node refs change mentioned above, `TestUtils.findAllInRenderedTree` and related helpers are no longer able to take a DOM component, only a custom component.
- The `props` object is now frozen, so mutating props after creating a component element is no longer supported. In most cases, [`React.cloneElement`](https://facebook.github.io/react/docs/react-api.html#cloneelement) should be used instead. This change makes your components easier to reason about and enables the compiler optimizations mentioned above.
- Plain objects are no longer supported as React children; arrays should be used instead. You can use the [`createFragment`](https://facebook.github.io/react/docs/create-fragment.html) helper to migrate, which now returns an array.
- Add-Ons: `classSet` has been removed. Use [classnames](https://github.com/JedWatson/classnames) instead.
- Web components (custom elements) now use native property names.  Eg: `class` instead of `className`.

### Deprecations

- `this.getDOMNode()` is now deprecated and `ReactDOM.findDOMNode(this)` can be used instead. Note that in the common case, `findDOMNode` is now unnecessary since a ref to the DOM component is now the actual DOM node.
- `setProps` and `replaceProps` are now deprecated. Instead, call ReactDOM.render again at the top level with the new props.
- ES6 component classes must now extend `React.Component` in order to enable stateless function components. The [ES3 module pattern](https://facebook.github.io/react/blog/2015/01/27/react-v0.13.0-beta-1.html#other-languages) will continue to work.
- Reusing and mutating a `style` object between renders has been deprecated. This mirrors our change to freeze the `props` object.
- Add-Ons: `cloneWithProps` is now deprecated. Use [`React.cloneElement`](https://facebook.github.io/react/docs/react-api.html#cloneelement) instead (unlike `cloneWithProps`, `cloneElement` does not merge `className` or `style` automatically; you can merge them manually if needed).
- Add-Ons: To improve reliability, `CSSTransitionGroup` will no longer listen to transition events. Instead, you should specify transition durations manually using props such as `transitionEnterTimeout={500}`.

### Notable enhancements

- Added `React.Children.toArray` which takes a nested children object and returns a flat array with keys assigned to each child. This helper makes it easier to manipulate collections of children in your `render` methods, especially if you want to reorder or slice `this.props.children` before passing it down. In addition, `React.Children.map` now returns plain arrays too.
- React uses `console.error` instead of `console.warn` for warnings so that browsers show a full stack trace in the console. (Our warnings appear when you use patterns that will break in future releases and for code that is likely to behave unexpectedly, so we do consider our warnings to be “must-fix” errors.)
- Previously, including untrusted objects as React children [could result in an XSS security vulnerability](http://danlec.com/blog/xss-via-a-spoofed-react-element). This problem should be avoided by properly validating input at the application layer and by never passing untrusted objects around your application code. As an additional layer of protection, [React now tags elements](https://github.com/facebook/react/pull/4832) with a specific [ES2015 (ES6) `Symbol`](http://www.2ality.com/2014/12/es6-symbols.html) in browsers that support it, in order to ensure that React never considers untrusted JSON to be a valid element. If this extra security protection is important to you, you should add a `Symbol` polyfill for older browsers, such as the one included by [Babel’s polyfill](http://babeljs.io/docs/usage/polyfill/).
- When possible, React DOM now generates XHTML-compatible markup.
- React DOM now supports these standard HTML attributes: `capture`, `challenge`, `inputMode`, `is`, `keyParams`, `keyType`, `minLength`, `summary`, `wrap`. It also now supports these non-standard attributes: `autoSave`, `results`, `security`.
- React DOM now supports these SVG attributes, which render into namespaced attributes: `xlinkActuate`, `xlinkArcrole`, `xlinkHref`, `xlinkRole`, `xlinkShow`, `xlinkTitle`, `xlinkType`, `xmlBase`, `xmlLang`, `xmlSpace`.
- The `image` SVG tag is now supported by React DOM.
- In React DOM, arbitrary attributes are supported on custom elements (those with a hyphen in the tag name or an `is="..."` attribute).
- React DOM now supports these media events on `audio` and `video` tags: `onAbort`, `onCanPlay`, `onCanPlayThrough`, `onDurationChange`, `onEmptied`, `onEncrypted`, `onEnded`, `onError`, `onLoadedData`, `onLoadedMetadata`, `onLoadStart`, `onPause`, `onPlay`, `onPlaying`, `onProgress`, `onRateChange`, `onSeeked`, `onSeeking`, `onStalled`, `onSuspend`, `onTimeUpdate`, `onVolumeChange`, `onWaiting`.
- Many small performance improvements have been made.
- Many warnings show more context than before.
- Add-Ons: A [`shallowCompare`](https://github.com/facebook/react/pull/3355) add-on has been added as a migration path for `PureRenderMixin` in ES6 classes.
- Add-Ons: `CSSTransitionGroup` can now use [custom class names](https://github.com/facebook/react/blob/48942b85/docs/docs/10.1-animation.md#custom-classes) instead of appending `-enter-active` or similar to the transition name.

### New helpful warnings

- React DOM now warns you when nesting HTML elements invalidly, which helps you avoid surprising errors during updates.
- Passing `document.body` directly as the container to `ReactDOM.render` now gives a warning as doing so can cause problems with browser extensions that modify the DOM.
- Using multiple instances of React together is not supported, so we now warn when we detect this case to help you avoid running into the resulting problems.

### Notable bug fixes

- Click events are handled by React DOM more reliably in mobile browsers, particularly in Mobile Safari.
- SVG elements are created with the correct namespace in more cases.
- React DOM now renders `<option>` elements with multiple text children properly and renders `<select>` elements on the server with the correct option selected.
- When two separate copies of React add nodes to the same document (including when a browser extension uses React), React DOM tries harder not to throw exceptions during event handling.
- Using non-lowercase HTML tag names in React DOM (e.g., `React.createElement('DIV')`) no longer causes problems, though we continue to recommend lowercase for consistency with the JSX tag name convention (lowercase names refer to built-in components, capitalized names refer to custom components).
- React DOM understands that these CSS properties are unitless and does not append “px” to their values: `animationIterationCount`, `boxOrdinalGroup`, `flexOrder`, `tabSize`, `stopOpacity`.
- Add-Ons: When using the test utils, `Simulate.mouseEnter` and `Simulate.mouseLeave` now work.
- Add-Ons: ReactTransitionGroup now correctly handles multiple nodes being removed simultaneously.


### React Tools / Babel

#### Breaking Changes

- The `react-tools` package and `JSXTransformer.js` browser file [have been deprecated](https://facebook.github.io/react/blog/2015/06/12/deprecating-jstransform-and-react-tools.html). You can continue using version `0.13.3` of both, but we no longer support them and recommend migrating to [Babel](http://babeljs.io/), which has built-in support for React and JSX.

#### New Features

- Babel 5.8.24 introduces **Inlining React elements:** The `optimisation.react.inlineElements` transform converts JSX elements to object literals like `{type: 'div', props: ...}` instead of calls to `React.createElement`.  This should only be enabled in production, since it disables some development warnings/checks.
- Babel 5.8.24 introduces **Constant hoisting for React elements:** The `optimisation.react.constantElements` transform hoists element creation to the top level for subtrees that are fully static, which reduces calls to `React.createElement` and the resulting allocations. More importantly, it tells React that the subtree hasn’t changed so React can completely skip it when reconciling.  This should only be enabled in production, since it disables some development warnings/checks.


## 0.13.3 (May 8, 2015)

### React Core

#### New Features

* Added `clipPath` element and attribute for SVG
* Improved warnings for deprecated methods in plain JS classes

#### Bug Fixes

* Loosened `dangerouslySetInnerHTML` restrictions so `{__html: undefined}` will no longer throw
* Fixed extraneous context warning with non-pure `getChildContext`
* Ensure `replaceState(obj)` retains prototype of `obj`

### React with Add-ons

### Bug Fixes

* Test Utils: Ensure that shallow rendering works when components define `contextTypes`


## 0.13.2 (April 18, 2015)

### React Core

#### New Features

* Added `strokeDashoffset`, `flexPositive`, `flexNegative` to the list of unitless CSS properties
* Added support for more DOM properties:
  * `scoped` - for `<style>` elements
  * `high`, `low`, `optimum` - for `<meter>` elements
  * `unselectable` - IE-specific property to prevent user selection

#### Bug Fixes

* Fixed a case where re-rendering after rendering null didn't properly pass context
* Fixed a case where re-rendering after rendering with `style={null}` didn't properly update `style`
* Update `uglify` dependency to prevent a bug in IE8
* Improved warnings

### React with Add-Ons

#### Bug Fixes

* Immutability Helpers: Ensure it supports `hasOwnProperty` as an object key

### React Tools

* Improve documentation for new options


## 0.13.1 (March 16, 2015)

### React Core

#### Bug Fixes

* Don't throw when rendering empty `<select>` elements
* Ensure updating `style` works when transitioning from `null`

### React with Add-Ons

#### Bug Fixes

* TestUtils: Don't warn about `getDOMNode` for ES6 classes
* TestUtils: Ensure wrapped full page components (`<html>`, `<head>`, `<body>`) are treated as DOM components
* Perf: Stop double-counting DOM components

### React Tools

#### Bug Fixes

* Fix option parsing for `--non-strict-es6module`


## 0.13.0 (March 10, 2015)

### React Core

#### Breaking Changes

* Deprecated patterns that warned in 0.12 no longer work: most prominently, calling component classes without using JSX or React.createElement and using non-component functions with JSX or createElement
* Mutating `props` after an element is created is deprecated and will cause warnings in development mode; future versions of React will incorporate performance optimizations assuming that props aren't mutated
* Static methods (defined in `statics`) are no longer autobound to the component class
* `ref` resolution order has changed slightly such that a ref to a component is available immediately after its `componentDidMount` method is called; this change should be observable only if your component calls a parent component's callback within your `componentDidMount`, which is an anti-pattern and should be avoided regardless
* Calls to `setState` in life-cycle methods are now always batched and therefore asynchronous. Previously the first call on the first mount was synchronous.
* `setState` and `forceUpdate` on an unmounted component now warns instead of throwing. That avoids a possible race condition with Promises.
* Access to most internal properties has been completely removed, including `this._pendingState` and `this._rootNodeID`.

#### New Features

* Support for using ES6 classes to build React components; see the [v0.13.0 beta 1 notes](https://facebook.github.io/react/blog/2015/01/27/react-v0.13.0-beta-1.html) for details.
* Added new top-level API `React.findDOMNode(component)`, which should be used in place of `component.getDOMNode()`. The base class for ES6-based components will not have `getDOMNode`. This change will enable some more patterns moving forward.
* Added a new top-level API `React.cloneElement(el, props)` for making copies of React elements – see the [v0.13 RC2 notes](https://facebook.github.io/react/blog/2015/03/03/react-v0.13-rc2.html#react.cloneelement) for more details.
* New `ref` style, allowing a callback to be used in place of a name: `<Photo ref={(c) => this._photo = c} />` allows you to reference the component with `this._photo` (as opposed to `ref="photo"` which gives `this.refs.photo`).
* `this.setState()` can now take a function as the first argument for transactional state updates, such as `this.setState((state, props) => ({count: state.count + 1}));` – this means that you no longer need to use `this._pendingState`, which is now gone.
* Support for iterators and immutable-js sequences as children.

#### Deprecations

* `ComponentClass.type` is deprecated. Just use `ComponentClass` (usually as `element.type === ComponentClass`).
* Some methods that are available on `createClass`-based components are removed or deprecated from ES6 classes (`getDOMNode`, `replaceState`, `isMounted`, `setProps`, `replaceProps`).

### React with Add-Ons

#### New Features

* [`React.addons.createFragment` was added](https://facebook.github.io/react/docs/create-fragment.html) for adding keys to entire sets of children.

#### Deprecations

* `React.addons.classSet` is now deprecated. This functionality can be replaced with several freely available modules. [classnames](https://www.npmjs.com/package/classnames) is one such module.
* Calls to `React.addons.cloneWithProps` can be migrated to use `React.cloneElement` instead – make sure to merge `style` and `className` manually if desired.

### React Tools

#### Breaking Changes

* When transforming ES6 syntax, `class` methods are no longer enumerable by default, which requires `Object.defineProperty`; if you support browsers such as IE8, you can pass `--target es3` to mirror the old behavior

#### New Features

* `--target` option is available on the jsx command, allowing users to specify and ECMAScript version to target.
  * `es5` is the default.
  * `es3` restores the previous default behavior. An additional transform is added here to ensure the use of reserved words as properties is safe (eg `this.static` will become `this['static']` for IE8 compatibility).
* The transform for the call spread operator has also been enabled.

### JSXTransformer

#### Breaking Changes

* The return value of `transform` now contains `sourceMap` as a JS object already, not an instance of `SourceMapGenerator`.

### JSX

#### Breaking Changes
* A change was made to how some JSX was parsed, specifically around the use of `>` or `}` when inside an element. Previously it would be treated as a string but now it will be treated as a parse error. The [`jsx_orphaned_brackets_transformer`](https://www.npmjs.com/package/jsx_orphaned_brackets_transformer) package on npm can be used to find and fix potential issues in your JSX code.


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
* Made it possible to server render without React-related markup (`data-reactid`, `data-react-checksum`). This DOM will not be mountable by React. [Read the docs for `React.renderComponentToStaticMarkup`](https://facebook.github.io/react/docs/top-level-api.html#react.rendercomponenttostaticmarkup)
* Added support for more attributes:
  * `srcSet` for `<img>` to specify images at different pixel ratios
  * `textAnchor` for SVG

#### Bug Fixes
* Ensure all void elements don’t insert a closing tag into the markup.
* Ensure `className={false}` behaves consistently
* Ensure `this.refs` is defined, even if no refs are specified.

### Addons

* `update` function to deal with immutable data. [Read the docs](https://facebook.github.io/react/docs/update.html)

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

* Introduced a separate build with several "addons" which we think can help improve the React experience. We plan to deprecate this in the long-term, instead shipping each as standalone pieces. [Read more in the docs](https://facebook.github.io/react/docs/addons.html).

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
* `prop` improvements: validation and default values. [Read our blog post for details...](https://facebook.github.io/react/blog/2013/07/11/react-v0-4-prop-validation-and-default-values.html)
* Support for the `key` prop, which allows for finer control over reconciliation. [Read the docs for details...](https://facebook.github.io/react/docs/multiple-components.html)
* Removed `React.autoBind`. [Read our blog post for details...](https://facebook.github.io/react/blog/2013/07/02/react-v0-4-autobind-by-default.html)
* Improvements to forms. We've written wrappers around `<input>`, `<textarea>`, `<option>`, and `<select>` in order to standardize many inconsistencies in browser implementations. This includes support for `defaultValue`, and improved implementation of the `onChange` event, and circuit completion. [Read the docs for details...](https://facebook.github.io/react/docs/forms.html)
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
* Freeze our Esprima dependency.


## 0.3.2 (May 31, 2013)

### JSX

* Improved compatibility with other coding styles (specifically, multiple assignments with a single `var`).

### react-tools

* Switch from using the browserified build to shipping individual modules. This allows react-tools to be used with [browserify](https://github.com/substack/node-browserify).


## 0.3.1 (May 30, 2013)

### react-tools

* Fix bug in packaging resulting in broken module.


## 0.3.0 (May 29, 2013)

* Initial public release

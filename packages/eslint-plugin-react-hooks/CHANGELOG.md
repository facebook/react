## 5.2.0

- Support flat config ([@michaelfaith](https://github.com/michaelfaith) in [#30774](https://github.com/facebook/react/pull/30774))
- Convert the plugin to TypeScript and provide package type declarations ([@michaelfaith](https://github.com/michaelfaith) in [#32279](https://github.com/facebook/react/pull/32279), [#32283](https://github.com/facebook/react/pull/32283), [#32240](https://github.com/facebook/react/pull/32240), [#32400](https://github.com/facebook/react/pull/32400) and [@poteto](https://github.com/poteto) in [#32420](https://github.com/facebook/react/pull/32420))
- Fix false positive error in components with `do`/`while` loops ([@tyxla](https://github.com/tyxla) in [#31720](https://github.com/facebook/react/pull/31720))
- Detect issues in class properties ([@mjesun](https://github.com/mjesun) & [@ecraig12345](https://github.com/ecraig12345) in [#31823](https://github.com/facebook/react/pull/31823))

## 5.1.0

- Add support for `do`/`while` loops ([@tyxla](https://github.com/tyxla) in [#28714](https://github.com/facebook/react/pull/28714))
- Fix error when callback argument is an identifier with an `as` expression ([@mskelton](https://github.com/mskelton) in [#31119](https://github.com/facebook/react/pull/31119))

## 5.0.0

* **New Violations:** Component names now need to start with an uppercase letter instead of a non-lowercase letter. This means `_Button` or `_component` are no longer valid. ([@kassens](https://github.com/kassens)) in [#25162](https://github.com/facebook/react/pull/25162)

- Consider dispatch from `useActionState` stable. ([@eps1lon](https://github.com/eps1lon) in [#29665](https://github.com/facebook/react/pull/29665))
- Add support for ESLint v9. ([@eps1lon](https://github.com/eps1lon) in [#28773](https://github.com/facebook/react/pull/28773))
- Accept `as` expression in callback. ([@StyleShit](https://github.com/StyleShit) in [#28202](https://github.com/facebook/react/pull/28202))
- Accept `as` expressions in deps array. ([@StyleShit](https://github.com/StyleShit) in [#28189](https://github.com/facebook/react/pull/28189))
- Treat `React.use()` the same as `use()`. ([@kassens](https://github.com/kassens) in [#27769](https://github.com/facebook/react/pull/27769))
- Move `use()` lint to non-experimental. ([@kassens](https://github.com/kassens) in [#27768](https://github.com/facebook/react/pull/27768))
- Support Flow `as` expressions. ([@cpojer](https://github.com/cpojer) in [#27590](https://github.com/facebook/react/pull/27590))
- Allow `useEffect(fn, undefined)`. ([@kassens](https://github.com/kassens) in [#27525](https://github.com/facebook/react/pull/27525))
- Disallow hooks in async functions. ([@acdlite](https://github.com/acdlite) in [#27045](https://github.com/facebook/react/pull/27045))
- Rename experimental `useEvent` to `useEffectEvent`. ([@sebmarkbage](https://github.com/sebmarkbage) in [#25881](https://github.com/facebook/react/pull/25881))
- Lint for presence of `useEvent` functions in dependency lists. ([@poteto](https://github.com/poteto) in [#25512](https://github.com/facebook/react/pull/25512))
- Check `useEvent` references instead. ([@poteto](https://github.com/poteto) in [#25319](https://github.com/facebook/react/pull/25319))
- Update `RulesOfHooks` with `useEvent` rules. ([@poteto](https://github.com/poteto) in [#25285](https://github.com/facebook/react/pull/25285))

## 4.6.0

## 4.5.0

* Fix false positive error with large number of branches. ([@scyron6](https://github.com/scyron6) in [#24287](https://github.com/facebook/react/pull/24287))

## 4.4.0

* No changes, this was an automated release together with React 18.

## 4.3.0

* Support ESLint 8. ([@MichaelDeBoey](https://github.com/MichaelDeBoey) in [#22248](https://github.com/facebook/react/pull/22248))
* Fix a crash with an empty effect. ([@ChrisRu](https://github.com/ChrisRu) in [#20385](https://github.com/facebook/react/pull/20385))
* Improve the error message. ([@callmetwan](https://github.com/callmetwan) in [#20692](https://github.com/facebook/react/pull/20692))
* Handle optional chained methods as dependency. ([@AriPerkkio](https://github.com/AriPerkkio) in [#20247](https://github.com/facebook/react/pull/20247))
* Assume the new `useTransition` signature in the rule. ([@rickhanlonii](https://github.com/rickhanlonii) in [#20976](https://github.com/facebook/react/pull/20976))

## 4.2.0

* No changes, this was an automated release together with React 17.

## 4.1.2
* Fix a crash with the TypeScript 4.x parser. ([@eps1lon](https://github.com/eps1lon) in [#19815](https://github.com/facebook/react/pull/19815))

## 4.1.1
* Improve support for optional chaining. ([@pfongkye](https://github.com/pfongkye) in [#19680](https://github.com/facebook/react/pull/19680))
* Fix a false positive warning for TypeScript parameters. ([@NeoRaider](https://github.com/NeoRaider) in [#19751](https://github.com/facebook/react/pull/19751))

## 4.1.0
* **New Violations:** Warn when dependencies change on every render. ([@captbaritone](https://github.com/captbaritone) in [#19590](https://github.com/facebook/react/pull/19590))

## 4.0.8
* Fixes TypeScript `typeof` annotation to not be considered a dependency. ([@delca85](https://github.com/delca85) in [#19316](https://github.com/facebook/react/pull/19316))

## 4.0.7
* Fixes an overly coarse dependency suggestion. ([@gaearon](https://github.com/gaearon) in [#19313](https://github.com/facebook/react/pull/19313))

## 4.0.6
* Fix crashes and other bugs related to optional chaining. ([@gaearon](https://github.com/gaearon) in [#19273](https://github.com/facebook/react/pull/19273) and [#19275](https://github.com/facebook/react/pull/19275))

## 4.0.5
* Fix a crash when the dependency array has an empty element. ([@yeonjuan](https://github.com/yeonjuan) in [#19145](https://github.com/facebook/react/pull/19145))
* Fix a false positive warning that occurs with optional chaining. ([@fredvollmer](https://github.com/fredvollmer) in [#19061](https://github.com/facebook/react/pull/19061))

## 4.0.4
* Fix a false positive warning that occurs with optional chaining. ([@fredvollmer](https://github.com/fredvollmer) in [#19061](https://github.com/facebook/react/pull/19061))
* Support nullish coalescing and optional chaining. ([@yanneves](https://github.com/yanneves) in [#19008](https://github.com/facebook/react/pull/19008))

## 4.0.3
* Remove the heuristic that checks all Hooks ending with `Effect` due to too many false positives. ([@gaearon](https://github.com/gaearon) in [#19004](https://github.com/facebook/react/pull/19004))

## 4.0.2
* Prevent Hooks that have `Effect` in the middle from being considered effects. ([@surgeboris](https://github.com/surgeboris) in [#18907](https://github.com/facebook/react/pull/18907))

## 4.0.1
* Declare support for ESLint 7. ([@MichaelDeBoey](https://github.com/MichaelDeBoey) in [#18878](https://github.com/facebook/react/pull/18878))

## 4.0.0

* **New Violations:** Consider `PascalCase.useFoo()` calls as Hooks. ([@cyan33](https://github.com/cyan33) in [#18722](https://github.com/facebook/react/pull/18722))
* **New Violations:** Check callback body when it's not written inline. ([@gaearon](https://github.com/gaearon) in [#18435](https://github.com/facebook/react/pull/18435))
* **New Violations:** Check dependencies for all Hooks ending with `Effect`. ([@airjp73](https://github.com/airjp73) in [#18580](https://github.com/facebook/react/pull/18580))
* Add a way to enable the dangerous autofix. ([@gaearon](https://github.com/gaearon) in [#18437](https://github.com/facebook/react/pull/18437))
* Offer a more sensible suggestion when encountering an assignment. ([@Zzzen](https://github.com/Zzzen) in [#16784](https://github.com/facebook/react/pull/16784))
* Consider TypeScript casts of `useRef` as constant. ([@sophiebits](https://github.com/sophiebits) in [#18496](https://github.com/facebook/react/pull/18496))
* Add documentation. ([@ghmcadams](https://github.com/ghmcadams) in [#16607](https://github.com/facebook/react/pull/16607))

## 3.0.0

* **New Violations:** Forbid calling Hooks from classes. ([@ianobermiller](https://github.com/ianobermiller) in [#18341](https://github.com/facebook/react/pull/18341))
* Add a recommended config. ([@SimenB](https://github.com/SimenB) in [#14762](https://github.com/facebook/react/pull/14762))

## 2.5.0

* Fix a misleading error message in loops. ([@M-Izadmehr](https://github.com/M-Izadmehr) in [#16853](https://github.com/facebook/react/pull/16853))

## 2.4.0

* **New Violations:** Run checks for functions passed to `forwardRef`. ([@dprgarner](https://github.com/dprgarner) in [#17255](https://github.com/facebook/react/pull/17255))
* **New Violations:** Check for ref usage in any Hook containing the word `Effect`. ([@gaearon](https://github.com/gaearon) in [#17663](https://github.com/facebook/react/pull/17663))
* Disable dangerous autofix and use ESLint Suggestions API instead. ([@wdoug](https://github.com/wdoug) in [#17385](https://github.com/facebook/react/pull/17385))

## 2.0.0

* **New Violations:** Forbid calling Hooks at the top level. ([@gaearon](https://github.com/gaearon) in [#16455](https://github.com/facebook/react/pull/16455))
* Fix a crash when referencing arguments in arrow functions. ([@hristo-kanchev](https://github.com/hristo-kanchev) in [#16356](https://github.com/facebook/react/pull/16356))


## 1.x

The 1.x releases aren’t noted in this changelog, but you can find them in the [commit history](https://github.com/facebook/react/commits/main/packages/eslint-plugin-react-hooks).

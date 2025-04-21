## 19.1.0-rc.1 (April 21, 2025)

## eslint-plugin-react-hooks
* Temporarily disable ref access in render validation (#32839) by @poteto
* Fix type error with recommended config (#32666) by @niklasholm
* Merge rule from eslint-plugin-react-compiler into `react-hooks` plugin (#32416) by @michaelfaith
* Add dev dependencies for typescript migration (#32279) by @michaelfaith
* Support v9 context api (#32045) by @michaelfaith
* Support eslint 8+ flat plugin syntax out of the box for eslint-plugin-react-compiler (#32120) by @orta


## babel-plugin-react-compiler
* Support satisfies operator (#32742) by @rodrigofariow
* Fix inferEffectDependencies lint false positives (#32769) by @mofeiZ
* Fix hoisting of let declarations (#32724) by @mofeiZ
* Avoid failing builds when import specifiers conflict or shadow vars (#32663) by @mofeiZ
* Add Effect.ConditionallyMutateIterator (#32698) by @mofeiZ
* Add map and set constructors (#32697) by @mofeiZ
* Refactor similar CallExpression and MethodCall effect handling (#32696) by @mofeiZ
* mutableOnlyIfOperandsAreMutable does not apply when operands are globals (#32695) by @mofeiZ
* Optimize components declared with arrow function and implicit return and `compilationMode: 'infer'` (#31792) by @dimaMachina
* Don't insert hook guards in retry pipeline (#32665) by @mofeiZ
* Validate static components (#32683) by @josephsavona
* Hoist dependencies from functions more conservatively (#32616) by @mofeiZ
* Implement NumericLiteral as ObjectPropertyKey (#31791) by @dimaMachina
* Detect and throw on untransformed required features (#32512) by @mofeiZ
* Clean up retry pipeline: `fireRetry` flag -> compileMode (#32511) by @mofeiZ
* Avoid bailouts when inserting gating (#32598) by @mofeiZ
* Stop bailing out early for hoisted gated functions (#32597) by @mofeiZ
* Only fail gating hoisting check for referenced identifiers (#32596) by @mofeiZ
* More shapes for mixedreadonly (#32594) by @mofeiZ
* Infer mixedReadOnly for numeric and computed properties (#32593) by @mofeiZ
* Add shape for Array.from (#32522) by @mofeiZ
* Patch array and argument spread mutability (#32521) by @mofeiZ
* Repro for object spread and Array.from with mutable iterators (#32520) by @mofeiZ
* Make CompilerError compatible with reflection (#32539) by @poteto
* remove invariant to account for backedges (#32417) by @mofeiZ
* Represent array accesses with PropertyLoad (#32287) by @mofeiZ
* Clean up deadcode: DeriveMinimalDeps (non-hir fork) (#32104) by @mofeiZ
* Clean up deadcode: ReactiveFunctionValue (#32098) by @mofeiZ
* Remove redundant InferMutableContextVariables (#32097) by @mofeiZ
* Delete LoweredFunction.dependencies and hoisted instructions (#32096) by @mofeiZ
* Add simple walltime measurement (#32331) by @poteto
* Improve error messages for unhandled terminal and instruction kinds (#32324) by @inottn
* Handle TSInstantiationExpression in lowerExpression (#32302) by @inottn
* Fix invalid Array.map type (#32095) by @mofeiZ
* Rewrite invariant in InferReferenceEffects (#32093) by @mofeiZ
* Patch for JSX escape sequences in @babel/generator (#32131) by @mofeiZ
* `JSXText` emits incorrect with bracket (#32138) by @himself65
* Validation against calling impure functions (#31960) by @josephsavona
* Always target node (#32091) by @poteto
* Patch compilationMode:infer object method edge case (#32055) by @mofeiZ
* Generate ts defs (#31994) by @poteto
* Relax react peer dep requirement (#31915) by @poteto
* Allow type cast expressions with refs (#31871) by @josephsavona
* Add shape for global Object.keys (#31583) by @mofeiZ
* Context variables as dependencies (#31582) by @mofeiZ
* Optimize method calls w props receiver (#31775) by @josephsavona
* Fix dropped ref with spread props in InlineJsxTransform (#31726) by @jackpope
* Support for non-declatation for in/of iterators (#31710) by @mvitousek
* Support for context variable loop iterators (#31709) by @mvitousek
* Replace deprecated dependency in `eslint-plugin-react-compiler` (#31629) by @rakleed
* Prune all unused array destructure items during DCE (#31619) by @josephsavona
* Support enableRefAsProp in jsx transform (#31558) by @jackpope
* Clean up nested function context in DCE (#31202) by @mofeiZ
* Lower JSXMemberExpression with LoadLocal (#31201) by @mofeiZ
* Stop using function `dependencies` in propagateScopeDeps (#31200) by @mofeiZ
* Fix: ref.current now correctly reactive (#31521) by @mofeiZ
* Outline JSX with non-jsx children (#31442) by @gsathya
* Outline jsx with duplicate attributes (#31441) by @gsathya
* Store original and new prop names (#31440) by @gsathya
* Collect temporaries and optional chains from inner functions (#31346) by @mofeiZ
* Delete propagateScopeDeps (non-hir) (#31199) by @mofeiZ
* Stabilize compiler output: sort deps and decls by name (#31362) by @mofeiZ
* Rewrite scope dep/decl in inlineJsxTransform (#31431) by @mofeiZ
* Bugfix for hoistable deps for nested functions (#31345) by @mofeiZ
* Patch hoistability for ObjectMethods (#31197) by @mofeiZ
* Remove compiler runtime-compat fixture library (#31430) by @poteto
* Wrap inline jsx transform codegen in conditional (#31267) by @jackpope
* Check if local identifier is a hook when resolving globals (#31384) by @poteto
* Handle member expr as computed property (#31344) by @gsathya
* Fix to ref access check to ban ref?.current (#31360) by @mvitousek
* InlineJSXTransform transforms jsx inside function expressions (#31282) by @josephsavona

## Other
* Add shebang to banner (#32225) by @Jeremy-Hibiki
* remove terser from react-compiler-runtime build (#31326) by @henryqdineen

## react-codemod

This repository contains a collection of codemod scripts based on
[JSCodeshift](https://github.com/facebook/jscodeshift) that help update React
APIs.

### Setup & Run

  * `npm install -g react-codemod`
  * `react-codemod <codemod-script> <file>`
  * Use the `-d` option for a dry-run and use `-p` to print the output
    for comparison

### Included Scripts

`findDOMNode.js` updates `this.getDOMNode()` or `this.refs.foo.getDOMNode()`
calls inside of `React.createClass` components to `React.findDOMNode(foo)`. Note
that it will only look at code inside of `React.createClass` calls and only
update calls on the component instance or its refs. You can use this script to
update most calls to `getDOMNode` and then manually go through the remaining
calls.

  * `react-codemod findDOMNode <file>`

`pure-render-mixin.js` removes `PureRenderMixin` and inlines
`shouldComponentUpdate` so that the ES6 class transform can pick up the React
component and turn it into an ES6 class. NOTE: This currently only works if you
are using the master version (>0.13.1) of React as it is using
`React.addons.shallowCompare`

 * `react-codemod pure-render-mixin <file>`
 * If `--mixin-name=<name>` is specified it will look for the specified name
   instead of `PureRenderMixin`. Note that it is not possible to use a
   namespaced name for the mixin. `mixins: [React.addons.PureRenderMixin]` will
   not currently work.

`class.js` transforms `React.createClass` calls into ES6 classes.

  * `react-codemod class <file>`
  * If `--no-super-class=true` is specified it will not extend
    `React.Component` if `setState` and `forceUpdate` aren't being called in a
    class. We do recommend always extending from `React.Component`, especially
    if you are using or planning to use [Flow](http://flowtype.org/). Also make
    sure you are not calling `setState` anywhere outside of your component.

All scripts take an option `--no-explicit-require=true` if you don't have a
`require('React')` statement in your code files and if you access React as a
global.

### Explanation of the ES6 class transform

  * Ignore components with calls to deprecated APIs. This is very defensive, if
    the script finds any identifiers called `isMounted`, `getDOMNode`,
    `replaceProps`, `replaceState` or `setProps` it will skip the component.
  * Replaces `var A = React.createClass(spec)` with
    `class A (extends React.Component) {spec}`.
  * Pulls out all statics defined on `statics` plus the few special cased
    statics like `propTypes`, `childContextTypes`, `contextTypes` and
    `displayName` and assigns them after the class is created.
    `class A {}; A.foo = bar;`
  * Takes `getDefaultProps` and inlines it as a static `defaultProps`.
    If `getDefaultProps` is defined as a function with a single statement that
    returns an object, it optimizes and transforms
    `getDefaultProps() { return {foo: 'bar'}; }` into
    `A.defaultProps = {foo: 'bar'};`. If `getDefaultProps` contains more than
    one statement it will transform into a self-invoking function like this:
    `A.defaultProps = function() {…}();`. Note that this means that the function
    will be executed only a single time per app-lifetime. In practice this
    hasn't caused any issues – `getDefaultProps` should not contain any
    side-effects.
  * Binds class methods to the instance if methods are referenced without being
    called directly. It checks for `this.foo` but also traces variable
    assignments like `var self = this; self.foo`. It does not bind functions
    from the React API and ignores functions that are being called directly
    (unless it is both called directly and passed around to somewhere else)
  * Creates a constructor if necessary. This is necessary if either
    `getInitialState` exists in the `React.createClass` spec OR if functions
    need to be bound to the instance.
  * When `--no-super-class=true` is passed it only optionally extends
    `React.Component` when `setState` or `forceUpdate` are used within the
    class.

The constructor logic is as follows:
  * Call `super(props, context)` if the base class needs to be extended.
  * Bind all functions that are passed around,
    like `this.foo = this.foo.bind(this)`
  * Inline `getInitialState` (and remove `getInitialState` from the spec). It
    also updates access of `this.props.foo` to `props.foo` and adds `props` as
    argument to the constructor. This is necessary in the case when the base
    class does not need to be extended where `this.props` will only be set by
    React after the constructor has been run.
  * Changes `return StateObject` from `getInitialState` to assign `this.state`
    directly.

### Recast Options

Options to [recast](https://github.com/benjamn/recast)'s printer can be provided
through the `printOptions` command line argument

 * `react-codemod class <file> --printOptions='{"quote":"double"}'`

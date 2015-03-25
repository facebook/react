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

### Recast Options

Options to [recast](https://github.com/benjamn/recast)'s printer can be provided
through the `printOptions` command line argument

 * `react-codemod class <file> --printOptions='{"quote":"double"}'`

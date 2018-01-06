/**
 * The ReactDOM global object.
 *
 * @type {!Object}
 * @const
 * @suppress {duplicate}
 */
var ReactDOM = {};

/**
 * The current version of ReactDOM.
 *
 * @type {string}
 * @const
 */
ReactDOM.version;

/**
 * @param {React.Component} container
 * @param {Element} mountPoint
 * @param {Function=} opt_callback
 * @return {React.Component}
 */
ReactDOM.render = function(container, mountPoint, opt_callback) {};

/**
 * @param {Element} container
 * @return {boolean}
 */
ReactDOM.unmountComponentAtNode = function(container) {};

/**
 * @param {React.Component} component
 * @return {Element}
 */
ReactDOM.findDOMNode = function(component) {};

/**
 * @param {Function} callback Function which calls `setState`, `forceUpdate`, etc.
 * @param {*=} opt_a Optional argument to pass to the callback.
 * @param {*=} opt_b Optional argument to pass to the callback.
 * @param {*=} opt_c Optional argument to pass to the callback.
 * @param {*=} opt_d Optional argument to pass to the callback.
 * @param {*=} opt_e Optional argument to pass to the callback.
 * @param {*=} opt_f Optional argument to pass to the callback.
 */
ReactDOM.unstable_batchedUpdates = function(
  callback,
  opt_a,
  opt_b,
  opt_c,
  opt_d,
  opt_e,
  opt_f
) {};

/**
 * @param {React.Component} parentComponent The conceptual parent of this render tree.
 * @param {React.ReactElement} nextElement Component element to render.
 * @param {Element} container DOM element to render into.
 * @param {Function=} opt_callback function triggered on completion
 * @return {React.Component} Component instance rendered in `container`.
 */
ReactDOM.unstable_renderSubtreeIntoContainer = function(
  parentComponent,
  nextElement,
  container,
  opt_callback
) {};

ReactDOM.hydrate = function() {};
ReactDOM.createPortal = function() {};

/**
 * React event system creates plugins and event properties dynamically.
 * These externs are needed when consuming React as a JavaScript module
 * in light of new ClojureScript compiler additions (as of version 1.9.456).
 * See the following link for an example.
 * https://github.com/facebook/react/blob/c7129c/src/renderers/dom/shared/eventPlugins/SimpleEventPlugin.js#L43
 */
/** @suppress {duplicate} */
var ResponderEventPlugin;
/** @suppress {duplicate} */
var SimpleEventPlugin;
/** @suppress {duplicate} */
var TapEventPlugin;
/** @suppress {duplicate} */
var EnterLeaveEventPlugin;
/** @suppress {duplicate} */
var ChangeEventPlugin;
/** @suppress {duplicate} */
var SelectEventPlugin;
/** @suppress {duplicate} */
var BeforeInputEventPlugin;

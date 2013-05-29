/**
 * @providesModule ReactDOM
 * @typechecks
 */

"use strict";

var ReactNativeComponent = require('ReactNativeComponent');

var mergeInto = require('mergeInto');
var objMapKeyVal = require('objMapKeyVal');

/**
 * Creates a new React class that is idempotent and capable of containing other
 * React components. It accepts event listeners and DOM properties that are
 * valid according to `DOMProperty`.
 *
 *  - Event listeners: `onClick`, `onMouseDown`, etc.
 *  - DOM properties: `className`, `name`, `title`, etc.
 *
 * The `style` property functions differently from the DOM API. It accepts an
 * object mapping of style properties to values.
 *
 * @param {string} tag Tag name (e.g. `div`).
 * @param {boolean} omitClose True if the close tag should be omitted.
 * @private
 */
function createDOMComponentClass(tag, omitClose) {
  var Constructor = function() {};

  Constructor.prototype = new ReactNativeComponent(tag, omitClose);
  Constructor.prototype.constructor = Constructor;

  return function(props, children) {
    var instance = new Constructor();
    instance.construct.apply(instance, arguments);
    return instance;
  };
}

/**
 * Creates a mapping from supported HTML tags to `ReactNativeComponent` classes.
 * This is also accessible via `React.DOM`.
 *
 * @public
 */
var ReactDOM = objMapKeyVal({
  a: false,
  abbr: false,
  address: false,
  audio: false,
  b: false,
  body: false,
  br: true,
  button: false,
  code: false,
  col: true,
  colgroup: false,
  dd: false,
  div: false,
  section: false,
  dl: false,
  dt: false,
  em: false,
  embed: true,
  fieldset: false,
  footer: false,
  // Danger: this gets monkeypatched! See ReactDOMForm for more info.
  form: false,
  h1: false,
  h2: false,
  h3: false,
  h4: false,
  h5: false,
  h6: false,
  header: false,
  hr: true,
  i: false,
  iframe: false,
  img: true,
  input: true,
  label: false,
  legend: false,
  li: false,
  line: false,
  nav: false,
  object: false,
  ol: false,
  optgroup: false,
  option: false,
  p: false,
  param: true,
  pre: false,
  select: false,
  small: false,
  source: false,
  span: false,
  sub: false,
  sup: false,
  strong: false,
  table: false,
  tbody: false,
  td: false,
  textarea: false,
  tfoot: false,
  th: false,
  thead: false,
  time: false,
  title: false,
  tr: false,
  u: false,
  ul: false,
  video: false,
  wbr: false,

  // SVG
  circle: false,
  g: false,
  path: false,
  polyline: false,
  rect: false,
  svg: false,
  text: false
}, createDOMComponentClass);

var injection = {
  injectComponentClasses: function(componentClasses) {
    mergeInto(ReactDOM, componentClasses);
  }
};

ReactDOM.injection = injection;

module.exports = ReactDOM;

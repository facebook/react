/**
 * @fileoverview Externs for React 0.5.1.
 *
 * @see http://facebook.github.io/react
 * @externs
 */

/**
 * @type {Object}
 * @const
 */
var React = {};

/**
 * @type {string}
 */
React.version;

/**
 * @param {boolean} shouldUseTouch
 */
React.initializeTouchEvents = function(shouldUseTouch) {};

/**
 * @param {Object} specification
 * @return {function(
      Object=,
      (string|React.ReactComponent|Array.<React.ReactComponent>)=
    ): React.ReactComponent}
 */
React.createClass = function(specification) {};

/**
 * @param {*} componentClass
 * @return {boolean}
 */
React.isValidClass = function(componentClass) {};

/**
 * @param {React.ReactComponent} container
 * @param {Element} mountPoint
 * @param {Function=} callback
 * @return {React.ReactComponent}
 */
React.renderComponent = function(container, mountPoint, callback) {};

/**
 * @param {Element} container
 */
React.unmountComponentAtNode = function(container) {};

/**
 * @param {React.ReactComponent} component
 * @param {Function} callback
 */
React.renderComponentToString = function(component, callback) {};

/**
 * Constructs a component instance of `constructor` with `initialProps` and
 * renders it into the supplied `container`.
 *
 * @param {Function} constructor React component constructor.
 * @param {Object} props Initial props of the component instance.
 * @param {Element} container DOM element to render into.
 * @return {React.ReactComponent} Component instance rendered in `container`.
 */
React.constructAndRenderComponent = function(constructor, props, container) {};

/**
 * Constructs a component instance of `constructor` with `initialProps` and
 * renders it into a container node identified by supplied `id`.
 *
 * @param {Function} componentConstructor React component constructor
 * @param {Object} props Initial props of the component instance.
 * @param {string} id ID of the DOM element to render into.
 * @return {React.ReactComponent} Component instance rendered in the container node.
 */
React.constructAndRenderComponentByID = function(componentConstructor, props, id) {};

/**
 * @interface
 */
React.ReactComponent = function() {};

/**
 * @type {Object}
 */
React.ReactComponent.prototype.props;

/**
 * @type {Object}
 */
React.ReactComponent.prototype.state;

/**
 * @type {Object}
 */
React.ReactComponent.prototype.refs;

/**
 * @type {Object}
 */
React.ReactComponent.prototype.context;

/**
 * @type {Object}
 * @protected
 */
React.ReactComponent.prototype.propTypes;

/**
 * @type {Object}
 * @protected
 */
React.ReactComponent.prototype.contextTypes;

/**
 * @param {Object} nextProps
 * @param {Function=} callback
 */
React.ReactComponent.prototype.setProps = function(nextProps, callback) {};

/**
 * @return {Object}
 */
React.ReactComponent.prototype.getInitialState = function() {};

/**
 * @return {Object}
 */
React.ReactComponent.prototype.getDefaultProps = function() {};

/**
 * @return {Object}
 */
React.ReactComponent.prototype.getChildContext = function() {};

/**
 * @return {Element}
 */
React.ReactComponent.prototype.getDOMNode = function() {};

/**
 * @param {Object} nextProps
 * @param {Function=} callback
 */
React.ReactComponent.prototype.replaceProps = function(nextProps, callback) {};

/**
 * @param {React.ReactComponent} targetComponent
 * @return {React.ReactComponent}
 * @protected
 */
React.ReactComponent.prototype.transferPropsTo = function(targetComponent) {};

/**
 * @param {Function=} callback
 * @protected
 */
React.ReactComponent.prototype.forceUpdate = function(callback) {};

/**
 * @param {Object} nextState
 * @param {Function=} callback
 * @protected
 */
React.ReactComponent.prototype.setState = function(nextState, callback) {};

/**
 * @param {Object} nextState
 * @param {Function=} callback
 * @protected
 */
React.ReactComponent.prototype.replaceState = function(nextState, callback) {};

/**
 * @protected
 */
React.ReactComponent.prototype.componentWillMount = function() {};

/**
 * @param {Element} element
 * @protected
 */
React.ReactComponent.prototype.componentDidMount = function(element) {};

/**
 * @param {Object} nextProps
 * @protected
 */
React.ReactComponent.prototype.componentWillReceiveProps = function(
  nextProps) {};

/**
 * @param {Object} nextProps
 * @param {Object} nextState
 * @return {boolean}
 * @protected
 */
React.ReactComponent.prototype.shouldComponentUpdate = function(
  nextProps, nextState) {};

/**
 * @param {Object} nextProps
 * @param {Object} nextState
 * @protected
 */
React.ReactComponent.prototype.componentWillUpdate = function(
  nextProps, nextState) {};

/**
 * @param {Object} prevProps
 * @param {Object} prevState
 * @param {Element} rootNode
 * @protected
 */
React.ReactComponent.prototype.componentDidUpdate = function(
  prevProps, prevState, rootNode) {};

/**
 * @protected
 */
React.ReactComponent.prototype.componentWillUnmount = function() {};

/**
 * @return {React.ReactComponent}
 * @protected
 */
React.ReactComponent.prototype.render = function() {};

/**
 * Interface to preserve React attributes for advanced compilation.
 * @interface
 */
React.ReactAtrribute = function() {};

/**
 * @type {Object}
 */
React.ReactAtrribute.dangerouslySetInnerHTML;

/**
 * @type {string}
 */
React.ReactAtrribute.__html;

/**
 * @type {string}
 */
React.ReactAtrribute.key;

/**
 * @type {string}
 */
React.ReactAtrribute.ref;

// http://facebook.github.io/react/docs/events.html

/**
 * @type {Function}
 */
React.ReactAtrribute.onCopy;

/**
 * @type {Function}
 */
React.ReactAtrribute.onCut;

/**
 * @type {Function}
 */
React.ReactAtrribute.onPaste;

/**
 * @type {Function}
 */
React.ReactAtrribute.onKeyDown;

/**
 * @type {Function}
 */
React.ReactAtrribute.onKeyPress;

/**
 * @type {Function}
 */
React.ReactAtrribute.onKeyUp;

/**
 * @type {Function}
 */
React.ReactAtrribute.onFocus;

/**
 * @type {Function}
 */
React.ReactAtrribute.onBlur;

/**
 * @type {Function}
 */
React.ReactAtrribute.onChange;

/**
 * @type {Function}
 */
React.ReactAtrribute.onInput;

/**
 * @type {Function}
 */
React.ReactAtrribute.onSubmit;

/**
 * @type {Function}
 */
React.ReactAtrribute.onClick;

/**
 * @type {Function}
 */
React.ReactAtrribute.onDoubleClick;

/**
 * @type {Function}
 */
React.ReactAtrribute.onDrag;

/**
 * @type {Function}
 */
React.ReactAtrribute.onDragEnd;

/**
 * @type {Function}
 */
React.ReactAtrribute.onDragEnter;

/**
 * @type {Function}
 */
React.ReactAtrribute.onDragExit;

/**
 * @type {Function}
 */
React.ReactAtrribute.onDragLeave;

/**
 * @type {Function}
 */
React.ReactAtrribute.onDragOver;

/**
 * @type {Function}
 */
React.ReactAtrribute.onDragStart;

/**
 * @type {Function}
 */
React.ReactAtrribute.onDrop;

/**
 * @type {Function}
 */
React.ReactAtrribute.onMouseDown;

/**
 * @type {Function}
 */
React.ReactAtrribute.onMouseEnter;

/**
 * @type {Function}
 */
React.ReactAtrribute.onMouseLeave;

/**
 * @type {Function}
 */
React.ReactAtrribute.onMouseMove;

/**
 * @type {Function}
 */
React.ReactAtrribute.onMouseUp;

/**
 * @type {Function}
 */
React.ReactAtrribute.onTouchCancel;

/**
 * @type {Function}
 */
React.ReactAtrribute.onTouchEnd;

/**
 * @type {Function}
 */
React.ReactAtrribute.onTouchMove;

/**
 * @type {Function}
 */
React.ReactAtrribute.onTouchStart;

/**
 * @type {Function}
 */
React.ReactAtrribute.onScroll;

/**
 * @type {Function}
 */
React.ReactAtrribute.onWheel;

/**
 * @type {Object}
 * @const
 */
React.DOM = {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.a = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.article = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.abbr = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.address = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.audio = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.b = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.body = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.br = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.button = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.code = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.col = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.colgroup = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.dd = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.div = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.section = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.dl = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.dt = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.em = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.embed = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.fieldset = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.footer = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.form = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.h1 = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.h2 = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.h3 = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.h4 = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.h5 = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.h6 = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.header = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.hr = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.i = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.iframe = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.img = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.input = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.label = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.legend = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.li = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.line = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.nav = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.object = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.ol = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.optgroup = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.option = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.p = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.param = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.pre = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.select = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.small = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.source = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.span = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.sub = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.sup = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.strong = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.table = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.tbody = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.td = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.textarea = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.tfoot = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.th = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.thead = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.time = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.title = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.tr = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.u = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.ul = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.video = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.wbr = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.circle = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.g = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.path = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.polygon = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.polyline = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.rect = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.svg = function(props, children) {};

/**
 * @param {Object=} props
 * @param {...string|React.ReactComponent|Array.<React.ReactComponent>|boolean} children
 * @return {React.ReactComponent}
 * @protected
 */
React.DOM.text = function(props, children) {};

/**
 * @typedef {function(boolean, boolean, Object, string, string, string): boolean} React.ChainableTypeChecker
 */
React.ChainableTypeChecker;

/**
 * @type {React.ChainableTypeChecker}
 */
React.ChainableTypeChecker.weak;

/**
 * @type {React.ChainableTypeChecker}
 */
React.ChainableTypeChecker.weak.isRequired;

/**
 * @type {React.ChainableTypeChecker}
 */
React.ChainableTypeChecker.isRequired;

/**
 * @type {React.ChainableTypeChecker}
 */
React.ChainableTypeChecker.isRequired.weak;

/**
 * @type {Object}
 * @const
 */
React.PropTypes = {
  /** @type {React.ChainableTypeChecker} */
  "array": function () {},
  /** @type {React.ChainableTypeChecker} */
  "boolean": function () {},
  /** @type {React.ChainableTypeChecker} */
  "func": function () {},
  /** @type {React.ChainableTypeChecker} */
  "number": function () {},
  /** @type {React.ChainableTypeChecker} */
  "object": function () {},
  /** @type {React.ChainableTypeChecker} */
  "string": function () {},
  /** @type {React.ChainableTypeChecker} */
  "oneOf": function () {},
  /** @type {React.ChainableTypeChecker} */
  "oneOfType": function () {},
  /** @type {React.ChainableTypeChecker} */
  "instanceOf": function () {},
  /** @type {React.ChainableTypeChecker} */
  "renderable": function () {}
};
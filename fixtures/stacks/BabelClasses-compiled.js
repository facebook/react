function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

// Compile this with Babel.
// babel --config-file ./babel.config.json BabelClasses.js --out-file BabelClasses-compiled.js --source-maps
let BabelClass = /*#__PURE__*/ (function (_React$Component) {
  _inheritsLoose(BabelClass, _React$Component);

  function BabelClass() {
    return _React$Component.apply(this, arguments) || this;
  }

  var _proto = BabelClass.prototype;

  _proto.render = function render() {
    return this.props.children;
  };

  return BabelClass;
})(React.Component);

let BabelClassWithFields = /*#__PURE__*/ (function (_React$Component2) {
  _inheritsLoose(BabelClassWithFields, _React$Component2);

  function BabelClassWithFields(...args) {
    var _this;

    _this = _React$Component2.call(this, ...args) || this;

    _defineProperty(
      _assertThisInitialized(_assertThisInitialized(_this)),
      'props',
      void 0
    );

    _defineProperty(
      _assertThisInitialized(_assertThisInitialized(_this)),
      'state',
      {}
    );

    return _this;
  }

  var _proto2 = BabelClassWithFields.prototype;

  _proto2.render = function render() {
    return this.props.children;
  };

  return BabelClassWithFields;
})(React.Component);

//# sourceMappingURL=BabelClasses-compiled.js.map

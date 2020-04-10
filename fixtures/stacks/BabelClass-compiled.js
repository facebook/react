function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

// Compile this with Babel.
// babel --config-file ./babel.config.json BabelClass.js --out-file BabelClass-compiled.js --source-maps
let BabelClass = /*#__PURE__*/ (function(_React$Component) {
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

//# sourceMappingURL=BabelClass-compiled.js.map

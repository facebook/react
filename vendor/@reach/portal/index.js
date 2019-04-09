"use strict";

exports.__esModule = true;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _componentComponent = require("@reach/component-component");

var _componentComponent2 = _interopRequireDefault(_componentComponent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Portal = function Portal(_ref) {
  var children = _ref.children,
      _ref$type = _ref.type,
      type = _ref$type === undefined ? "reach-portal" : _ref$type;
  return _react2.default.createElement(_componentComponent2.default, {
    getRefs: function getRefs() {
      return { mountNode: null, portalNode: null };
    },
    didMount: function didMount(_ref2) {
      var refs = _ref2.refs,
          forceUpdate = _ref2.forceUpdate;

      // It's possible that the content we are portal has, itself, been portaled.
      // In that case, it's important to append to the correct document element.
      var ownerDocument = refs.mountNode.ownerDocument;
      refs.portalNode = ownerDocument.createElement(type);
      ownerDocument.body.appendChild(refs.portalNode);
      forceUpdate();
    },
    willUnmount: function willUnmount(_ref3) {
      var portalNode = _ref3.refs.portalNode;

      portalNode.ownerDocument.body.removeChild(portalNode);
    },
    render: function render(_ref4) {
      var refs = _ref4.refs;
      var portalNode = refs.portalNode;

      if (!portalNode) {
        return _react2.default.createElement("div", { ref: function ref(div) {
            return refs.mountNode = div;
          } });
      } else {
        return (0, _reactDom.createPortal)(children, portalNode);
      }
    }
  });
};

exports.default = Portal;
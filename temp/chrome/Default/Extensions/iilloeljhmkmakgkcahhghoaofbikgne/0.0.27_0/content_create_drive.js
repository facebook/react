/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 61:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _typeof = (__webpack_require__(698)["default"]);
function _regeneratorRuntime() {
  "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */
  module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
    return e;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  var t,
    e = {},
    r = Object.prototype,
    n = r.hasOwnProperty,
    o = Object.defineProperty || function (t, e, r) {
      t[e] = r.value;
    },
    i = "function" == typeof Symbol ? Symbol : {},
    a = i.iterator || "@@iterator",
    c = i.asyncIterator || "@@asyncIterator",
    u = i.toStringTag || "@@toStringTag";
  function define(t, e, r) {
    return Object.defineProperty(t, e, {
      value: r,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }), t[e];
  }
  try {
    define({}, "");
  } catch (t) {
    define = function define(t, e, r) {
      return t[e] = r;
    };
  }
  function wrap(t, e, r, n) {
    var i = e && e.prototype instanceof Generator ? e : Generator,
      a = Object.create(i.prototype),
      c = new Context(n || []);
    return o(a, "_invoke", {
      value: makeInvokeMethod(t, r, c)
    }), a;
  }
  function tryCatch(t, e, r) {
    try {
      return {
        type: "normal",
        arg: t.call(e, r)
      };
    } catch (t) {
      return {
        type: "throw",
        arg: t
      };
    }
  }
  e.wrap = wrap;
  var h = "suspendedStart",
    l = "suspendedYield",
    f = "executing",
    s = "completed",
    y = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var p = {};
  define(p, a, function () {
    return this;
  });
  var d = Object.getPrototypeOf,
    v = d && d(d(values([])));
  v && v !== r && n.call(v, a) && (p = v);
  var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
  function defineIteratorMethods(t) {
    ["next", "throw", "return"].forEach(function (e) {
      define(t, e, function (t) {
        return this._invoke(e, t);
      });
    });
  }
  function AsyncIterator(t, e) {
    function invoke(r, o, i, a) {
      var c = tryCatch(t[r], t, o);
      if ("throw" !== c.type) {
        var u = c.arg,
          h = u.value;
        return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
          invoke("next", t, i, a);
        }, function (t) {
          invoke("throw", t, i, a);
        }) : e.resolve(h).then(function (t) {
          u.value = t, i(u);
        }, function (t) {
          return invoke("throw", t, i, a);
        });
      }
      a(c.arg);
    }
    var r;
    o(this, "_invoke", {
      value: function value(t, n) {
        function callInvokeWithMethodAndArg() {
          return new e(function (e, r) {
            invoke(t, n, e, r);
          });
        }
        return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
      }
    });
  }
  function makeInvokeMethod(e, r, n) {
    var o = h;
    return function (i, a) {
      if (o === f) throw new Error("Generator is already running");
      if (o === s) {
        if ("throw" === i) throw a;
        return {
          value: t,
          done: !0
        };
      }
      for (n.method = i, n.arg = a;;) {
        var c = n.delegate;
        if (c) {
          var u = maybeInvokeDelegate(c, n);
          if (u) {
            if (u === y) continue;
            return u;
          }
        }
        if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
          if (o === h) throw o = s, n.arg;
          n.dispatchException(n.arg);
        } else "return" === n.method && n.abrupt("return", n.arg);
        o = f;
        var p = tryCatch(e, r, n);
        if ("normal" === p.type) {
          if (o = n.done ? s : l, p.arg === y) continue;
          return {
            value: p.arg,
            done: n.done
          };
        }
        "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
      }
    };
  }
  function maybeInvokeDelegate(e, r) {
    var n = r.method,
      o = e.iterator[n];
    if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
    var i = tryCatch(o, e.iterator, r.arg);
    if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
    var a = i.arg;
    return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
  }
  function pushTryEntry(t) {
    var e = {
      tryLoc: t[0]
    };
    1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
  }
  function resetTryEntry(t) {
    var e = t.completion || {};
    e.type = "normal", delete e.arg, t.completion = e;
  }
  function Context(t) {
    this.tryEntries = [{
      tryLoc: "root"
    }], t.forEach(pushTryEntry, this), this.reset(!0);
  }
  function values(e) {
    if (e || "" === e) {
      var r = e[a];
      if (r) return r.call(e);
      if ("function" == typeof e.next) return e;
      if (!isNaN(e.length)) {
        var o = -1,
          i = function next() {
            for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
            return next.value = t, next.done = !0, next;
          };
        return i.next = i;
      }
    }
    throw new TypeError(_typeof(e) + " is not iterable");
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
    value: GeneratorFunctionPrototype,
    configurable: !0
  }), o(GeneratorFunctionPrototype, "constructor", {
    value: GeneratorFunction,
    configurable: !0
  }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
    var e = "function" == typeof t && t.constructor;
    return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
  }, e.mark = function (t) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
  }, e.awrap = function (t) {
    return {
      __await: t
    };
  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
    return this;
  }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
    void 0 === i && (i = Promise);
    var a = new AsyncIterator(wrap(t, r, n, o), i);
    return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
      return t.done ? t.value : a.next();
    });
  }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
    return this;
  }), define(g, "toString", function () {
    return "[object Generator]";
  }), e.keys = function (t) {
    var e = Object(t),
      r = [];
    for (var n in e) r.push(n);
    return r.reverse(), function next() {
      for (; r.length;) {
        var t = r.pop();
        if (t in e) return next.value = t, next.done = !1, next;
      }
      return next.done = !0, next;
    };
  }, e.values = values, Context.prototype = {
    constructor: Context,
    reset: function reset(e) {
      if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
    },
    stop: function stop() {
      this.done = !0;
      var t = this.tryEntries[0].completion;
      if ("throw" === t.type) throw t.arg;
      return this.rval;
    },
    dispatchException: function dispatchException(e) {
      if (this.done) throw e;
      var r = this;
      function handle(n, o) {
        return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
      }
      for (var o = this.tryEntries.length - 1; o >= 0; --o) {
        var i = this.tryEntries[o],
          a = i.completion;
        if ("root" === i.tryLoc) return handle("end");
        if (i.tryLoc <= this.prev) {
          var c = n.call(i, "catchLoc"),
            u = n.call(i, "finallyLoc");
          if (c && u) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          } else if (c) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
          } else {
            if (!u) throw new Error("try statement without catch or finally");
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          }
        }
      }
    },
    abrupt: function abrupt(t, e) {
      for (var r = this.tryEntries.length - 1; r >= 0; --r) {
        var o = this.tryEntries[r];
        if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
          var i = o;
          break;
        }
      }
      i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
      var a = i ? i.completion : {};
      return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
    },
    complete: function complete(t, e) {
      if ("throw" === t.type) throw t.arg;
      return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
    },
    finish: function finish(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
      }
    },
    "catch": function _catch(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.tryLoc === t) {
          var n = r.completion;
          if ("throw" === n.type) {
            var o = n.arg;
            resetTryEntry(r);
          }
          return o;
        }
      }
      throw new Error("illegal catch attempt");
    },
    delegateYield: function delegateYield(e, r, n) {
      return this.delegate = {
        iterator: values(e),
        resultName: r,
        nextLoc: n
      }, "next" === this.method && (this.arg = t), y;
    }
  }, e;
}
module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 698:
/***/ ((module) => {

function _typeof(o) {
  "@babel/helpers - typeof";

  return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),

/***/ 687:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// TODO(Babel 8): Remove this file.

var runtime = __webpack_require__(61)();
module.exports = runtime;

// Copied from https://github.com/facebook/regenerator/blob/main/packages/runtime/runtime.js#L736=
try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";

;// CONCATENATED MODULE: ./src/core/logger.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */

/*
 * Keep logging turned off in production and beta builds,
 * as logging significantly hampers performance.
 */
var DEBUG = true;

// really, arguments here can be of any type
// eslint-disable-next-line flowtype/no-weak-types
function logger_consoleDebug() {
  var _console;
  // eslint-disable-next-line no-console
  DEBUG && (_console = console).debug.apply(_console, arguments);
}

// really, arguments here can be of any type
// eslint-disable-next-line flowtype/no-weak-types
function consoleLog() {
  var _console2;
  // eslint-disable-next-line no-console
  DEBUG && (_console2 = console).log.apply(_console2, arguments);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function asyncToGenerator_asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/classCallCheck.js
function classCallCheck_classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/typeof.js
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/toPrimitive.js

function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/toPropertyKey.js


function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : String(i);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/createClass.js

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, toPropertyKey(descriptor.key), descriptor);
  }
}
function createClass_createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn.js


function possibleConstructorReturn_possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }
  return _assertThisInitialized(self);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
function getPrototypeOf_getPrototypeOf(o) {
  getPrototypeOf_getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return getPrototypeOf_getPrototypeOf(o);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/inherits.js

function inherits_inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  Object.defineProperty(subClass, "prototype", {
    writable: false
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/defineProperty.js

function defineProperty_defineProperty(obj, key, value) {
  key = toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
// EXTERNAL MODULE: ./node_modules/@babel/runtime/regenerator/index.js
var regenerator = __webpack_require__(687);
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/arrayWithHoles.js
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/iterableToArrayLimit.js
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = !1;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = !0, n = r;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/arrayLikeToArray.js
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/unsupportedIterableToArray.js

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/nonIterableRest.js
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js




function slicedToArray_slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
;// CONCATENATED MODULE: ./src/content/google_create_drive_modal.js



/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall data_security_engineering
 *
 */

var GoogleCreateDriveModal = /*#__PURE__*/function () {
  function GoogleCreateDriveModal(chrome, sessionUUID, domSelector) {
    classCallCheck_classCallCheck(this, GoogleCreateDriveModal);
    defineProperty_defineProperty(this, "chrome", void 0);
    defineProperty_defineProperty(this, "sessionUUID", void 0);
    defineProperty_defineProperty(this, "metaFoundAttribute", void 0);
    defineProperty_defineProperty(this, "googleCreateDriveButton", null);
    defineProperty_defineProperty(this, "googleCancelButton", null);
    defineProperty_defineProperty(this, "googleDriveNameInput", null);
    this.chrome = chrome;
    this.sessionUUID = sessionUUID;
    this.googleCreateDriveButton = document.querySelector(domSelector.create_button);
    this.googleCancelButton = document.querySelector(domSelector.cancel_button);
    this.googleDriveNameInput = document.querySelector(domSelector.name_input);
    this.metaFoundAttribute = "meta-found-".concat(chrome.runtime.id);
  }
  createClass_createClass(GoogleCreateDriveModal, [{
    key: "createDrive",
    value: function createDrive(driveName) {
      var _this$googleCreateDri;
      if (this.googleDriveNameInput instanceof HTMLInputElement) {
        this.googleDriveNameInput.value = driveName;
      }
      (_this$googleCreateDri = this.googleCreateDriveButton) === null || _this$googleCreateDri === void 0 || _this$googleCreateDri.click();
    }
  }, {
    key: "closeModal",
    value: function closeModal() {
      var _this$googleCancelBut;
      (_this$googleCancelBut = this.googleCancelButton) === null || _this$googleCancelBut === void 0 || _this$googleCancelBut.click();
    }
  }]);
  return GoogleCreateDriveModal;
}();
;// CONCATENATED MODULE: ./src/content/interstitial.js





function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = interstitial_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function interstitial_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return interstitial_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return interstitial_arrayLikeToArray(o, minLen); }
function interstitial_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */



var BBDP_PREFIX = 'meta_data_protection_';
var INTERSTITIAL_DOM_ID = "".concat(BBDP_PREFIX, "interstitial_id");
var INTERSTITIAL_ICON_DOM_ID = "".concat(BBDP_PREFIX, "warning_icon_id");
var INTERSTITIAL_CANCEL_BUTTON_ID = "".concat(BBDP_PREFIX, "cancel_button_id");
var interstitial_INTERSTITIAL_DATA_HANDLING_CONSENT_CHECKBOX_ID = "".concat(BBDP_PREFIX, "data_handling_consent_checkbox_id");
var interstitial_INTERSTITIAL_SHARE_BUTTON_ID = "".concat(BBDP_PREFIX, "share_button_id");
var INTERSTITIAL_RECIPIENTS_DIV_ID = "".concat(BBDP_PREFIX, "recipients_div_id");
var INTERSTITIAL_REASON_DIV_ID = "".concat(BBDP_PREFIX, "reason_div_id");
var INTERSTITIAL_REASON_NDA_CHECKBOX_ID = "".concat(BBDP_PREFIX, "reason_nda_checkbox_id");
var interstitial_INTERSTITIAL_REASON_TPA_CHECKBOX_ID = "".concat(BBDP_PREFIX, "reason_tpa_checkbox_id");
var INTERSTITIAL_REASON_VENDOR_CONTRACT_CHECKBOX_ID = "".concat(BBDP_PREFIX, "reason_vendor_contract_checkbox_id");
var interstitial_INTERSTITIAL_REASON_DSS1_CHECKBOX_ID = "".concat(BBDP_PREFIX, "reason_dss1_checkbox_id");
var INTERSTITIAL_REASON_PERSONAL_DATA_CHECKBOX_ID = "".concat(BBDP_PREFIX, "reason_personal_data_checkbox_id");
var interstitial_INTERSTITIAL_REASON_OTHER_CHECKBOX_ID = "".concat(BBDP_PREFIX, "reason_other_checkbox_id");
var interstitial_ALL_INTERSTITIAL_CHECKBOXES = [INTERSTITIAL_REASON_NDA_CHECKBOX_ID, interstitial_INTERSTITIAL_REASON_TPA_CHECKBOX_ID, INTERSTITIAL_REASON_VENDOR_CONTRACT_CHECKBOX_ID, interstitial_INTERSTITIAL_REASON_DSS1_CHECKBOX_ID, INTERSTITIAL_REASON_PERSONAL_DATA_CHECKBOX_ID, interstitial_INTERSTITIAL_REASON_OTHER_CHECKBOX_ID];
var interstitial_INTERSTITIAL_OTHER_DETAILS_INPUT_ID = "".concat(BBDP_PREFIX, "other_details_input_id");
var interstitial_INTERSTITIAL_TPA_DETAILS_INPUT_ID = "".concat(BBDP_PREFIX, "tpa_details_input_id");
var INTERSTITIAL_TPA_DETAILS_DIV_ID = "".concat(BBDP_PREFIX, "tpa_details_div_id");
var FREEFORM_FIELD_NAME = 'Freeform reason';
var VALIDATION_POLLING_INTERVAL_MS = 100;
var DataProtectionInterstitial = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function DataProtectionInterstitial(chrome, document, sessionUUID, recipients, gDocumentId, shareCallback) {
    _classCallCheck(this, DataProtectionInterstitial);
    _defineProperty(this, "chrome", void 0);
    _defineProperty(this, "document", void 0);
    _defineProperty(this, "sessionUUID", void 0);
    _defineProperty(this, "gDocumentId", void 0);
    _defineProperty(this, "recipients", void 0);
    _defineProperty(this, "shareCallback", void 0);
    _defineProperty(this, "inputValidationId", void 0);
    _defineProperty(this, "state", void 0);
    this.chrome = chrome;
    this.document = document;
    this.sessionUUID = sessionUUID;
    this.gDocumentId = gDocumentId;
    this.recipients = recipients;
    this.shareCallback = shareCallback;
    this.state = {
      dataHandlingConsentSelected: false,
      tpaReasonSelected: false,
      validationErrors: []
    };
  }
  _createClass(DataProtectionInterstitial, [{
    key: "downloadAndRenderDataProtectionInterstitial",
    value: function () {
      var _downloadAndRenderDataProtectionInterstitial = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        var response, html;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return fetch(this.chrome.runtime.getURL('/interstitial.html'));
            case 3:
              response = _context.sent;
              _context.next = 6;
              return response.text();
            case 6:
              html = _context.sent;
              this.renderInterstitial(html);
              _context.next = 13;
              break;
            case 10:
              _context.prev = 10;
              _context.t0 = _context["catch"](0);
              consoleDebug("Error downloading interstitial.html: ".concat(_context.t0));
            case 13:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[0, 10]]);
      }));
      function downloadAndRenderDataProtectionInterstitial() {
        return _downloadAndRenderDataProtectionInterstitial.apply(this, arguments);
      }
      return downloadAndRenderDataProtectionInterstitial;
    }()
  }, {
    key: "renderInterstitial",
    value: function renderInterstitial(html) {
      this.removeInterstitial();
      this.addInterstitialToDom(html);
      this.validateInputLoop();

      // callbacks
      this.onCancelButtonClick();
      this.onTPAReasonClick();
      this.onShareAnywayClick();

      // logging
      this.chrome.runtime.sendMessage({
        type: 'meta_interstitial_shown',
        payload: {
          // eslint-disable-next-line camelcase
          session_uuid: this.sessionUUID,
          recipients: this.recipients,
          // eslint-disable-next-line camelcase
          document_id: this.gDocumentId
        }
      });
    }
  }, {
    key: "removeInterstitial",
    value: function removeInterstitial() {
      var interstitial = this.document.getElementById(INTERSTITIAL_DOM_ID);
      if (interstitial) {
        interstitial.remove();
      }
      clearInterval(this.inputValidationId);
    }
  }, {
    key: "addInterstitialToDom",
    value: function addInterstitialToDom(html) {
      var _this$document$body;
      var container = this.document.createElement('div');
      container.innerHTML = html;
      (_this$document$body = this.document.body) === null || _this$document$body === void 0 || _this$document$body.appendChild(container);
      consoleDebug('Rendered data protection interstitial');
      var interstitial = this.document.getElementById(INTERSTITIAL_DOM_ID);
      if (interstitial != null) {
        interstitial.style.display = 'flex';
      }

      // Set icon (relative path to the extension id)
      var icon = this.document.getElementById(INTERSTITIAL_ICON_DOM_ID);
      if (icon != null) {
        // $FlowIgnore[prop-missing]: Tests don't work with instanceof
        icon.src = this.chrome.runtime.getURL('icons/warning.png');
      }

      // Populate recipients
      var ul = this.document.createElement('ul');
      if (this.recipients != null) {
        var _iterator = _createForOfIteratorHelper(this.recipients),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var recipient = _step.value;
            var li = this.document.createElement('li');
            li.innerText = recipient;
            ul.append(li);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      var recipients = this.document.getElementById(INTERSTITIAL_RECIPIENTS_DIV_ID);
      if (recipients != null) {
        recipients.innerHTML = ul.outerHTML;
      }
    }
  }, {
    key: "validateInputLoop",
    value: function validateInputLoop() {
      var _this = this;
      this.inputValidationId = setInterval(function () {
        return _this.validateInput();
      }, VALIDATION_POLLING_INTERVAL_MS);
    }
  }, {
    key: "validateInput",
    value: function validateInput() {
      var validationErrors = getValidationErrors(this.document);
      for (var _i = 0, _Object$entries = Object.entries(VALIDATION_ERROR); _i < _Object$entries.length; _i++) {
        var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
          _ = _Object$entries$_i[0],
          errorMsg = _Object$entries$_i[1];
        if (validationErrors.includes(errorMsg) === this.state.validationErrors.includes(errorMsg)) {
          continue;
        }
        updateValidationError(validationErrors.includes(errorMsg), this.document, errorMsg);
      }
      if (validationErrors.length === 0 && this.state.validationErrors.length > 0) {
        enableSharingButton(this.document);
      } else if (validationErrors.length > 0 && this.state.validationErrors.length === 0) {
        disableSharingButton(this.document);
      }
      this.state.validationErrors = validationErrors;
    }
  }, {
    key: "onCancelButtonClick",
    value: function onCancelButtonClick() {
      var _this2 = this;
      var cancelButton = this.document.getElementById(INTERSTITIAL_CANCEL_BUTTON_ID);
      if (cancelButton) {
        cancelButton.addEventListener('click', function () {
          _this2.chrome.runtime.sendMessage({
            type: 'meta_interstitial_cancel',
            payload: {
              // eslint-disable-next-line camelcase
              session_uuid: _this2.sessionUUID,
              recipients: _this2.recipients,
              // eslint-disable-next-line camelcase
              document_id: _this2.gDocumentId
            }
          });
          _this2.removeInterstitial();
        });
      }
    }
  }, {
    key: "onTPAReasonClick",
    value: function onTPAReasonClick() {
      var _this3 = this;
      var tpaReasonCheckbox = this.document.getElementById(interstitial_INTERSTITIAL_REASON_TPA_CHECKBOX_ID);
      if (tpaReasonCheckbox) {
        tpaReasonCheckbox.addEventListener('change', function () {
          _this3.state.tpaReasonSelected = !_this3.state.tpaReasonSelected;
          consoleDebug("TPA reason changed to ".concat(_this3.state.tpaReasonSelected.toString()));
          var tpaReasonInput = _this3.document.getElementById(INTERSTITIAL_TPA_DETAILS_DIV_ID);
          if (tpaReasonInput) {
            if (_this3.state.tpaReasonSelected) {
              tpaReasonInput.style.display = 'block';
            } else {
              tpaReasonInput.style.display = 'none';
            }
          }
        });
      }
    }
  }, {
    key: "onShareAnywayClick",
    value: function onShareAnywayClick() {
      var _this4 = this;
      var shareButton = this.document.getElementById(interstitial_INTERSTITIAL_SHARE_BUTTON_ID);
      if (shareButton) {
        shareButton.addEventListener('click', function () {
          var validationErrors = getValidationErrors(_this4.document);
          if (validationErrors.length > 0) {
            // safe to ignore, given the input validation is visible to the user
            return;
          }
          _this4.chrome.runtime.sendMessage({
            type: 'meta_interstitial_share',
            payload: {
              // eslint-disable-next-line camelcase
              session_uuid: _this4.sessionUUID,
              recipients: _this4.recipients,
              // eslint-disable-next-line camelcase
              document_id: _this4.gDocumentId,
              // eslint-disable-next-line camelcase
              sharing_reasons: JSON.stringify(Object.fromEntries(_this4.getSelectedReasonsForSharing()))
            }
          });
          _this4.removeInterstitial();
          _this4.shareCallback();
        });
      }
    }
  }, {
    key: "getSelectedReasonsForSharing",
    value: function getSelectedReasonsForSharing() {
      var _this5 = this;
      // TODO - potentially extract Reason Codes to be shared with backend.
      var ReasonDomIDToCode = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, INTERSTITIAL_REASON_NDA_CHECKBOX_ID, {
        type: 'NDA',
        data: [[FREEFORM_FIELD_NAME, interstitial_INTERSTITIAL_OTHER_DETAILS_INPUT_ID]]
      }), interstitial_INTERSTITIAL_REASON_TPA_CHECKBOX_ID, {
        type: 'TPA',
        data: [['TPA number', interstitial_INTERSTITIAL_TPA_DETAILS_INPUT_ID], [FREEFORM_FIELD_NAME, interstitial_INTERSTITIAL_OTHER_DETAILS_INPUT_ID]]
      }), INTERSTITIAL_REASON_VENDOR_CONTRACT_CHECKBOX_ID, {
        type: 'VENDOR_CONTRACT',
        data: [[FREEFORM_FIELD_NAME, interstitial_INTERSTITIAL_OTHER_DETAILS_INPUT_ID]]
      }), interstitial_INTERSTITIAL_REASON_DSS1_CHECKBOX_ID, {
        type: 'DSS1',
        data: [[FREEFORM_FIELD_NAME, interstitial_INTERSTITIAL_OTHER_DETAILS_INPUT_ID]]
      }), INTERSTITIAL_REASON_PERSONAL_DATA_CHECKBOX_ID, {
        type: 'PERSONAL_DATA',
        data: [[FREEFORM_FIELD_NAME, interstitial_INTERSTITIAL_OTHER_DETAILS_INPUT_ID]]
      }), interstitial_INTERSTITIAL_REASON_OTHER_CHECKBOX_ID, {
        type: 'OTHER',
        data: [[FREEFORM_FIELD_NAME, interstitial_INTERSTITIAL_OTHER_DETAILS_INPUT_ID]]
      });
      var reasons = new Map();
      var _loop = function _loop() {
        var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
          key = _Object$entries2$_i[0],
          value = _Object$entries2$_i[1];
        var input = _this5.document.getElementById(key);
        // $FlowIgnore[prop-missing]: Tests don't work with instanceof
        if (input !== null && input !== void 0 && input.checked) {
          var justifications = [];
          value.data.forEach(function (element) {
            var _this5$document$getEl;
            // $FlowIgnore[prop-missing]: Tests don't work with instanceof
            var val = (_this5$document$getEl = _this5.document.getElementById(element[1])) === null || _this5$document$getEl === void 0 ? void 0 : _this5$document$getEl.value;
            if (val != null) {
              justifications.push("".concat(element[0], ": ").concat(val));
            }
          });
          reasons.set(value.type, justifications.join(' | '));
        }
      };
      for (var _i2 = 0, _Object$entries2 = Object.entries(ReasonDomIDToCode); _i2 < _Object$entries2.length; _i2++) {
        _loop();
      }
      return reasons;
    }
  }]);
  return DataProtectionInterstitial;
}()));
;// CONCATENATED MODULE: ./src/content/interstitial_validation.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */

'use-strict';



var VALIDATION_ADDITIONAL_DETAILS_DIV_ID = 'meta_data_protection_additional_details_div_id';
var VALIDATION_ADDITIONAL_DETAILS_MSG_DIV_ID = 'meta_data_protection_additional_details_warning_msg_div_id';
var VALIDATION_REASON_FOR_SHARING_DIV_ID = 'meta_data_protection_reason_div_id';
var VALIDATION_REASON_FOR_SHARING_MSG_DIV_ID = 'meta_data_protection_reason_warning_msg_div_id';
var VALIDATION_TPA_NUMBER_DIV_ID = 'meta_data_protection_tpa_details_div_id';
var VALIDATION_TPA_NUMBER_MSG_DIV_ID = 'meta_data_protection_tpa_warning_msg_div_id';
var interstitial_validation_VALIDATION_ERROR = {
  DATA_HANDLING_CONSENT: 'You must agree to the data handling consent',
  TPA_NUMBER: 'You must provide a TPA number',
  ADDITIONAL_DETAILS: 'You must provide additional details',
  REASON_FOR_SHARING: 'You must select a reason for sharing'
};
var VALIDATE_TPA_NUMBER_FN = function VALIDATE_TPA_NUMBER_FN(value) {
  return (typeof value === 'number' || typeof value === 'string' && !isNaN(value)) && Number(value) >= 100 && Number(value) <= 1000000;
};
function interstitial_validation_getValidationErrors(document) {
  var validationErrors = [];
  var dataHandlingConsentCheckbox = document.getElementById(INTERSTITIAL_DATA_HANDLING_CONSENT_CHECKBOX_ID);
  // $FlowIgnore[prop-missing]: Tests don't work with instanceof
  if (!(dataHandlingConsentCheckbox !== null && dataHandlingConsentCheckbox !== void 0 && dataHandlingConsentCheckbox.checked)) {
    validationErrors.push(interstitial_validation_VALIDATION_ERROR.DATA_HANDLING_CONSENT);
  }
  if (!requiredInputFieldFilled(document, INTERSTITIAL_REASON_TPA_CHECKBOX_ID, INTERSTITIAL_TPA_DETAILS_INPUT_ID, [VALIDATE_TPA_NUMBER_FN])) {
    validationErrors.push(interstitial_validation_VALIDATION_ERROR.TPA_NUMBER);
  }
  if (!requiredInputFieldFilled(document, INTERSTITIAL_REASON_OTHER_CHECKBOX_ID, INTERSTITIAL_OTHER_DETAILS_INPUT_ID, []) || !requiredInputFieldFilled(document, INTERSTITIAL_REASON_DSS1_CHECKBOX_ID, INTERSTITIAL_OTHER_DETAILS_INPUT_ID, [])) {
    validationErrors.push(interstitial_validation_VALIDATION_ERROR.ADDITIONAL_DETAILS);
  }
  if (!ALL_INTERSTITIAL_CHECKBOXES.some(
  // $FlowIgnore[prop-missing]: Tests don't work with instanceof
  function (checkboxID) {
    var _document$getElementB;
    return (_document$getElementB = document.getElementById(checkboxID)) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.checked;
  })) {
    validationErrors.push(interstitial_validation_VALIDATION_ERROR.REASON_FOR_SHARING);
  }
  return validationErrors;
}
function requiredInputFieldFilled(document, checkboxID, inputID, valueValidations) {
  var _document$getElementB2;
  // $FlowIgnore[prop-missing]: Tests don't work with instanceof
  if (!((_document$getElementB2 = document.getElementById(checkboxID)) !== null && _document$getElementB2 !== void 0 && _document$getElementB2.checked)) {
    return true;
  }
  var inputElement = document.getElementById(inputID);
  return !(inputElement && (
  // $FlowIgnore[prop-missing]: Tests don't work with instanceof
  inputElement.value === '' ||
  // eslint-disable-next-line flowtype/require-return-type
  !valueValidations.every(function (fn) {
    return (
      // $FlowIgnore[prop-missing]: Tests don't work with instanceof
      fn(inputElement.value)
    );
  })));
}
function interstitial_validation_enableSharingButton(document) {
  var shareButton = document.getElementById(INTERSTITIAL_SHARE_BUTTON_ID);
  if (shareButton) {
    shareButton.style.backgroundColor = '#0b57d0';
    shareButton.style.cursor = 'pointer';
    shareButton.style.color = '#fff';
  }
}
function interstitial_validation_disableSharingButton(document) {
  var shareButton = document.getElementById(INTERSTITIAL_SHARE_BUTTON_ID);
  if (shareButton) {
    shareButton.style.backgroundColor = '#dddddd';
    shareButton.style.cursor = 'not-allowed';
    shareButton.style.color = '#000';
  }
}
function interstitial_validation_updateValidationError(showError, document, errorMsg) {
  var fn;
  var inputElementID = '';
  var warningMsgElementID = '';
  switch (errorMsg) {
    case interstitial_validation_VALIDATION_ERROR.ADDITIONAL_DETAILS:
      fn = showError ? addWarningBorder : removeWarningBorder;
      inputElementID = VALIDATION_ADDITIONAL_DETAILS_DIV_ID;
      warningMsgElementID = VALIDATION_ADDITIONAL_DETAILS_MSG_DIV_ID;
      break;
    case interstitial_validation_VALIDATION_ERROR.REASON_FOR_SHARING:
      fn = showError ? addWarningBorder : addPassBorder;
      inputElementID = VALIDATION_REASON_FOR_SHARING_DIV_ID;
      warningMsgElementID = VALIDATION_REASON_FOR_SHARING_MSG_DIV_ID;
      break;
    case interstitial_validation_VALIDATION_ERROR.TPA_NUMBER:
      fn = showError ? addWarningBorder : removeWarningBorder;
      inputElementID = VALIDATION_TPA_NUMBER_DIV_ID;
      warningMsgElementID = VALIDATION_TPA_NUMBER_MSG_DIV_ID;
      break;
    case interstitial_validation_VALIDATION_ERROR.DATA_HANDLING_CONSENT:
      // do nothing - best UI experience for the user
      break;
  }
  if (fn) {
    fn(document, inputElementID, warningMsgElementID);
  }
}
function addWarningBorder(document, inputElementID, warningMsgElementID) {
  var element = document.getElementById(inputElementID);
  if (element) {
    element.style.borderColor = '#F5C33B';
    element.style.borderWidth = '1px';
    element.style.borderStyle = 'solid';
    element.style.marginBottom = '0px';
  }
  var warningMsgElement = document.getElementById(warningMsgElementID);
  if (warningMsgElement) {
    warningMsgElement.style.display = 'block';
    warningMsgElement.style.backgroundColor = '#F5C33B';
  }
}
function removeWarningBorder(document, inputElementID, warningMsgElementID) {
  var element = document.getElementById(inputElementID);
  if (element) {
    element.style.borderWidth = '0px';
    element.style.marginBottom = '30px';
  }
  var warningMsgElement = document.getElementById(warningMsgElementID);
  if (warningMsgElement) {
    warningMsgElement.style.display = 'none';
  }
}
function addPassBorder(document, inputElementID, warningMsgElementID) {
  var element = document.getElementById(inputElementID);
  if (element) {
    element.style.borderColor = '#00A400';
    element.style.borderWidth = '1px';
    element.style.borderStyle = 'solid';
    element.style.marginBottom = '0px';
  }
  var warningMsgElement = document.getElementById(warningMsgElementID);
  if (warningMsgElement) {
    warningMsgElement.style.display = 'block';
    warningMsgElement.style.backgroundColor = '#00A400';
  }
}
;// CONCATENATED MODULE: ./src/content/interstitial_create_drive_validation.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall data_security_engineering
 *
 */



var interstitial_create_drive_validation_VALIDATION_ERROR = {
  DRIVE_NAME: 'Please provide a name for your drive',
  STORAGE_TYPE: 'Select at least one storage type',
  TPA_NUMBER: 'TPA number is invalid'
};
var VALIDATION_DRIVE_NAME_ERROR_DIV_ID = 'meta_data_protection_create_drive_drive_name_error';
var VALIDATION_STORAGE_TYPES_ERROR_DIV_ID = 'meta_data_protection_create_drive_storage_types_error';
var VALIDATION_TPA_ERROR_DIV_ID = 'meta_data_protection_create_drive_tpa_error';
function interstitial_create_drive_validation_getValidationErrors(document) {
  var validationErrors = [];
  if (!interstitial_create_drive_validation_requiredInputFieldFilled(document, CREATE_DRIVE_NAME_INPUT_ID)) {
    validationErrors.push(interstitial_create_drive_validation_VALIDATION_ERROR.DRIVE_NAME);
  }
  if (!validateDataStorageType(document, DATA_STORAGE_TYPE_INPUT_CLASS)) {
    validationErrors.push(interstitial_create_drive_validation_VALIDATION_ERROR.STORAGE_TYPE);
  }
  if (!tpaInputValid(document, TPA_NUMBER_INPUT_ID)) {
    validationErrors.push(interstitial_create_drive_validation_VALIDATION_ERROR.TPA_NUMBER);
  }
  return validationErrors;
}
function interstitial_create_drive_validation_requiredInputFieldFilled(document, inputID) {
  var inputElement = document.getElementById(inputID);
  return inputElement instanceof HTMLInputElement && inputElement.value !== '';
}
function validateDataStorageType(document, selector) {
  var selectedDataTypes = document.querySelectorAll("input[class=".concat(selector, "]:checked"));
  var selectedValues = Array.from(selectedDataTypes).map(function (element) {
    return element instanceof HTMLInputElement ? element.value : '';
  }).filter(function (value) {
    return value !== '';
  });
  return selectedValues.length > 0;
}
function tpaInputValid(document, inputID) {
  var inputElement = document.getElementById(inputID);
  if (inputElement instanceof HTMLInputElement) {
    if (inputElement.value === '') {
      return true;
    }
    return VALIDATE_TPA_NUMBER_FN(inputElement.value);
  }
  return true;
}
function updateCreateButtonState(document, disabled) {
  var createButton = document.getElementById(INTERSTITIAL_CREATE_BUTTON_DOM_ID);
  if (createButton instanceof HTMLButtonElement) {
    createButton.disabled = disabled;
  }
}
function interstitial_create_drive_validation_updateValidationError(showError, document, errorMsg) {
  var errorDivID = '';
  switch (errorMsg) {
    case interstitial_create_drive_validation_VALIDATION_ERROR.DRIVE_NAME:
      errorDivID = VALIDATION_DRIVE_NAME_ERROR_DIV_ID;
      break;
    case interstitial_create_drive_validation_VALIDATION_ERROR.STORAGE_TYPE:
      errorDivID = VALIDATION_STORAGE_TYPES_ERROR_DIV_ID;
      break;
    case interstitial_create_drive_validation_VALIDATION_ERROR.TPA_NUMBER:
      errorDivID = VALIDATION_TPA_ERROR_DIV_ID;
      break;
  }
  if (errorDivID) {
    updateErrorText(document, showError, errorMsg, errorDivID);
  }
}
function updateErrorText(document, showError, errorMsg, errorDivId) {
  var errorDiv = document.getElementById(errorDivId);
  if (errorDiv) {
    errorDiv.innerText = showError ? errorMsg : '';
  }
}
;// CONCATENATED MODULE: ./src/content/interstitial_create_drive.js





function interstitial_create_drive_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = interstitial_create_drive_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function interstitial_create_drive_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return interstitial_create_drive_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return interstitial_create_drive_arrayLikeToArray(o, minLen); }
function interstitial_create_drive_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall data_security_engineering
 *
 */




var interstitial_create_drive_INTERSTITIAL_DOM_ID = 'meta_data_protection_create_drive_interstitial';
var INTERSTITIAL_MODAL_DOM_ID = 'meta_data_protection_interstitial_modal';
var INTERSTITIAL_CANCEL_BUTTON_DOM_ID = 'meta_data_protection_cancel_button';
var INTERSTITIAL_CREATE_BUTTON_DOM_ID = 'meta_data_protection_create_drive_button';
var INTERSTITIAL_SCROLL_AREA_DOM_ID = 'meta_data_protection_scrollable_area';

// This is ordered in the way we want to display it in the modal
var CORP_DATA_CATEGORIES = new Map([[3, 'Internal Data'], [2, 'Employee Data'], [1, 'User Data'], [7, 'Customer Data'], [6, 'Contingent Worker Data'], [5, 'Candidate Data'], [4, 'Public Data']]);
var CREATE_DRIVE_NAME_INPUT_ID = 'meta_data_protection_drive_name_input';
var TPA_NUMBER_INPUT_ID = 'meta_data_protection_tpa_input';
var FADE_OUT_CSS_CLASS = 'meta_data_protection_fade_out';
var FADE_TOP_CSS_CLASS = 'top_overflowing';
var FADE_BOTTOM_CSS_CLASS = 'bottom_overflowing';
var DATA_STORAGE_TYPE_AREA_ID = 'meta_data_protection_storage_types_list';
var DATA_STORAGE_TYPE_HEADER_CLASS = 'meta_data_protection_storage_type_header';
var DATA_STORAGE_TYPE_INPUT_CLASS = 'meta_data_protection_storage_type_checkbox';
var DATA_STORAGE_TYPE_LABEL_ID = 'meta_data_protection_storage_type_label';
var interstitial_create_drive_VALIDATION_POLLING_INTERVAL_MS = 100;
var CreateDriveInterstitial = /*#__PURE__*/function () {
  function CreateDriveInterstitial(chrome, document, sessionUUID, corpDataTypes, domSelector) {
    var _this = this;
    classCallCheck_classCallCheck(this, CreateDriveInterstitial);
    defineProperty_defineProperty(this, "chrome", void 0);
    defineProperty_defineProperty(this, "document", void 0);
    defineProperty_defineProperty(this, "sessionUUID", void 0);
    defineProperty_defineProperty(this, "interstitialElement", void 0);
    defineProperty_defineProperty(this, "interstitialModal", void 0);
    defineProperty_defineProperty(this, "cancelButtonElement", void 0);
    defineProperty_defineProperty(this, "createButtonElement", void 0);
    defineProperty_defineProperty(this, "scrollAreaElement", void 0);
    defineProperty_defineProperty(this, "corpDataTypes", void 0);
    defineProperty_defineProperty(this, "googleModal", void 0);
    defineProperty_defineProperty(this, "inputValidationId", void 0);
    defineProperty_defineProperty(this, "state", void 0);
    defineProperty_defineProperty(this, "handleOutsideClick", function (event) {
      if (event.target === _this.interstitialElement) {
        _this.removeInterstitial();
      }
    });
    defineProperty_defineProperty(this, "handleCreateButtonClick", function (event) {
      if (event.target === _this.createButtonElement) {
        updateCreateButtonState(_this.document, true);
        _this.createDrive().then(function () {
          var newDrive = _this.state.createdDrive;
          if (newDrive) {
            _this.chrome.runtime.sendMessage({
              type: 'meta_create_drive_interstitial_drive_created',
              payload: {
                // eslint-disable-next-line camelcase
                session_uuid: _this.sessionUUID,
                // eslint-disable-next-line camelcase
                drive_id: newDrive
              }
            });
            logger_consoleDebug('Shared drive created with ID ', _this.state.createdDrive);
            _this.chrome.runtime.sendMessage({
              type: 'redirect_page_location',
              payload: {
                newURL: "https://drive.google.com/drive/folders/".concat(newDrive)
              }
            });
          }
        })["catch"](function (error) {
          logger_consoleDebug('Error encountered on drive creation: ', error);
        });
      }
      updateCreateButtonState(_this.document, false);
    });
    defineProperty_defineProperty(this, "handleCancelButtonClick", function (event) {
      if (event.target === _this.cancelButtonElement) {
        _this.removeInterstitial();
      }
    });
    defineProperty_defineProperty(this, "handleEscapePress", function (event) {
      if (event.key === 'Escape') {
        _this.removeInterstitial();
      }
    });
    defineProperty_defineProperty(this, "handleDataTypesScroll", function (event) {
      if (event.target instanceof HTMLElement) {
        var ele = event.target;
        var isScrolledToBottom = ele.scrollHeight < ele.clientHeight + ele.scrollTop + 1;
        var isScrolledToTop = isScrolledToBottom ? false : ele.scrollTop === 0;
        ele.classList.toggle(FADE_BOTTOM_CSS_CLASS, !isScrolledToBottom);
        ele.classList.toggle(FADE_TOP_CSS_CLASS, !isScrolledToTop);
      }
    });
    this.chrome = chrome;
    this.document = document;
    this.sessionUUID = sessionUUID;
    this.googleModal = new GoogleCreateDriveModal(chrome, sessionUUID, domSelector);
    this.state = {
      validationErrors: []
    };
    this.corpDataTypes = corpDataTypes;
  }
  createClass_createClass(CreateDriveInterstitial, [{
    key: "createDrive",
    value: function createDrive() {
      var _this2 = this;
      return new Promise(function (resolve) {
        var data = _this2.getFormData();
        if (_this2.createButtonElement instanceof HTMLButtonElement) {
          _this2.createButtonElement.innerHTML = '<div class="meta_data_protection_drive_creation_spinner"></div>';
        }

        // $FlowFixMe[incompatible-call]: https://developer.chrome.com/docs/extensions/reference/api/runtime
        _this2.chrome.runtime.sendMessage({
          type: 'create_shared_drive',
          payload: {
            sessionUUID: _this2.sessionUUID,
            driveName: data.driveName,
            associatedTPA: data.tpaNumber,
            dataTypes: data.storageTypes,
            dataCategories: data.storageCategories,
            inferredDssLevel: data.inferredDssLevel
          }
        }, function (response) {
          if (_this2.createButtonElement instanceof HTMLButtonElement) {
            _this2.createButtonElement.innerHTML = 'Create';
          }
          if (chrome.runtime.lastError || !response.payload.sharedDriveId) {
            logger_consoleDebug('Error creating shared drive: ', chrome.runtime.lastError ? chrome.runtime.lastError : 'Error response from server');
            _this2.createDriveFallback();
          } else {
            _this2.state.createdDrive = response.payload.sharedDriveId;
          }
          resolve();
        });
      });
    }
  }, {
    key: "createDriveFallback",
    value: function createDriveFallback() {
      var driveNameInput = document.getElementById(CREATE_DRIVE_NAME_INPUT_ID);
      if (driveNameInput instanceof HTMLInputElement) {
        this.googleModal.createDrive(driveNameInput.value);
      }
      this.removeInterstitial();
    }
  }, {
    key: "downloadAndRenderDataProtectionInterstitial",
    value: function () {
      var _downloadAndRenderDataProtectionInterstitial = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
        var response, html;
        return regenerator.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return fetch(this.chrome.runtime.getURL('/interstitial_create_drive.html'));
            case 3:
              response = _context.sent;
              _context.next = 6;
              return response.text();
            case 6:
              html = _context.sent;
              this.renderInterstitial(html);
              _context.next = 13;
              break;
            case 10:
              _context.prev = 10;
              _context.t0 = _context["catch"](0);
              logger_consoleDebug("Error downloading and rendering interstitial.html: ".concat(_context.t0));
            case 13:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[0, 10]]);
      }));
      function downloadAndRenderDataProtectionInterstitial() {
        return _downloadAndRenderDataProtectionInterstitial.apply(this, arguments);
      }
      return downloadAndRenderDataProtectionInterstitial;
    }()
  }, {
    key: "renderInterstitial",
    value: function renderInterstitial(html) {
      // Return early if the interstitial is already shown
      if (this.interstitialElement) {
        return;
      }
      this.addInterstitialToDom(html);
      this.addDataTypesToInterstitial();
      this.registerEventHandlers();
      this.validateInputLoop();
      this.chrome.runtime.sendMessage({
        type: 'meta_create_drive_interstitial_shown',
        payload: {
          // eslint-disable-next-line camelcase
          session_uuid: this.sessionUUID
        }
      });
    }
  }, {
    key: "addDataTypesToInterstitial",
    value: function addDataTypesToInterstitial() {
      var dataTypesArea = document.getElementById(DATA_STORAGE_TYPE_AREA_ID);
      if (dataTypesArea == null) {
        return;
      }

      // Create a div for each parent category and create title elements for
      // each category section
      var categoryContainers = new Map();
      var _iterator = interstitial_create_drive_createForOfIteratorHelper(CORP_DATA_CATEGORIES),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = slicedToArray_slicedToArray(_step.value, 2),
            id = _step$value[0],
            category = _step$value[1];
          var container = document.createElement('div');
          var categoryTitle = document.createElement('p');
          categoryTitle.classList.add(DATA_STORAGE_TYPE_HEADER_CLASS);
          categoryTitle.innerHTML = "<b>".concat(category, "</b>");
          container.appendChild(categoryTitle);
          categoryContainers.set(id, container);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var _iterator2 = interstitial_create_drive_createForOfIteratorHelper(this.corpDataTypes),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _CORP_DATA_CATEGORIES, _categoryContainers$g;
          var dataType = _step2.value;
          var typeArea = document.createElement('li');

          // Create data type checkbox
          var typeCheckbox = document.createElement('input');
          typeCheckbox.type = 'checkbox';
          typeCheckbox.id = dataType.id;
          typeCheckbox.value = dataType.id;
          typeCheckbox.setAttribute('data-dss-level', dataType.dss_level.toString());
          typeCheckbox.setAttribute('data-data-category', dataType.data_category.toString());
          typeCheckbox.classList.add(DATA_STORAGE_TYPE_INPUT_CLASS);

          // Create data type label area
          var typeLabel = document.createElement('label');
          typeLabel.htmlFor = dataType.id;
          typeLabel.classList.add(DATA_STORAGE_TYPE_LABEL_ID);

          // Create data type label header and description
          var typeNameDisplay = document.createElement('p');
          typeNameDisplay.innerText = dataType.title === 'Other' ? "Other ".concat((_CORP_DATA_CATEGORIES = CORP_DATA_CATEGORIES.get(dataType.data_category)) !== null && _CORP_DATA_CATEGORIES !== void 0 ? _CORP_DATA_CATEGORIES : '') : dataType.title;
          typeLabel.appendChild(typeNameDisplay);
          typeArea.appendChild(typeCheckbox);
          typeArea.appendChild(typeLabel);
          (_categoryContainers$g = categoryContainers.get(dataType.data_category)) === null || _categoryContainers$g === void 0 || _categoryContainers$g.appendChild(typeArea);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      var _iterator3 = interstitial_create_drive_createForOfIteratorHelper(categoryContainers.values()),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var e = _step3.value;
          dataTypesArea.append(e);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
  }, {
    key: "removeInterstitial",
    value: function removeInterstitial() {
      var _this$interstitialMod,
        _this3 = this;
      this.googleModal.closeModal();
      this.unregisterEventHandlers();
      (_this$interstitialMod = this.interstitialModal) === null || _this$interstitialMod === void 0 || _this$interstitialMod.classList.add(FADE_OUT_CSS_CLASS);
      clearInterval(this.inputValidationId);
      setTimeout(function () {
        if (_this3.interstitialElement) {
          _this3.interstitialElement.remove();
          _this3.interstitialElement = null;
          _this3.interstitialModal = null;
          _this3.cancelButtonElement = null;
          _this3.createButtonElement = null;
          _this3.scrollAreaElement = null;
        }
      }, 300);
    }
  }, {
    key: "addInterstitialToDom",
    value: function addInterstitialToDom(html) {
      var _this$document$body;
      var container = this.document.createElement('div');
      container.innerHTML = html;
      (_this$document$body = this.document.body) === null || _this$document$body === void 0 || _this$document$body.appendChild(container);
      logger_consoleDebug('Rendered data protection shared drive creation interstitial');
      this.interstitialElement = this.document.getElementById(interstitial_create_drive_INTERSTITIAL_DOM_ID);
      this.interstitialModal = this.document.getElementById(INTERSTITIAL_MODAL_DOM_ID);
      this.cancelButtonElement = this.document.getElementById(INTERSTITIAL_CANCEL_BUTTON_DOM_ID);
      this.createButtonElement = this.document.getElementById(INTERSTITIAL_CREATE_BUTTON_DOM_ID);
      this.scrollAreaElement = this.document.getElementById(INTERSTITIAL_SCROLL_AREA_DOM_ID);
      if (this.interstitialElement != null) {
        this.interstitialElement.style.display = 'flex';
      }
    }
  }, {
    key: "validateInputLoop",
    value: function validateInputLoop() {
      var _this4 = this;
      this.inputValidationId = setInterval(function () {
        return _this4.validateInput();
      }, interstitial_create_drive_VALIDATION_POLLING_INTERVAL_MS);
    }
  }, {
    key: "validateInput",
    value: function validateInput() {
      var validationErrors = interstitial_create_drive_validation_getValidationErrors(this.document);
      for (var _i = 0, _Object$entries = Object.entries(interstitial_create_drive_validation_VALIDATION_ERROR); _i < _Object$entries.length; _i++) {
        var _Object$entries$_i = slicedToArray_slicedToArray(_Object$entries[_i], 2),
          _ = _Object$entries$_i[0],
          errorMsg = _Object$entries$_i[1];
        if (validationErrors.includes(errorMsg) === this.state.validationErrors.includes(errorMsg)) {
          continue;
        }
        interstitial_create_drive_validation_updateValidationError(validationErrors.includes(errorMsg), this.document, errorMsg);
      }
      updateCreateButtonState(this.document, validationErrors.length > 0);
      this.state.validationErrors = validationErrors;
    }
  }, {
    key: "registerEventHandlers",
    value: function registerEventHandlers() {
      var _this$interstitialEle, _this$cancelButtonEle, _this$createButtonEle, _this$scrollAreaEleme;
      document.addEventListener('keydown', this.handleEscapePress);
      (_this$interstitialEle = this.interstitialElement) === null || _this$interstitialEle === void 0 || _this$interstitialEle.addEventListener('click', this.handleOutsideClick);
      (_this$cancelButtonEle = this.cancelButtonElement) === null || _this$cancelButtonEle === void 0 || _this$cancelButtonEle.addEventListener('click', this.handleCancelButtonClick);
      (_this$createButtonEle = this.createButtonElement) === null || _this$createButtonEle === void 0 || _this$createButtonEle.addEventListener('click', this.handleCreateButtonClick);
      (_this$scrollAreaEleme = this.scrollAreaElement) === null || _this$scrollAreaEleme === void 0 || _this$scrollAreaEleme.addEventListener('scroll', this.handleDataTypesScroll);
    }
  }, {
    key: "getFormData",
    value: function getFormData() {
      // Get drive name input value
      var driveNameField = document.getElementById(CREATE_DRIVE_NAME_INPUT_ID);
      var driveName = driveNameField instanceof HTMLInputElement ? driveNameField.value : '';

      // Get selected data storage types
      var selectedStorageTypes = document.querySelectorAll("input[class=".concat(DATA_STORAGE_TYPE_INPUT_CLASS, "]:checked"));
      var dataTypes = [];
      var dataCategories = [];
      var maxDssLevel = 1;
      selectedStorageTypes.forEach(function (element) {
        if (element instanceof HTMLInputElement) {
          dataTypes.push(element.value);
          if (Number(element.dataset.dssLevel) > maxDssLevel) {
            maxDssLevel = Number(element.dataset.dssLevel);
          }
          dataCategories.push(element.dataset.dataCategory);
        }
      });

      // Get TPA input value
      var tpaNumberField = document.getElementById(TPA_NUMBER_INPUT_ID);
      var tpaNumber = tpaNumberField instanceof HTMLInputElement ? tpaNumberField.value : '';
      return {
        driveName: driveName,
        storageTypes: dataTypes,
        storageCategories: dataCategories,
        inferredDssLevel: maxDssLevel.toString(),
        tpaNumber: tpaNumber
      };
    }
  }, {
    key: "unregisterEventHandlers",
    value: function unregisterEventHandlers() {
      var _this$interstitialEle2, _this$cancelButtonEle2, _this$scrollAreaEleme2;
      this.document.removeEventListener('keydown', this.handleEscapePress);
      (_this$interstitialEle2 = this.interstitialElement) === null || _this$interstitialEle2 === void 0 || _this$interstitialEle2.removeEventListener('click', this.handleOutsideClick);
      (_this$cancelButtonEle2 = this.cancelButtonElement) === null || _this$cancelButtonEle2 === void 0 || _this$cancelButtonEle2.removeEventListener('click', this.handleCancelButtonClick);
      (_this$scrollAreaEleme2 = this.scrollAreaElement) === null || _this$scrollAreaEleme2 === void 0 || _this$scrollAreaEleme2.removeEventListener('scroll', this.handleDataTypesScroll);
    }
  }]);
  return CreateDriveInterstitial;
}();
;// CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/rng.js
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}
;// CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/regex.js
/* harmony default export */ const regex = (/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i);
;// CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/validate.js


function validate(uuid) {
  return typeof uuid === 'string' && regex.test(uuid);
}

/* harmony default export */ const esm_browser_validate = (validate);
;// CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/stringify.js

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

var byteToHex = [];

for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!esm_browser_validate(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

/* harmony default export */ const esm_browser_stringify = (stringify);
;// CONCATENATED MODULE: ./node_modules/uuid/dist/esm-browser/v4.js



function v4(options, buf, offset) {
  options = options || {};
  var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (var i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return esm_browser_stringify(rnds);
}

/* harmony default export */ const esm_browser_v4 = (v4);
;// CONCATENATED MODULE: ./src/core/constants.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */

/**
 * The application id is: 846503530449488
 * the dashboard: https://developers.facebook.com/apps/846503530449488/dashboard/
 * capabilities: https://www.internalfb.com/intern/platform/talent/application_details.php?app_id=846503530449488
 */
var constants_appAccessToken = '846503530449488|567929bb562b7b0af23868c0e3769828';

// the redirect URL prefixes when a user is not logged in to intern or requires re-auth
// these are collected from actual samples & list in https://fburl.com/code/8hq9ghz6
var constants_loginURLPrefixes = (/* unused pure expression or super */ null && (['https://www.internalfb.com/login', 'https://www.internalfb.com/intern/login', 'https://www.internalfb.com/intern/auth', 'https://www.internalfb.com/intern/mdm', 'https://www.internalfb.com/intern/fbz/run/request/certs/', 'https://www.internalfb.com/intern/security/sks_oauth/']));
var BETA_CHROME_ID = 'kmmebalcngjbbeiiagcjhmkeanmjpglc';
var constants_PRODUCTION_CHROME_ID = 'iilloeljhmkmakgkcahhghoaofbikgne';
var constants_BATCHEXECUTE_U1T5P = 'batchexecute_U1t5p';
var RESOURCES_POLICY_CHECK = 'resources_policy_check';
var RECIPIENTS_POLICY_CHECK = 'recipients_policy_check';
var CREATE_DRIVE_CALL = 'create_shared_drive';

// RFC 5322 compliant regex from http://emailregex.com/
var EMAIL_REGEX =
// eslint-disable-next-line
/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gm;
var INTERNAL_META_DOMAINS = ['meta.com', 'fb.com', 'instagram.com', 'oculus.com', 'whatsapp.com', 'gsuitelabs.fb.com', 'gsuitetest.fb.com', 'business.fb.com', 'support.fb.com', 'pdo.fb.com', 'co.fb.com', 'waco.fb.com', 'bi.fb.com', 'rpsn.fb.com', 'dro.fb.com', 'lpo.fb.com', 'comm.fb.com', 'fbp.fb.com', 'mo.fb.com', 'finance.fb.com', 'supportcenter.fb.com'];
;// CONCATENATED MODULE: ./src/core/storage.js






/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */



var USERNAME_TOKEN_KEY = 'username';
var CONFIG_TOKEN_KEY = 'configCache';
var UUID_TOKEN_KEY = 'uuid';
var ODS_ENTRIES_TOKEN_KEY = 'odsEntries';
var storage_ConfigStorage = /*#__PURE__*/function () {
  function ConfigStorage(storage) {
    classCallCheck_classCallCheck(this, ConfigStorage);
    defineProperty_defineProperty(this, "storage", void 0);
    this.storage = storage;
  }
  createClass_createClass(ConfigStorage, [{
    key: "getConfig",
    value: function () {
      var _getConfig = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
        var _this = this;
        return regenerator.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt("return", new Promise(function (resolve) {
                _this.storage.local.get(CONFIG_TOKEN_KEY, function (res) {
                  var _res$CONFIG_TOKEN_KEY, _JSON$stringify;
                  var configCache = (_res$CONFIG_TOKEN_KEY = res[CONFIG_TOKEN_KEY]) !== null && _res$CONFIG_TOKEN_KEY !== void 0 ? _res$CONFIG_TOKEN_KEY : null;
                  logger_consoleDebug("Stored config: ".concat((_JSON$stringify = JSON.stringify(configCache)) !== null && _JSON$stringify !== void 0 ? _JSON$stringify : ''));
                  resolve(configCache);
                });
              }));
            case 1:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      function getConfig() {
        return _getConfig.apply(this, arguments);
      }
      return getConfig;
    }()
  }, {
    key: "storeConfig",
    value: function () {
      var _storeConfig = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(config) {
        var _this2 = this;
        return regenerator.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return new Promise(function (resolve) {
                var timestamp = Date.now();
                var configCache = {
                  config: config,
                  timestamp: timestamp
                };
                _this2.storage.local.set({
                  configCache: configCache
                }, function () {
                  logger_consoleDebug('Config stored');
                  resolve();
                });
              });
            case 2:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      }));
      function storeConfig(_x) {
        return _storeConfig.apply(this, arguments);
      }
      return storeConfig;
    }()
  }]);
  return ConfigStorage;
}();
var storage_OdsStorage = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function OdsStorage(storage) {
    _classCallCheck(this, OdsStorage);
    _defineProperty(this, "storage", void 0);
    this.storage = storage;
  }
  _createClass(OdsStorage, [{
    key: "addOdsEntries",
    value: function () {
      var _addOdsEntries = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(entries) {
        var _this3 = this;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return new Promise(function (resolve) {
                _this3.storage.local.get(ODS_ENTRIES_TOKEN_KEY, function (res) {
                  var _res$ODS_ENTRIES_TOKE, _JSON$stringify2;
                  var odsEntries = (_res$ODS_ENTRIES_TOKE = res[ODS_ENTRIES_TOKEN_KEY]) !== null && _res$ODS_ENTRIES_TOKE !== void 0 ? _res$ODS_ENTRIES_TOKE : [];
                  consoleDebug("Stored ODS entries: ".concat((_JSON$stringify2 = JSON.stringify(odsEntries)) !== null && _JSON$stringify2 !== void 0 ? _JSON$stringify2 : ''));
                  _this3.storage.local.set(_defineProperty({}, ODS_ENTRIES_TOKEN_KEY, [].concat(_toConsumableArray(odsEntries), _toConsumableArray(entries))), function () {
                    consoleDebug('ODS entries added');
                    resolve();
                  });
                });
              });
            case 2:
            case "end":
              return _context3.stop();
          }
        }, _callee3);
      }));
      function addOdsEntries(_x2) {
        return _addOdsEntries.apply(this, arguments);
      }
      return addOdsEntries;
    }()
  }, {
    key: "getOdsEntries",
    value: function () {
      var _getOdsEntries = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
        var _this4 = this;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              return _context4.abrupt("return", new Promise(function (resolve) {
                _this4.storage.local.get(ODS_ENTRIES_TOKEN_KEY, function (res) {
                  var _res$ODS_ENTRIES_TOKE2, _JSON$stringify3;
                  var odsEntries = (_res$ODS_ENTRIES_TOKE2 = res[ODS_ENTRIES_TOKEN_KEY]) !== null && _res$ODS_ENTRIES_TOKE2 !== void 0 ? _res$ODS_ENTRIES_TOKE2 : [];
                  consoleDebug("Stored ODS entries: ".concat((_JSON$stringify3 = JSON.stringify(odsEntries)) !== null && _JSON$stringify3 !== void 0 ? _JSON$stringify3 : ''));
                  resolve(odsEntries);
                });
              }));
            case 1:
            case "end":
              return _context4.stop();
          }
        }, _callee4);
      }));
      function getOdsEntries() {
        return _getOdsEntries.apply(this, arguments);
      }
      return getOdsEntries;
    }()
  }, {
    key: "clearOdsEntries",
    value: function () {
      var _clearOdsEntries = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
        var _this5 = this;
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return new Promise(function (resolve) {
                _this5.storage.local.remove(ODS_ENTRIES_TOKEN_KEY, function () {
                  consoleDebug('ODS entries cleared');
                  resolve();
                });
              });
            case 2:
            case "end":
              return _context5.stop();
          }
        }, _callee5);
      }));
      function clearOdsEntries() {
        return _clearOdsEntries.apply(this, arguments);
      }
      return clearOdsEntries;
    }()
  }]);
  return OdsStorage;
}()));
var storage_TabStorage = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function TabStorage(storage) {
    _classCallCheck(this, TabStorage);
    _defineProperty(this, "storage", void 0);
    this.storage = storage;
  }
  _createClass(TabStorage, [{
    key: "getTabData",
    value: function () {
      var _getTabData = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6(tabId) {
        var _this6 = this;
        var tabIdStr;
        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              tabIdStr = tabId.toString();
              return _context6.abrupt("return", new Promise(function (resolve) {
                // $FlowFixMe[prop-missing]: flow-interfaces-chrome is not aware of sessions which is new storage area
                // $FlowFixMe[incompatible-use]
                _this6.storage.session.get(tabIdStr, function (res) {
                  var _res$tabIdStr;
                  var data = (_res$tabIdStr = res[tabIdStr]) !== null && _res$tabIdStr !== void 0 ? _res$tabIdStr : null;
                  if (data != null) {
                    var tabData = JSON.parse(data);
                    consoleDebug("Stored tab data: ".concat(data !== null && data !== void 0 ? data : ''));
                    resolve(tabData);
                  } else {
                    resolve(null);
                  }
                });
              }));
            case 2:
            case "end":
              return _context6.stop();
          }
        }, _callee6);
      }));
      function getTabData(_x3) {
        return _getTabData.apply(this, arguments);
      }
      return getTabData;
    }()
  }, {
    key: "storeTabData",
    value: function () {
      var _storeTabData = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7(tabId, data) {
        var _this7 = this;
        var tabIdStr;
        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) switch (_context7.prev = _context7.next) {
            case 0:
              tabIdStr = tabId.toString();
              _context7.next = 3;
              return new Promise(function (resolve) {
                // $FlowFixMe[prop-missing]: flow-interfaces-chrome is not aware of sessions which is new storage area
                // $FlowFixMe[incompatible-use]
                _this7.storage.session.set(_defineProperty({}, tabIdStr, JSON.stringify(data)), function () {
                  consoleDebug('Tab data stored');
                  resolve();
                });
              });
            case 3:
            case "end":
              return _context7.stop();
          }
        }, _callee7);
      }));
      function storeTabData(_x4, _x5) {
        return _storeTabData.apply(this, arguments);
      }
      return storeTabData;
    }()
  }]);
  return TabStorage;
}()));

/**
 * This storage stores username and uuid (installation id).
 * If uuid is not present in the local storage,
 * this storage generates one and places it there.
 * The idea is that username might be absent
 * (see src/core/server_messages::getUsernameFromCsrinfo),
 * but uuid is always here.
 * Each signal to Scuba contains both username (perhaps, empty) and uuid.
 */
var storage_UsernameStorage = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function UsernameStorage(storage) {
    _classCallCheck(this, UsernameStorage);
    _defineProperty(this, "storage", void 0);
    this.storage = storage;
  }
  _createClass(UsernameStorage, [{
    key: "getUsernameData",
    value: function () {
      var _getUsernameData = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee8() {
        var _this8 = this;
        var uuid;
        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return this.getUuid();
            case 2:
              uuid = _context8.sent;
              return _context8.abrupt("return", new Promise(function (resolve) {
                _this8.storage.local.get(USERNAME_TOKEN_KEY, function (res) {
                  var username = res[USERNAME_TOKEN_KEY];
                  consoleDebug("Stored username: ".concat(username !== null && username !== void 0 ? username : ''));
                  resolve({
                    username: username,
                    uuid: uuid
                  });
                });
              }));
            case 4:
            case "end":
              return _context8.stop();
          }
        }, _callee8, this);
      }));
      function getUsernameData() {
        return _getUsernameData.apply(this, arguments);
      }
      return getUsernameData;
    }()
  }, {
    key: "storeUsername",
    value: function () {
      var _storeUsername = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee9(username) {
        var _this9 = this;
        return _regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) switch (_context9.prev = _context9.next) {
            case 0:
              _context9.next = 2;
              return new Promise(function (resolve) {
                _this9.storage.local.set({
                  username: username
                }, function () {
                  consoleDebug('Username stored');
                  resolve();
                });
              });
            case 2:
            case "end":
              return _context9.stop();
          }
        }, _callee9);
      }));
      function storeUsername(_x6) {
        return _storeUsername.apply(this, arguments);
      }
      return storeUsername;
    }()
  }, {
    key: "getUuid",
    value: function () {
      var _getUuid = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee10() {
        var _this10 = this;
        return _regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) switch (_context10.prev = _context10.next) {
            case 0:
              return _context10.abrupt("return", new Promise(function (resolve) {
                _this10.storage.local.get(UUID_TOKEN_KEY, function (res) {
                  var uuid = res[UUID_TOKEN_KEY];
                  if (uuid != null) {
                    resolve(uuid);
                  } else {
                    var uuidNew = uuidv4();
                    _this10.storeUuid(uuidNew).then(function () {
                      consoleDebug("Stored uuid: ".concat(uuidNew));
                      resolve(uuidNew);
                    });
                  }
                });
              }));
            case 1:
            case "end":
              return _context10.stop();
          }
        }, _callee10);
      }));
      function getUuid() {
        return _getUuid.apply(this, arguments);
      }
      return getUuid;
    }()
  }, {
    key: "storeUuid",
    value: function () {
      var _storeUuid = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee11(uuid) {
        var _this11 = this;
        return _regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) switch (_context11.prev = _context11.next) {
            case 0:
              _context11.next = 2;
              return new Promise(function (resolve) {
                _this11.storage.local.set({
                  uuid: uuid
                }, function () {
                  consoleDebug('UUID stored');
                  resolve();
                });
              });
            case 2:
            case "end":
              return _context11.stop();
          }
        }, _callee11);
      }));
      function storeUuid(_x7) {
        return _storeUuid.apply(this, arguments);
      }
      return storeUuid;
    }()
  }]);
  return UsernameStorage;
}()));
;// CONCATENATED MODULE: ./src/core/server_messages.js





/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */





var LOG_URL = "https://graph.facebook.com/blackbird_logs";
var CSRINFO_URL = "https://www.internalfb.com/intern/auth/mobilehome/csrinfo";
var LOG_TYPE = 'DATA_PROTECTION';
var server_messages_ServerMessageSender = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function ServerMessageSender(extensionId, extensionVersion, usernameStorage, tabStorage, odsClient) {
    _classCallCheck(this, ServerMessageSender);
    _defineProperty(this, "extensionId", void 0);
    _defineProperty(this, "extensionVersion", void 0);
    _defineProperty(this, "usernameStorage", void 0);
    _defineProperty(this, "tabStorage", void 0);
    _defineProperty(this, "odsClient", void 0);
    this.extensionId = extensionId;
    this.extensionVersion = extensionVersion;
    this.usernameStorage = usernameStorage;
    this.tabStorage = tabStorage;
    this.odsClient = odsClient;
  }
  _createClass(ServerMessageSender, [{
    key: "sendMessage",
    value: function sendMessage(message) {
      consoleDebug("Sending log: ".concat(message.action));
      this.doAsyncJobs(message).then(function () {
        consoleDebug('Log has been sent.');
      });
    }
  }, {
    key: "doAsyncJobs",
    value: function () {
      var _doAsyncJobs = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(message) {
        var usernameData;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.getUsernameData();
            case 2:
              usernameData = _context.sent;
              _context.next = 5;
              return this.sendLogToServer(message, usernameData);
            case 5:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function doAsyncJobs(_x) {
        return _doAsyncJobs.apply(this, arguments);
      }
      return doAsyncJobs;
    }()
  }, {
    key: "genLogMessage",
    value: function genLogMessage(message, usernameData) {
      var _usernameData$usernam, _message$payload$docu, _message$payload, _message$payload$reci, _message$payload2, _message$payload$erro, _message$payload3, _message$account, _message$url, _message$referrer_url, _message$payload$shar, _message$payload4, _message$payload$sess, _message$payload5;
      /* eslint-disable camelcase */
      return {
        timestamp: new Date().getTime(),
        log_type: LOG_TYPE,
        extension_id: this.extensionId,
        extension_version: this.extensionVersion,
        extension_uuid: usernameData.uuid,
        src_user: (_usernameData$usernam = usernameData.username) !== null && _usernameData$usernam !== void 0 ? _usernameData$usernam : null,
        action: message.action,
        document_id: (_message$payload$docu = (_message$payload = message.payload) === null || _message$payload === void 0 ? void 0 : _message$payload.document_id) !== null && _message$payload$docu !== void 0 ? _message$payload$docu : null,
        recipients: (_message$payload$reci = (_message$payload2 = message.payload) === null || _message$payload2 === void 0 ? void 0 : _message$payload2.recipients) !== null && _message$payload$reci !== void 0 ? _message$payload$reci : null,
        error_msg: (_message$payload$erro = (_message$payload3 = message.payload) === null || _message$payload3 === void 0 ? void 0 : _message$payload3.error_msg) !== null && _message$payload$erro !== void 0 ? _message$payload$erro : null,
        account: (_message$account = message.account) !== null && _message$account !== void 0 ? _message$account : null,
        url: (_message$url = message.url) !== null && _message$url !== void 0 ? _message$url : null,
        referrer_url: (_message$referrer_url = message.referrer_url) !== null && _message$referrer_url !== void 0 ? _message$referrer_url : null,
        // $FlowFixMe[incompatible-call]: Fix the type definitions
        sharing_reasons: JSON.parse((_message$payload$shar = (_message$payload4 = message.payload) === null || _message$payload4 === void 0 ? void 0 : _message$payload4.sharing_reasons) !== null && _message$payload$shar !== void 0 ? _message$payload$shar : '{}'),
        session_uuid: (_message$payload$sess = (_message$payload5 = message.payload) === null || _message$payload5 === void 0 ? void 0 : _message$payload5.session_uuid) !== null && _message$payload$sess !== void 0 ? _message$payload$sess : null
      };
      /* eslint-disable camelcase */
    }
  }, {
    key: "sendLogToServer",
    value: function () {
      var _sendLogToServer = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(message, usernameData) {
        var serverMessage, logs, formData, httpParams, response, text;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              this.odsClient.bumpKey(message.action);
              serverMessage = this.genLogMessage(message, usernameData);
              consoleDebug("Log: ".concat(JSON.stringify(serverMessage)));
              logs = [JSON.stringify(serverMessage)];
              formData = new URLSearchParams();
              formData.set('access_token', appAccessToken);
              formData.set('logs', JSON.stringify(logs));
              httpParams = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'include',
                redirect: 'follow',
                body: formData
              };
              _context2.next = 10;
              return fetch(LOG_URL, httpParams);
            case 10:
              response = _context2.sent;
              _context2.next = 13;
              return response.text();
            case 13:
              text = _context2.sent;
              consoleDebug("Response text: ".concat(text));
              return _context2.abrupt("return", response);
            case 16:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function sendLogToServer(_x2, _x3) {
        return _sendLogToServer.apply(this, arguments);
      }
      return sendLogToServer;
    }()
  }, {
    key: "getUsernameData",
    value: function () {
      var _getUsernameData = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        var data, username;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return this.usernameStorage.getUsernameData();
            case 2:
              data = _context3.sent;
              if (!(data.username != null)) {
                _context3.next = 7;
                break;
              }
              return _context3.abrupt("return", data);
            case 7:
              _context3.next = 9;
              return this.getUsernameFromCsrinfo();
            case 9:
              username = _context3.sent;
              if (!(username != null)) {
                _context3.next = 16;
                break;
              }
              _context3.next = 13;
              return this.usernameStorage.storeUsername(username);
            case 13:
              return _context3.abrupt("return", {
                username: username,
                uuid: data.uuid
              });
            case 16:
              return _context3.abrupt("return", data);
            case 17:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this);
      }));
      function getUsernameData() {
        return _getUsernameData.apply(this, arguments);
      }
      return getUsernameData;
    }() // Obtaining username from csrinfo endpoint:
    // https://www.internalfb.com/intern/wiki/Client_Platform_Engineering/Internal/ChromeOS/Client_Certificates/
    // The endpoint requres the user to be authorised on internalfb.
    // Otherwise, no information is returned.
    //
    // Example response:
    // 'for (;;);{"L":"<dummy>","O":"Facebook Inc","OU":"<dummy>","CN":"bob",
    // "emailAddress":"bob\u0040fb.com","MDMDevices":[{"fbid":"<dummy>",
    // "model":"<dummy>","platform":"<dummy>","serialNumber":"<dummy>",
    // "macAddress":"<dummy>","registeredDate":1602493275831}]}'
  }, {
    key: "getUsernameFromCsrinfo",
    value: function () {
      var _getUsernameFromCsrinfo = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
        var response, uuid, text, usernameJson;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return fetch(CSRINFO_URL);
            case 2:
              response = _context4.sent;
              if (!(!response.ok || response.body == null)) {
                _context4.next = 6;
                break;
              }
              consoleDebug("Can't load csrInfo.");
              return _context4.abrupt("return", null);
            case 6:
              if (!response.redirected) {
                _context4.next = 14;
                break;
              }
              if (!loginURLPrefixes.some(function (prefix) {
                return response.url.startsWith(prefix);
              })) {
                _context4.next = 14;
                break;
              }
              consoleDebug("Can't fetch csrinfo as user is not logged in");
              _context4.next = 11;
              return this.usernameStorage.getUuid();
            case 11:
              uuid = _context4.sent;
              this.sendLogToServer({
                action: 'csrinfo_not_logged_in',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: JSON.stringify({
                    status: response.status,
                    responseURL: response.url
                  })
                }
              }, {
                username: null,
                uuid: uuid
              });
              return _context4.abrupt("return", null);
            case 14:
              _context4.prev = 14;
              _context4.next = 17;
              return response.text();
            case 17:
              text = _context4.sent;
              consoleDebug("text: ".concat(text));
              usernameJson = JSON.parse(text.slice(9));
              consoleDebug("usernameJson: ".concat(usernameJson['CN']));
              return _context4.abrupt("return", usernameJson['CN']);
            case 24:
              _context4.prev = 24;
              _context4.t0 = _context4["catch"](14);
              consoleDebug("Can't parse csrInfo");
              consoleDebug("".concat(_context4.t0.name, ": ").concat(_context4.t0.message));
              return _context4.abrupt("return", null);
            case 29:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this, [[14, 24]]);
      }));
      function getUsernameFromCsrinfo() {
        return _getUsernameFromCsrinfo.apply(this, arguments);
      }
      return getUsernameFromCsrinfo;
    }()
  }]);
  return ServerMessageSender;
}()));
;// CONCATENATED MODULE: ./src/core/errors.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */










function errors_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = errors_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function errors_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return errors_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return errors_arrayLikeToArray(o, minLen); }
function errors_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var errors_CSRFNotOKStatus = /*#__PURE__*/(/* unused pure expression or super */ null && (function (_Error) {
  _inherits(CSRFNotOKStatus, _Error);
  function CSRFNotOKStatus(message) {
    var _this;
    _classCallCheck(this, CSRFNotOKStatus);
    _this = _callSuper(this, CSRFNotOKStatus, [message]);
    _this.name = 'CSRFNotOKStatus';
    return _this;
  }
  return _createClass(CSRFNotOKStatus);
}( /*#__PURE__*/_wrapNativeSuper(Error))));
var errors_CSRFEmptyBody = /*#__PURE__*/(/* unused pure expression or super */ null && (function (_Error2) {
  _inherits(CSRFEmptyBody, _Error2);
  function CSRFEmptyBody(message) {
    var _this2;
    _classCallCheck(this, CSRFEmptyBody);
    _this2 = _callSuper(this, CSRFEmptyBody, [message]);
    _this2.name = 'CSRFEmptyBody';
    return _this2;
  }
  return _createClass(CSRFEmptyBody);
}( /*#__PURE__*/_wrapNativeSuper(Error))));
/*
 * Mapping of type of error and the string keyword that exists in the HTML
 * error page that are uniquely tied to the type of error
 */
var ERROR_TYPE_STRING_KEYWORD = new Map([['SI_CSRF', 'si_csrf'], ['AIRLOCK', 'airlock'], ['PROTECTED_MODE', 'protected mode violation'], ['ENDPOINT_PERMISSION', 'permission required: blackbird_data_protection'], ['REQUIRED_CLASSES', 'url=/intern/required_classes/'], ['OFFICE_RAID', 'officeraid'], ['PASSWORD_CHANGE', 'url=/intern/password/'], ['TOO_MANY_CLIENTS', 'CryptoNetworkException: TTransportException(GATED) Too many clients']]);

/*
 * When the API responded with HTML page due to error, this function
 * attempts to parse it and returns the extracted error message.
 *
 * Extraction is using regex based on known error responses. Can't
 * use DOMParser because the code may run in the background where
 * it has no access to DOMParser object.
 */
function errors_getServerErrorType(response) {
  var _iterator = errors_createForOfIteratorHelper(ERROR_TYPE_STRING_KEYWORD),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _step$value = _slicedToArray(_step.value, 2),
        errorType = _step$value[0],
        keyword = _step$value[1];
      if (response.toLowerCase().includes(keyword.toLowerCase())) {
        return errorType;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return 'UNKNOWN';
}
;// CONCATENATED MODULE: ./src/core/csrf.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */

'use-strict';






var CSRF_URL = 'https://www.internalfb.com/intern/api/dtsg/internal';
var DTSG_KEY = 'dtsg';
var DTSG_CACHE_MARGIN = 60; // 1 minute

var GLOBAL_DTSG;

/*
 * This method will retrieve a valid CSRF token from either memory, session storage or dtsg endpoint
 *
 * DTSG is Metas's own improvement of CSRF
 * https://www.internalfb.com/intern/wiki/Cross_Site_Request_Forgery_(CSRF)/protecting-post-requests/
 *
 * To align with similar code, the exported function is named after CSRF, but internally
 * it uses the term DTSG instead of CSRF.
 */
function csrf_getCSRF(_x) {
  return _getCSRF.apply(this, arguments);
}
function _getCSRF() {
  _getCSRF = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(storage) {
    var currentEpoch, dtsg, response, text;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          // Add safety margin between retriving the cached token and expiration time
          // In memory cache is only as good as long as the service worker is active
          // and hasn't terminated due to timeout
          currentEpoch = Date.now() / 1000 + DTSG_CACHE_MARGIN;
          if (!(GLOBAL_DTSG != null && GLOBAL_DTSG.expire > currentEpoch)) {
            _context.next = 3;
            break;
          }
          return _context.abrupt("return", GLOBAL_DTSG.token);
        case 3:
          _context.next = 5;
          return getDTSGStorage(storage);
        case 5:
          dtsg = _context.sent;
          if (!(dtsg != null && dtsg.expire > currentEpoch)) {
            _context.next = 9;
            break;
          }
          GLOBAL_DTSG = dtsg;
          return _context.abrupt("return", dtsg.token);
        case 9:
          _context.next = 11;
          return fetch(CSRF_URL);
        case 11:
          response = _context.sent;
          if (!(response.status !== 200)) {
            _context.next = 14;
            break;
          }
          throw new CSRFNotOKStatus("Failed GraphQL fetch. Status Code: ".concat(response.status));
        case 14:
          _context.next = 16;
          return response.text();
        case 16:
          text = _context.sent;
          if (!(text == null)) {
            _context.next = 19;
            break;
          }
          throw new CSRFEmptyBody('Failed to get CSRF token');
        case 19:
          // dtsg response is prefixed with `for (;;);` to prevent naive eval in js
          // Ex: for (;;);{"token":"redacted:110:1678697012","valid_for":86400,"expire":1701253838}
          GLOBAL_DTSG = JSON.parse(text.slice(9));

          // Store retrieved token in both memory and session storage
          setDTSGStorage(storage, GLOBAL_DTSG);
          return _context.abrupt("return", GLOBAL_DTSG.token);
        case 22:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _getCSRF.apply(this, arguments);
}
function setDTSGStorage(_x2, _x3) {
  return _setDTSGStorage.apply(this, arguments);
}
function _setDTSGStorage() {
  _setDTSGStorage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(storage, dtsg) {
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return new Promise(function (resolve) {
            // $FlowFixMe[prop-missing]: flow-interfaces-chrome is not aware of sessions which is new storage area
            // $FlowFixMe[incompatible-use]
            storage.session.set(_defineProperty({}, DTSG_KEY, JSON.stringify(dtsg)), function () {
              consoleDebug('DTSG stored');
              resolve();
            });
          });
        case 2:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _setDTSGStorage.apply(this, arguments);
}
function getDTSGStorage(_x4) {
  return _getDTSGStorage.apply(this, arguments);
}
function _getDTSGStorage() {
  _getDTSGStorage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(storage) {
    return _regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          return _context3.abrupt("return", new Promise(function (resolve) {
            // $FlowFixMe[prop-missing]: flow-interfaces-chrome is not aware of sessions which is new storage area
            // $FlowFixMe[incompatible-use]
            storage.session.get([DTSG_KEY], function (result) {
              var data = result[DTSG_KEY];
              if (data != null) {
                var dtsg = JSON.parse(data);
                // Do not leak DTSG in the console!
                consoleDebug('stored DTSG retrieved');
                resolve(dtsg);
              } else {
                resolve(null);
              }
            });
          }));
        case 1:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _getDTSGStorage.apply(this, arguments);
}
;// CONCATENATED MODULE: ./src/core/policy_checker.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */













var POLICY_URL = "https://www.internalfb.com/intern/security/blackbird/chrome_data_protection/policy/";
var policy_checker_PolicyChecker = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function PolicyChecker(senderToServer, odsClient, storage, usernameStorage, extensionID, extensionVersion) {
    _classCallCheck(this, PolicyChecker);
    _defineProperty(this, "senderToServer", void 0);
    _defineProperty(this, "odsClient", void 0);
    _defineProperty(this, "storage", void 0);
    _defineProperty(this, "usernameStorage", void 0);
    _defineProperty(this, "extensionID", void 0);
    _defineProperty(this, "extensionVersion", void 0);
    this.senderToServer = senderToServer;
    this.odsClient = odsClient;
    this.storage = storage;
    this.usernameStorage = usernameStorage;
    this.extensionID = extensionID;
    this.extensionVersion = extensionVersion;
  }
  _createClass(PolicyChecker, [{
    key: "checkRecipients",
    value: function () {
      var _checkRecipients = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(sessionUUID, recipients) {
        var response;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (!(recipients.length === 0)) {
                _context.next = 3;
                break;
              }
              this.odsClient.addDataPoint('empty_check_recipients', 1);
              return _context.abrupt("return", []);
            case 3:
              _context.next = 5;
              return this.executeRequest({
                sessionUUID: sessionUUID,
                recipients: recipients
              });
            case 5:
              response = _context.sent;
              return _context.abrupt("return", response === null || response === void 0 ? void 0 : response['unauthorized_recipients']);
            case 7:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function checkRecipients(_x, _x2) {
        return _checkRecipients.apply(this, arguments);
      }
      return checkRecipients;
    }()
  }, {
    key: "checkResources",
    value: function () {
      var _checkResources = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(sessionUUID, resourceIDs) {
        var response;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              if (!(typeof resourceIDs === 'undefined' || resourceIDs.length === 0)) {
                _context2.next = 3;
                break;
              }
              this.odsClient.addDataPoint('empty_check_resource_ids', 1);
              return _context2.abrupt("return", []);
            case 3:
              _context2.next = 5;
              return this.executeRequest({
                sessionUUID: sessionUUID,
                resourceIDs: resourceIDs
              });
            case 5:
              response = _context2.sent;
              return _context2.abrupt("return", response === null || response === void 0 ? void 0 : response['sensitive_resource_ids']);
            case 7:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function checkResources(_x3, _x4) {
        return _checkResources.apply(this, arguments);
      }
      return checkResources;
    }()
  }, {
    key: "executeRequest",
    value: function () {
      var _executeRequest = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(request) {
        var _request$recipients, _request$resourceIDs;
        var csrfToken, usernameData, params, start, response, jsonp, timeSpentMs, _jsonp, responseText, errType;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              csrfToken = null;
              _context3.prev = 1;
              _context3.next = 4;
              return getCSRF(this.storage);
            case 4:
              csrfToken = _context3.sent;
              _context3.next = 11;
              break;
            case 7:
              _context3.prev = 7;
              _context3.t0 = _context3["catch"](1);
              this.senderToServer.sendMessage({
                action: 'csrf_token_fetch_error',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: "Error: ".concat(_context3.t0.name, ": ").concat(_context3.t0.message)
                }
              });
              return _context3.abrupt("return", null);
            case 11:
              _context3.next = 13;
              return this.usernameStorage.getUsernameData();
            case 13:
              usernameData = _context3.sent;
              params = new URLSearchParams({
                // eslint-disable-next-line camelcase
                fb_dtsg: csrfToken,
                // eslint-disable-next-line camelcase
                extension_uuid: usernameData.uuid,
                // eslint-disable-next-line camelcase
                extension_id: this.extensionID,
                // eslint-disable-next-line camelcase
                extension_version: this.extensionVersion,
                // eslint-disable-next-line camelcase
                session_uuid: request['sessionUUID']
              });
              appendArrayToParams((_request$recipients = request['recipients']) !== null && _request$recipients !== void 0 ? _request$recipients : [], 'recipients', params);
              appendArrayToParams((_request$resourceIDs = request['resourceIDs']) !== null && _request$resourceIDs !== void 0 ? _request$resourceIDs : [], 'resource_ids', params);
              start = performance.now();
              _context3.next = 20;
              return fetch(POLICY_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
              });
            case 20:
              response = _context3.sent;
              if (!(!response.ok || response.body == null)) {
                _context3.next = 25;
                break;
              }
              consoleDebug('Policy check request failed');
              this.senderToServer.sendMessage({
                action: 'policy_check_error',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: JSON.stringify({
                    status: response.status,
                    responseURL: response.url
                  })
                }
              });
              return _context3.abrupt("return", null);
            case 25:
              if (!response.redirected) {
                _context3.next = 30;
                break;
              }
              if (!loginURLPrefixes.some(function (prefix) {
                return response.url.startsWith(prefix);
              })) {
                _context3.next = 30;
                break;
              }
              // This should only happen if user is loggedout between last configuration check and now
              consoleDebug("Can't run policy check as user is not logged in");
              this.senderToServer.sendMessage({
                action: 'policy_check_not_logged_in',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: JSON.stringify({
                    status: response.status,
                    responseURL: response.url
                  })
                }
              });
              return _context3.abrupt("return", null);
            case 30:
              _context3.prev = 30;
              _context3.next = 33;
              return response.text();
            case 33:
              jsonp = _context3.sent;
              consoleDebug("text: ".concat(jsonp));

              // Focus latency measurements on successfull requests
              timeSpentMs = Math.ceil(performance.now() - start);
              this.odsClient.addDataPoint('policy_check_latency_ms', timeSpentMs);
              return _context3.abrupt("return", JSON.parse(jsonp));
            case 40:
              _context3.prev = 40;
              _context3.t1 = _context3["catch"](30);
              consoleDebug("Can't parse the policy check response as JSON");
              consoleDebug("".concat(_context3.t1.name, ": ").concat(_context3.t1.message, " \n\n ").concat(_context3.t1.stack));
              responseText = (_jsonp = jsonp) !== null && _jsonp !== void 0 ? _jsonp : '';
              errType = getServerErrorType(responseText);
              this.senderToServer.sendMessage({
                action: 'policy_check_parse_error',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: JSON.stringify({
                    exceptionName: _context3.t1.name,
                    exceptionMessage: _context3.t1.message,
                    status: response.status,
                    responseURL: response.url,
                    responseText: errType === 'UNKNOWN' ? responseText : errType
                  })
                }
              });
              return _context3.abrupt("return", null);
            case 48:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this, [[1, 7], [30, 40]]);
      }));
      function executeRequest(_x5) {
        return _executeRequest.apply(this, arguments);
      }
      return executeRequest;
    }()
  }]);
  return PolicyChecker;
}()));
function appendArrayToParams(array, fieldName, params) {
  array.forEach(function (value, index) {
    params.append("".concat(fieldName, "[").concat(index, "]"), value);
  });
}
;// CONCATENATED MODULE: ./src/core/drive_creator.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */













var CREATE_DRIVE_URL = "https://www.internalfb.com/intern/security/data_security_engineering/chrome_data_protection/create_drive/";
var drive_creator_DriveCreator = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function DriveCreator(senderToServer, odsClient, storage, usernameStorage, extensionID, extensionVersion) {
    _classCallCheck(this, DriveCreator);
    _defineProperty(this, "senderToServer", void 0);
    _defineProperty(this, "odsClient", void 0);
    _defineProperty(this, "storage", void 0);
    _defineProperty(this, "usernameStorage", void 0);
    _defineProperty(this, "extensionID", void 0);
    _defineProperty(this, "extensionVersion", void 0);
    this.senderToServer = senderToServer;
    this.odsClient = odsClient;
    this.storage = storage;
    this.usernameStorage = usernameStorage;
    this.extensionID = extensionID;
    this.extensionVersion = extensionVersion;
  }
  _createClass(DriveCreator, [{
    key: "createSharedDrive",
    value: function () {
      var _createSharedDrive = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(request) {
        var _request$dataTypes, _request$dataCategori;
        var csrfToken, usernameData, params, start, response, jsonp, timeSpentMs;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              csrfToken = null;
              _context.prev = 1;
              _context.next = 4;
              return getCSRF(this.storage);
            case 4:
              csrfToken = _context.sent;
              _context.next = 11;
              break;
            case 7:
              _context.prev = 7;
              _context.t0 = _context["catch"](1);
              this.senderToServer.sendMessage({
                action: 'csrf_token_fetch_error',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: "Error: ".concat(_context.t0.name, ": ").concat(_context.t0.message)
                }
              });
              return _context.abrupt("return", null);
            case 11:
              _context.next = 13;
              return this.usernameStorage.getUsernameData();
            case 13:
              usernameData = _context.sent;
              params = new URLSearchParams({
                // eslint-disable-next-line camelcase
                fb_dtsg: csrfToken,
                // eslint-disable-next-line camelcase
                extension_uuid: usernameData.uuid,
                // eslint-disable-next-line camelcase
                extension_id: this.extensionID,
                // eslint-disable-next-line camelcase
                extension_version: this.extensionVersion,
                // eslint-disable-next-line camelcase
                session_uuid: request['sessionUUID'],
                // eslint-disable-next-line camelcase
                request_uuid: uuidv4(),
                // eslint-disable-next-line camelcase
                drive_name: request['driveName'],
                // eslint-disable-next-line camelcase
                inferredDssLevel: request['inferredDssLevel']
              });
              drive_creator_appendArrayToParams((_request$dataTypes = request['dataTypes']) !== null && _request$dataTypes !== void 0 ? _request$dataTypes : [], 'data_types', params);
              drive_creator_appendArrayToParams((_request$dataCategori = request['dataCategories']) !== null && _request$dataCategori !== void 0 ? _request$dataCategori : [], 'data_categories', params);
              start = performance.now();
              _context.next = 20;
              return fetch(CREATE_DRIVE_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
              });
            case 20:
              response = _context.sent;
              if (!(!response.ok || response.body == null)) {
                _context.next = 26;
                break;
              }
              consoleDebug('Create shared drive request failed');
              consoleDebug(response.body);
              this.senderToServer.sendMessage({
                action: 'create_drive_request_error',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: JSON.stringify({
                    status: response.status,
                    responseURL: response.url
                  })
                }
              });
              return _context.abrupt("return", null);
            case 26:
              if (!response.redirected) {
                _context.next = 31;
                break;
              }
              if (!loginURLPrefixes.some(function (prefix) {
                return response.url.startsWith(prefix);
              })) {
                _context.next = 31;
                break;
              }
              // This should only happen if user is loggedout between last configuration check and now
              consoleDebug("Can't create shared drive as user is not logged in");
              this.senderToServer.sendMessage({
                action: 'create_drive_not_logged_in',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: JSON.stringify({
                    status: response.status,
                    responseURL: response.url
                  })
                }
              });
              return _context.abrupt("return", null);
            case 31:
              _context.prev = 31;
              _context.next = 34;
              return response.text();
            case 34:
              jsonp = _context.sent;
              consoleDebug("text: ".concat(jsonp));

              // Focus latency measurements on successfull requests
              timeSpentMs = Math.ceil(performance.now() - start);
              this.odsClient.addDataPoint('create_drive_latency_ms', timeSpentMs);
              return _context.abrupt("return", JSON.parse(jsonp));
            case 41:
              _context.prev = 41;
              _context.t1 = _context["catch"](31);
              consoleDebug("Can't parse the create shared drive response as JSON");
              consoleDebug("".concat(_context.t1.name, ": ").concat(_context.t1.message));
              return _context.abrupt("return", null);
            case 46:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[1, 7], [31, 41]]);
      }));
      function createSharedDrive(_x) {
        return _createSharedDrive.apply(this, arguments);
      }
      return createSharedDrive;
    }()
  }]);
  return DriveCreator;
}()));
function drive_creator_appendArrayToParams(array, fieldName, params) {
  array.forEach(function (value, index) {
    params.append("".concat(fieldName, "[").concat(index, "]"), value);
  });
}
;// CONCATENATED MODULE: ./src/background/background_decl.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */

















var ASYNC_REQUEST_TYPES = [RESOURCES_POLICY_CHECK, RECIPIENTS_POLICY_CHECK, CREATE_DRIVE_CALL];
var background_decl_ENV_PROD = 'prod';
var ENV_BETA = 'beta';
var CONFIG_ALARM_NAME = 'config-alarm';
var ODS_ALARM_NAME = 'ods-alarm';
var ServiceWorker = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function ServiceWorker(chrome) {
    _classCallCheck(this, ServiceWorker);
    _defineProperty(this, "version", void 0);
    _defineProperty(this, "enabled", void 0);
    _defineProperty(this, "chrome", void 0);
    _defineProperty(this, "senderToServer", void 0);
    _defineProperty(this, "configLoader", void 0);
    _defineProperty(this, "policyChecker", void 0);
    _defineProperty(this, "driveCreator", void 0);
    _defineProperty(this, "odsClient", void 0);
    _defineProperty(this, "tabStorage", void 0);
    consoleDebug('Service worker init');

    // Accept custom chrome instance to help with test mocks
    this.chrome = chrome;
    this.version = chrome.runtime.getManifest().version;
    var env = chrome.runtime.id === PRODUCTION_CHROME_ID ? background_decl_ENV_PROD : ENV_BETA;
    this.odsClient = new OdsClient(env, new OdsStorage(chrome.storage));
    this.tabStorage = new TabStorage(chrome.storage);
    var usernameStorage = new UsernameStorage(chrome.storage);
    this.senderToServer = new ServerMessageSender(chrome.runtime.id, chrome.runtime.getManifest().version, usernameStorage, this.tabStorage, this.odsClient);
    this.configLoader = new ConfigLoader(new ConfigStorage(chrome.storage), this.senderToServer, this.odsClient);
    this.policyChecker = new PolicyChecker(this.senderToServer, this.odsClient, chrome.storage, usernameStorage, chrome.runtime.id, this.version);
    this.driveCreator = new DriveCreator(this.senderToServer, this.odsClient, chrome.storage, usernameStorage, chrome.runtime.id, this.version);

    // https://developer.chrome.com/docs/extensions/mv3/service_workers/events/#declare-events
    // Event handlers should be registered synchronously on initial script execution
    this.initEventHandlers();
  }
  _createClass(ServiceWorker, [{
    key: "initEventHandlers",
    value: function initEventHandlers() {
      var _this = this;
      // Web request interceptor handlers
      this.chrome.webRequest.onBeforeRequest.addListener(function (details) {
        _this.handleBatchExecSharingPrompt(details);
      }, {
        urls: [
        // Scope to only that particular rpc ID
        'https://drive.google.com/drivesharing/_/DriveShareDialogUi/data/batchexecute?rpcids=U1t5p*']
      }, ['requestBody']);

      // Main event handler (incl. content script messages)
      this.chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        try {
          _this.messageHandler(message, sender, sendResponse);
        } catch (e) {
          consoleDebug('Error running background message handler:', e);
          _this.senderToServer.sendMessage({
            action: 'background_message_handler_error',
            payload: {
              // eslint-disable-next-line camelcase
              error_msg: "".concat(e.name, ": ").concat(e.message)
            }
          });
        }

        // Only return true if for async requests with sendResponse callback
        if (ASYNC_REQUEST_TYPES.includes(message.type)) {
          return true;
        }
      });

      // Alarms handler
      this.chrome.alarms.onAlarm.addListener(function (alarm) {
        consoleDebug("Alarm received: ".concat(JSON.stringify(alarm)));
        if (alarm.name === CONFIG_ALARM_NAME) {
          _this.loadConfig();
        } else if (alarm.name === ODS_ALARM_NAME) {
          _this.odsClient.post();
        }
      });
    }
  }, {
    key: "run",
    value: function () {
      var _run = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.createConfigAlarm();
            case 2:
              _context.next = 4;
              return this.createOdsAlarm();
            case 4:
              consoleDebug('Service worker started');
              this.odsClient.bumpKey('service_worker_started');
            case 6:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function run() {
        return _run.apply(this, arguments);
      }
      return run;
    }()
  }, {
    key: "loadConfig",
    value: function () {
      var _loadConfig = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var configData;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return this.configLoader.getConfiguration();
            case 2:
              configData = _context2.sent;
              this.enabled = configData != null ? configData.enabled : false;
              consoleDebug("Extension enabled: ".concat(this.enabled.toString()));
            case 5:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function loadConfig() {
        return _loadConfig.apply(this, arguments);
      }
      return loadConfig;
    }()
  }, {
    key: "createConfigAlarm",
    value: function () {
      var _createConfigAlarm = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        var configAlarm;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return this.chrome.alarms.get(CONFIG_ALARM_NAME);
            case 2:
              configAlarm = _context3.sent;
              if (!(typeof configAlarm === 'undefined' || configAlarm.periodInMinutes !== CONFIG_CACHE_TTL_MIN)) {
                _context3.next = 7;
                break;
              }
              this.chrome.alarms.create(CONFIG_ALARM_NAME, {
                periodInMinutes: CONFIG_CACHE_TTL_MIN
              });
              _context3.next = 7;
              return this.loadConfig();
            case 7:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this);
      }));
      function createConfigAlarm() {
        return _createConfigAlarm.apply(this, arguments);
      }
      return createConfigAlarm;
    }()
  }, {
    key: "createOdsAlarm",
    value: function () {
      var _createOdsAlarm = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
        var odsAlarm;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this.chrome.alarms.get(ODS_ALARM_NAME);
            case 2:
              odsAlarm = _context4.sent;
              if (typeof odsAlarm === 'undefined') {
                // Signals should not be sent to ODS more often than once a minute:
                // https://fb.workplace.com/groups/ods.users/permalink/1698146840222347/
                this.chrome.alarms.create(ODS_ALARM_NAME, {
                  delayInMinutes: 1,
                  periodInMinutes: 2
                });
              }
            case 4:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this);
      }));
      function createOdsAlarm() {
        return _createOdsAlarm.apply(this, arguments);
      }
      return createOdsAlarm;
    }()
  }, {
    key: "handleAccountExtraction",
    value: function handleAccountExtraction(payload, tabId) {
      var emails = payload.emails;
      if (tabId && emails.length > 0) {
        var metaEmails = emails.filter(function (email) {
          return isMetaEmail(email);
        });
        var metaEmail = metaEmails.length > 0 ? metaEmails[0] : null;

        // null value indicates that we have received account info from
        // content script, but the account is not Meta owned one
        this.tabStorage.storeTabData(tabId, {
          account: metaEmail
        });
        this.senderToServer.sendMessage({
          action: 'account_parsed_and_stored',
          account: metaEmail,
          url: payload.url,
          // eslint-disable-next-line camelcase
          referrer_url: payload.referrer_url
        });
        if (emails.length > 1) {
          this.senderToServer.sendMessage({
            action: 'multiple_meta_emails_error',
            payload: {
              // eslint-disable-next-line camelcase
              error_msg: "emails: ".concat(JSON.stringify(emails))
            },
            url: payload.url,
            // eslint-disable-next-line camelcase
            referrer_url: payload.referrer_url
          });
        }
      } else {
        this.senderToServer.sendMessage({
          action: 'account_extraction_error',
          payload: {
            // eslint-disable-next-line camelcase
            error_msg: "tabId: ".concat(tabId !== null && tabId !== void 0 ? tabId : '', ", emails: ").concat(JSON.stringify(emails))
          },
          url: payload.url,
          // eslint-disable-next-line camelcase
          referrer_url: payload.referrer_url
        });
      }
    }
  }, {
    key: "handleBatchExecSharingPrompt",
    value: function handleBatchExecSharingPrompt(details) {
      // Handle should be only called for the specific RPC Id to avoid
      try {
        var _details$requestBody;
        this.odsClient.bumpKey('batchexecute_request');

        // Example request body:
        // f.req: [[["U1t5p","[4,[\"<document_id>\"],null,null,null,null,null,\"explorer\",[],[],null,null,null,[1,1]]",null,"generic"]]]
        // at: AKlsgl_6IZ3QuuSViwr6UVIjnAOS:1700478180888
        if (details.method === 'POST' && (_details$requestBody = details.requestBody) !== null && _details$requestBody !== void 0 && _details$requestBody.formData) {
          var _details$requestBody$, _details$requestBody2;
          var formData = (_details$requestBody$ = (_details$requestBody2 = details.requestBody) === null || _details$requestBody2 === void 0 ? void 0 : _details$requestBody2.formData) !== null && _details$requestBody$ !== void 0 ? _details$requestBody$ : {};

          // $FlowFixMe[incompatible-type]: flow says ArrayBuffer, but in practice it is an object
          var fReq = formData['f.req'];
          if (fReq && fReq.length > 0) {
            var rcpReq = JSON.parse(fReq[0]);
            // Nesting explained (wrappers are byproduct of protobuf):
            // 1. Net request wrapper
            // 2. Batch requests
            // 3. Batch request wrapper
            // We expect to only have single request in the batch and
            // the second element in the batch wrapper is the body
            var ids = JSON.parse(rcpReq[0][0][1])[1];
            if (ids && ids.length > 0) {
              this.chrome.tabs.sendMessage(details.tabId, {
                type: BATCHEXECUTE_U1T5P,
                ids: ids
              });
            }
          }
        }
      } catch (e) {
        this.senderToServer.sendMessage({
          action: 'batchexecute_request_handler_error',
          payload: {
            // eslint-disable-next-line camelcase
            error_msg: "".concat(e.name, ": ").concat(e.message)
          }
        });
      }
    }
  }, {
    key: "getAccount",
    value: function () {
      var _getAccount = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(tabId, messageType) {
        var tabData;
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              if (!(tabId == null)) {
                _context5.next = 3;
                break;
              }
              consoleDebug('No tab id provided');
              return _context5.abrupt("return", null);
            case 3:
              _context5.next = 5;
              return this.tabStorage.getTabData(tabId);
            case 5:
              tabData = _context5.sent;
              if (!tabData) {
                _context5.next = 16;
                break;
              }
              if (!tabData.account) {
                _context5.next = 11;
                break;
              }
              return _context5.abrupt("return", tabData.account);
            case 11:
              consoleDebug('Tab running non-Meta account');
              this.odsClient.bumpKey('non_meta_account_detected');
              return _context5.abrupt("return", null);
            case 14:
              _context5.next = 19;
              break;
            case 16:
              consoleDebug('No data for tab. Should never happen');
              this.senderToServer.sendMessage({
                action: 'get_account_but_no_account_detected_error',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: "tabId: ".concat(tabId, ", workflow: ").concat(messageType)
                }
              });
              return _context5.abrupt("return", null);
            case 19:
            case "end":
              return _context5.stop();
          }
        }, _callee5, this);
      }));
      function getAccount(_x, _x2) {
        return _getAccount.apply(this, arguments);
      }
      return getAccount;
    }()
  }, {
    key: "messageHandler",
    value: function () {
      var _messageHandler = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6(message, sender, sendResponse) {
        var _sender$tab;
        var tabId, account, _account, _account2;
        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              tabId = (_sender$tab = sender.tab) === null || _sender$tab === void 0 ? void 0 : _sender$tab.id;
              consoleDebug("Event: ".concat(message.type, ", Tab ID: ").concat(tabId !== null && tabId !== void 0 ? tabId : 'null'));
              _context6.t0 = message.type;
              _context6.next = _context6.t0 === 'account_extraction' ? 5 : _context6.t0 === 'recipients_policy_check' ? 7 : _context6.t0 === 'resources_policy_check' ? 9 : _context6.t0 === 'google_interstitial_shown' ? 11 : _context6.t0 === 'google_interstitial_share' ? 11 : _context6.t0 === 'meta_interstitial_cancel' ? 16 : _context6.t0 === 'meta_interstitial_share' ? 16 : _context6.t0 === 'meta_interstitial_shown' ? 16 : _context6.t0 === 'content_script_google_error' ? 21 : _context6.t0 === 'content_script_sharing_error' ? 21 : _context6.t0 === 'content_dom_observer_latency_ms' ? 26 : _context6.t0 === 'create_drive_dom_observer_latency_ms' ? 28 : _context6.t0 === 'create_shared_drive' ? 30 : _context6.t0 === 'redirect_page_location' ? 32 : _context6.t0 === 'meta_create_drive_interstitial_shown' ? 34 : _context6.t0 === 'meta_create_drive_interstitial_drive_created' ? 34 : 34;
              break;
            case 5:
              this.handleAccountExtraction(message.payload, tabId);
              return _context6.abrupt("break", 34);
            case 7:
              this.policyChecker.checkRecipients(message.payload.session_uuid, message.payload.recipients).then(function (response) {
                // Send response back to content script
                sendResponse({
                  type: 'recipients_policy_check_response',
                  payload: {
                    recipients: response
                  }
                });
              });
              return _context6.abrupt("break", 34);
            case 9:
              this.policyChecker.checkResources(message.payload.session_uuid, message.payload.resources).then(function (response) {
                // Send response back to content script
                sendResponse({
                  type: 'resources_policy_check_response',
                  payload: {
                    resources: response
                  }
                });
              });
              return _context6.abrupt("break", 34);
            case 11:
              _context6.next = 13;
              return this.getAccount(tabId, message.type);
            case 13:
              account = _context6.sent;
              if (account != null) {
                this.senderToServer.sendMessage({
                  action: message.type,
                  account: account,
                  payload: message.payload
                });
              }
              return _context6.abrupt("break", 34);
            case 16:
              _context6.next = 18;
              return this.getAccount(tabId, message.type);
            case 18:
              _account = _context6.sent;
              this.senderToServer.sendMessage({
                action: message.type,
                account: _account,
                payload: message.payload
              });
              return _context6.abrupt("break", 34);
            case 21:
              _context6.next = 23;
              return this.getAccount(tabId, message.type);
            case 23:
              _account2 = _context6.sent;
              this.senderToServer.sendMessage({
                action: message.type,
                account: _account2,
                payload: message.payload
              });
              return _context6.abrupt("break", 34);
            case 26:
              this.odsClient.addDataPoint(message.type, message.payload.latency);
              return _context6.abrupt("break", 34);
            case 28:
              this.odsClient.addDataPoint(message.type, message.payload.latency);
              return _context6.abrupt("break", 34);
            case 30:
              this.driveCreator.createSharedDrive(message.payload).then(function (response) {
                // Send response back to content script
                sendResponse({
                  type: 'create_shared_drive_response',
                  payload: {
                    sharedDriveId: response === null || response === void 0 ? void 0 : response.drive_id
                  }
                });
              });
              return _context6.abrupt("break", 34);
            case 32:
              this.chrome.tabs.update({
                url: message.payload.newURL
              });
              return _context6.abrupt("break", 34);
            case 34:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this);
      }));
      function messageHandler(_x3, _x4, _x5) {
        return _messageHandler.apply(this, arguments);
      }
      return messageHandler;
    }()
  }]);
  return ServiceWorker;
}()));
;// CONCATENATED MODULE: ./src/core/ods.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */











var ODS_CATEGORY_ID = '6917';
var ODS_URL = 'https://graph.facebook.com/ods_metrics';
var ods_OdsClient = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function OdsClient(env, odsStorage) {
    _classCallCheck(this, OdsClient);
    _defineProperty(this, "entity", void 0);
    _defineProperty(this, "odsStorage", void 0);
    this.entity = env === ENV_PROD ? 'blackbird_data_protection.extension' : 'blackbird_data_protection.extension_beta';
    this.odsStorage = odsStorage;
  }
  _createClass(OdsClient, [{
    key: "bumpKey",
    value: function () {
      var _bumpKey = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(key) {
        var value;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              consoleDebug('OdsClient.bumpKey: ', key);
              value = 1;
              _context.next = 4;
              return this.odsStorage.addOdsEntries([{
                key: key,
                value: value
              }]);
            case 4:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function bumpKey(_x) {
        return _bumpKey.apply(this, arguments);
      }
      return bumpKey;
    }()
  }, {
    key: "addDataPoint",
    value: function () {
      var _addDataPoint = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(key, value) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              consoleDebug('OdsClient.addDataPoint {key:', key, 'value:', value, '}');
              _context2.next = 3;
              return this.odsStorage.addOdsEntries([{
                key: key,
                value: value
              }]);
            case 3:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function addDataPoint(_x2, _x3) {
        return _addDataPoint.apply(this, arguments);
      }
      return addDataPoint;
    }()
  }, {
    key: "post",
    value: function () {
      var _post = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        var entries, datapoints, success;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              consoleDebug('OdsClient.post');
              _context3.next = 3;
              return this.odsStorage.getOdsEntries();
            case 3:
              entries = _context3.sent;
              if (!(entries.length === 0)) {
                _context3.next = 7;
                break;
              }
              consoleDebug('No ODS entries to send');
              return _context3.abrupt("return");
            case 7:
              datapoints = this.buildPayload(entries);
              _context3.next = 10;
              return this.postData(datapoints);
            case 10:
              success = _context3.sent;
              if (!success) {
                _context3.next = 14;
                break;
              }
              _context3.next = 14;
              return this.odsStorage.clearOdsEntries();
            case 14:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this);
      }));
      function post() {
        return _post.apply(this, arguments);
      }
      return post;
    }()
  }, {
    key: "postData",
    value: function () {
      var _postData = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(datapoints) {
        var formData, response, text;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              formData = new URLSearchParams();
              formData.set('access_token', appAccessToken);
              formData.set('category_id', ODS_CATEGORY_ID);
              formData.set('datapoints', datapoints);
              _context4.next = 6;
              return fetch(ODS_URL, {
                method: 'POST',
                body: formData,
                headers: {
                  'Content-Type': 'application/json'
                }
              });
            case 6:
              response = _context4.sent;
              if (!response.ok) {
                _context4.next = 11;
                break;
              }
              return _context4.abrupt("return", true);
            case 11:
              _context4.next = 13;
              return response.text();
            case 13:
              text = _context4.sent;
              consoleDebug("ODS upload did not succeed | response text: ".concat(text));
              return _context4.abrupt("return", false);
            case 16:
            case "end":
              return _context4.stop();
          }
        }, _callee4);
      }));
      function postData(_x4) {
        return _postData.apply(this, arguments);
      }
      return postData;
    }()
  }, {
    key: "buildPayload",
    value: function buildPayload(entries) {
      var _this = this;
      var datapoints = [];
      entries.forEach(function (entry) {
        datapoints.push({
          entity: _this.entity,
          key: entry.key,
          value: entry.value
        });
      });
      return JSON.stringify(datapoints);
    }
  }]);
  return OdsClient;
}()));
;// CONCATENATED MODULE: ./src/core/config_loader.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */








function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }






/* eslint-disable camelcase */
/* == GOOGLE ACCOUNT PROFILE SELECTORS == */
// DOM selector for the circle account profile icon on the top right
// when opening a gdoc
var GOOGLE_ACCOUNT_PROFILE_GDOC = INTERNAL_META_DOMAINS.map(function (domain) {
  return "div#docs-titlebar-container a[aria-label*=\"@".concat(domain, "\"]");
}).join(',');
// when in gdrive
var GOOGLE_ACCOUNT_PROFILE_GDRIVE = INTERNAL_META_DOMAINS.map(function (domain) {
  return "header#gb[role=\"banner\"] a[aria-label*=\"@".concat(domain, "\"]");
}).join(',');
// when viewing a PDF
var GOOGLE_ACCOUNT_PROFILE_PDF_VIEW = INTERNAL_META_DOMAINS.map(function (domain) {
  return "div#gb a[aria-label*=\"@".concat(domain, "\"]");
}).join(',');
/* ====================================== */
/* == GOOGLE SHARE PROMPT SELECTORS == */
// DOM selector for the Popup dialog when Share button is clicked
// iFrame where the google sharing prompt is rendered
var GOOGLE_SHARING_PROMPT_IFRAME = '.ea-Rc-x-Vc, .share-client-content-iframe';
// "Send" button to trigger sharing
var GOOGLE_SHARING_PROMPT_SEND_BUTTON = 'button.UywwFc-LgbsSe.ftJYz';
// tokens of share recipient's email e.g. johndoe@gmail.com
var GOOGLE_SHARING_PROMPT_RECIPIENTS_LIST = '.opjjDf > .VfPpkd-XPtOyb';
// dropdown list for what permission to grant e.g. viewer, commenter
var GOOGLE_SHARING_PROMPT_PERMISSION_DROPDOWN = 'button.AeBiU-LgbsSe.AeBiU-LgbsSe-OWXEXe-Bz112c-UbuQg.YzY9Wb.QBaKgf.jTGNhb';
// the default dialog that Google shows when someone hit "Send" button on sensitive doc
var GOOGLE_SHARING_PROMPT_GOOGLE_INTERSTITIAL_DIALOG = 'div[role="alertdialog"].I7OXgf.zziILd.v3Ifxf.ZEeHrd.Inn9w.iWO5td';
// the "Send" button on the Google interstitial dialog
var GOOGLE_SHARING_PROMPT_GOOGLE_INTERSTITIAL_SEND_BUTTON = 'div.OE6hId.J9fJmf > div > button.mUIrbf-LgbsSe.mUIrbf-LgbsSe-OWXEXe-dgl2Hf:not(.nIUyy)';
// the "Accept all" dialog that Google shows for sharing multiple files
var GOOGLE_INTERSTITIAL_ACCEPT_ALL_DIALOG = 'div[role="dialog"].uW2Fw-P5QLlc';
// the "Give access" button on the Google interstitial accept all dialog
var GOOGLE_INTERSTITIAL_ACCEPT_ALL_GIVE_ACCESS_BUTTON = 'button[data-mdc-dialog-action="ok"].mUIrbf-LgbsSe.mUIrbf-LgbsSe-OWXEXe-dgl2Hf';

/* ====================================== */
/* == GOOGLE SHARE REQUEST APPROVAL PROMPT SELECTORS == */
// "Send" button to trigger sharing
var GOOGLE_SHARING_REQUEST_SHARE_BUTTON = 'button.UywwFc-LgbsSe.UywwFc-LgbsSe-OWXEXe-dgl2Hf';
// Prompt class to identify the specific sharing request
var GOOGLE_SHARING_REQUEST_PROMPT = 'section.UqsnCc';
// Sharing request header containing the requestor's email
var GOOGLE_SHARING_REQUEST_RECIPIENT = 'div.AsSTTb.GND07b.TP8uyc.aQE9pc';
// This is similar to GOOGLE_SHARING_REQUEST_PROMPT, except the Accept All section has extra class
var GOOGLE_SHARING_REQUEST_ACCEPT_ALL_PROMPT = 'section.UqsnCc.EGclMd';

/* ====================================== */
/* == GOOGLE CREATE NEW SHARED DRIVE PROMPT SELECTORS == */
// "New" button that opens the shared drive creation modal
var GOOGLE_SHARED_DRIVE_CREATE_MODAL_OPEN_BUTTON = 'button.brbsPe.Ss7qXc.a-qb-ni-d';
var GOOGLE_SHARED_DRIVE_CREATE_MODAL = 'div[guidedhelpid="td_create_dialog"]';
// Input box that contains the shared drive's desired name
var GOOGLE_SHARED_DRIVE_NAME_INPUT = 'input[guidedhelpid="td_create_dialog_teamname"]';
// The "Create" button on the shared drive creation modal
var GOOGLE_SHARED_DRIVE_CREATE_CONFIRM_BUTTON = 'button.VfPpkd-d.VfPpkd-d-Qu-dgl2Hf.ksBjEc.lKxP2d.LQeN7.xFWpbf.CZCFtc-Ll.sj692e.RCmsv.jbArdc.uFAPIe.wnagdd.vKmmhc';
var GOOGLE_SHARED_DRIVE_CREATE_CANCEL_BUTTON = 'button.VfPpkd-d.VfPpkd-d-Qu-dgl2Hf.LjDxcd.XhPA0b.LQeN7.xFWpbf.CZCFtc-Ll.sj692e.RCmsv.jbArdc.usP4bb.uAkPhe.vKmmhc';
/* ====================================== */

var DEFAULT_DOM_SELECTOR = {
  google_account_profile: {
    gdoc: GOOGLE_ACCOUNT_PROFILE_GDOC,
    gdrive: GOOGLE_ACCOUNT_PROFILE_GDRIVE,
    pdf_view: GOOGLE_ACCOUNT_PROFILE_PDF_VIEW
  },
  google_sharing_prompt: {
    iframe: GOOGLE_SHARING_PROMPT_IFRAME,
    send_button: GOOGLE_SHARING_PROMPT_SEND_BUTTON,
    recipients_list: GOOGLE_SHARING_PROMPT_RECIPIENTS_LIST,
    permission_dropdown: GOOGLE_SHARING_PROMPT_PERMISSION_DROPDOWN,
    google_interstitial_dialog: GOOGLE_SHARING_PROMPT_GOOGLE_INTERSTITIAL_DIALOG,
    google_interstitial_send_button: GOOGLE_SHARING_PROMPT_GOOGLE_INTERSTITIAL_SEND_BUTTON,
    google_interstitial_accept_all_dialog: GOOGLE_INTERSTITIAL_ACCEPT_ALL_DIALOG,
    google_interstitial_accept_all_give_access_button: GOOGLE_INTERSTITIAL_ACCEPT_ALL_GIVE_ACCESS_BUTTON,
    sharing_request_accept_all_prompt: GOOGLE_SHARING_REQUEST_ACCEPT_ALL_PROMPT,
    sharing_request_share_button: GOOGLE_SHARING_REQUEST_SHARE_BUTTON,
    sharing_request_prompt: GOOGLE_SHARING_REQUEST_PROMPT,
    sharing_request_recipient: GOOGLE_SHARING_REQUEST_RECIPIENT
  },
  google_create_drive: {
    open_button: GOOGLE_SHARED_DRIVE_CREATE_MODAL_OPEN_BUTTON,
    create_modal: GOOGLE_SHARED_DRIVE_CREATE_MODAL,
    name_input: GOOGLE_SHARED_DRIVE_NAME_INPUT,
    create_button: GOOGLE_SHARED_DRIVE_CREATE_CONFIRM_BUTTON,
    cancel_button: GOOGLE_SHARED_DRIVE_CREATE_CANCEL_BUTTON
  }
};
/* eslint-enable camelcase */

var CONFIG_URL = "https://www.internalfb.com/intern/security/blackbird/chrome_data_protection/settings/";
var config_loader_CONFIG_CACHE_TTL_MIN = 1; // 1 minute
var CONFIG_CACHE_TTL_MS = config_loader_CONFIG_CACHE_TTL_MIN * 1000 * 60; // 1 minute
var CONFIG_CACHE_MIN_FRESHNESS_MS = CONFIG_CACHE_TTL_MS * 5; // 5 minutes

var ConfigLoaderContentScript = /*#__PURE__*/function () {
  function ConfigLoaderContentScript(chrome, storage) {
    classCallCheck_classCallCheck(this, ConfigLoaderContentScript);
    defineProperty_defineProperty(this, "chrome", void 0);
    defineProperty_defineProperty(this, "storage", void 0);
    this.chrome = chrome;
    this.storage = storage;
  }

  // Used by content scripts to load cached config if any
  // Avoid blocking page while fetching config
  createClass_createClass(ConfigLoaderContentScript, [{
    key: "getCachedConfiguration",
    value: function () {
      var _getCachedConfiguration = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
        var configData, timeNowMs;
        return regenerator.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.storage.getConfig();
            case 2:
              configData = _context.sent;
              if (!(configData == null)) {
                _context.next = 5;
                break;
              }
              return _context.abrupt("return", null);
            case 5:
              timeNowMs = Date.now();
              if (!(timeNowMs - configData.timestamp < CONFIG_CACHE_MIN_FRESHNESS_MS)) {
                _context.next = 10;
                break;
              }
              return _context.abrupt("return", configData.config);
            case 10:
              this.chrome.runtime.sendMessage({
                type: 'config_expired_ttl_error',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: "Config TTL expired. Config timestamp: ".concat(configData.timestamp, ", timeNowMS: ").concat(timeNowMs, ", min freshness: ").concat(CONFIG_CACHE_MIN_FRESHNESS_MS)
                }
              });
              return _context.abrupt("return", null);
            case 12:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function getCachedConfiguration() {
        return _getCachedConfiguration.apply(this, arguments);
      }
      return getCachedConfiguration;
    }()
  }]);
  return ConfigLoaderContentScript;
}();
var config_loader_ConfigLoader = /*#__PURE__*/(/* unused pure expression or super */ null && (function () {
  function ConfigLoader(storage, senderToServer, odsClient) {
    _classCallCheck(this, ConfigLoader);
    _defineProperty(this, "storage", void 0);
    _defineProperty(this, "senderToServer", void 0);
    _defineProperty(this, "odsClient", void 0);
    this.storage = storage;
    this.senderToServer = senderToServer;
    this.odsClient = odsClient;
  }

  // Obtaining configuration from the endpoint (CONFIG_URL).
  _createClass(ConfigLoader, [{
    key: "getConfiguration",
    value: function () {
      var _getConfiguration = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var timeNowMs, configData, response, jsonp, config, _configData$config$do, prevDomSelector, nextDomSelector, _jsonp, responseText, errType;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              timeNowMs = Date.now();
              _context2.next = 3;
              return this.storage.getConfig();
            case 3:
              configData = _context2.sent;
              if (!(configData != null && timeNowMs - configData.timestamp < CONFIG_CACHE_TTL_MS)) {
                _context2.next = 7;
                break;
              }
              consoleDebug('Using cached configuration');
              return _context2.abrupt("return", configData.config);
            case 7:
              _context2.next = 9;
              return fetch(CONFIG_URL);
            case 9:
              response = _context2.sent;
              if (!(!response.ok || response.body == null)) {
                _context2.next = 14;
                break;
              }
              consoleDebug("Can't load the configuration");
              this.senderToServer.sendMessage({
                action: 'config_load_error',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: JSON.stringify({
                    status: response.status,
                    responseURL: response.url
                  })
                }
              });
              return _context2.abrupt("return", null);
            case 14:
              if (!response.redirected) {
                _context2.next = 19;
                break;
              }
              if (!loginURLPrefixes.some(function (prefix) {
                return response.url.startsWith(prefix);
              })) {
                _context2.next = 19;
                break;
              }
              consoleDebug("Can't fetch configuration as user is not logged in");
              this.senderToServer.sendMessage({
                action: 'config_not_logged_in',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: JSON.stringify({
                    status: response.status,
                    responseURL: response.url
                  })
                }
              });
              return _context2.abrupt("return", null);
            case 19:
              _context2.prev = 19;
              _context2.next = 22;
              return response.text();
            case 22:
              jsonp = _context2.sent;
              consoleDebug("text: ".concat(jsonp));

              // If valid configuration is returned, store it in the cache.
              config = JSON.parse(jsonp);
              if (config != null) {
                // Previous dom selector is either from cache or hardcoded default selector
                prevDomSelector = (_configData$config$do = configData === null || configData === void 0 ? void 0 : configData.config.dom_selector) !== null && _configData$config$do !== void 0 ? _configData$config$do : DEFAULT_DOM_SELECTOR; // If the config API response contains dom_selector, we extract the valid selectors
                // Else we fallback to the previous one
                nextDomSelector = typeof config.dom_selector !== 'undefined' ? this.getValidSelector(prevDomSelector, config.dom_selector) : prevDomSelector; // eslint-disable-next-line camelcase
                config.dom_selector = nextDomSelector;
                this.storage.storeConfig(config);
                this.odsClient.bumpKey('config_refresh');
              }
              return _context2.abrupt("return", config);
            case 29:
              _context2.prev = 29;
              _context2.t0 = _context2["catch"](19);
              consoleDebug("Can't parse the configuration as JSON");
              consoleDebug("".concat(_context2.t0.name, ": ").concat(_context2.t0.message, " \n\n ").concat(_context2.t0.stack));
              responseText = (_jsonp = jsonp) !== null && _jsonp !== void 0 ? _jsonp : '';
              errType = getServerErrorType(responseText);
              this.senderToServer.sendMessage({
                action: 'config_parse_error',
                payload: {
                  // eslint-disable-next-line camelcase
                  error_msg: JSON.stringify({
                    exceptionName: _context2.t0.name,
                    exceptionMessage: _context2.t0.message,
                    status: response.status,
                    responseURL: response.url,
                    responseText: errType === 'UNKNOWN' ? responseText : errType
                  })
                }
              });
              return _context2.abrupt("return", null);
            case 37:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[19, 29]]);
      }));
      function getConfiguration() {
        return _getConfiguration.apply(this, arguments);
      }
      return getConfiguration;
    }() // TODO(T177253774): better validate dom selectors
    // Given the last valid selector and new selector, validate if the new selector
    // is valid ~~i.e. does not throw exception when used in document.querySelector().~~
    // Validation logic for now is kept to checking if empty string.
    // If valid, return the new selector. Otherwise, return the last valid selector.
  }, {
    key: "getValidSelector",
    value: function getValidSelector(lastValidSelector, newSelector) {
      var _lastValidSelector$go,
        _lastValidSelector$go2,
        _lastValidSelector$go3,
        _this = this;
      // we set the default value to empty json for each root level selectors to prevent
      // errors below when executing "validSelector.<selector>[key] = value" which otherwise
      // could be empty and throws ex when a new root level selector is added to the config.
      var validSelector = _objectSpread(_objectSpread({}, DEFAULT_DOM_SELECTOR), {}, {
        // eslint-disable-next-line camelcase
        google_account_profile: (_lastValidSelector$go = lastValidSelector.google_account_profile) !== null && _lastValidSelector$go !== void 0 ? _lastValidSelector$go : DEFAULT_DOM_SELECTOR.google_account_profile,
        // eslint-disable-next-line camelcase
        google_sharing_prompt: (_lastValidSelector$go2 = lastValidSelector.google_sharing_prompt) !== null && _lastValidSelector$go2 !== void 0 ? _lastValidSelector$go2 : DEFAULT_DOM_SELECTOR.google_sharing_prompt,
        // eslint-disable-next-line camelcase
        google_create_drive: (_lastValidSelector$go3 = lastValidSelector.google_create_drive) !== null && _lastValidSelector$go3 !== void 0 ? _lastValidSelector$go3 : DEFAULT_DOM_SELECTOR.google_create_drive
      });
      Object.entries(newSelector.google_account_profile).forEach(
      // disabling linter because it requires specifying key type as literal of
      // ('gdoc' | 'gdrive' | 'pdf_view'). For value it is of type mixed, but
      // there is rule for no-mixed, and can't be cast to string.
      // eslint-disable-next-line flowtype/require-parameter-type
      function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          value = _ref2[1];
        if (value !== '') {
          // $FlowIgnore[cannot-write]
          validSelector.google_account_profile[key] = value;
        } else {
          var errMessage = "Invalid empty google account profile selector for '".concat(key, "'");
          consoleDebug(errMessage);
          _this.senderToServer.sendMessage({
            action: 'config_dom_selector_invalid',
            payload: {
              // eslint-disable-next-line camelcase
              error_msg: errMessage
            }
          });
        }
      });
      Object.entries(newSelector.google_sharing_prompt).forEach(
      // eslint-disable-next-line flowtype/require-parameter-type
      function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
          key = _ref4[0],
          value = _ref4[1];
        if (value !== '') {
          // $FlowIgnore[cannot-write]
          validSelector.google_sharing_prompt[key] = value;
        } else {
          var errMessage = "Invalid empty google sharing prompt selector for '".concat(key, "'");
          consoleDebug(errMessage);
          _this.senderToServer.sendMessage({
            action: 'config_dom_selector_invalid',
            payload: {
              // eslint-disable-next-line camelcase
              error_msg: errMessage
            }
          });
        }
      });
      Object.entries(newSelector.google_create_drive).forEach(
      // eslint-disable-next-line flowtype/require-parameter-type
      function (_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
          key = _ref6[0],
          value = _ref6[1];
        if (value !== '') {
          // $FlowIgnore[cannot-write]
          validSelector.google_create_drive[key] = value;
        } else {
          var errMessage = "Invalid empty google create drive selector for '".concat(key, "'");
          consoleDebug(errMessage);
          _this.senderToServer.sendMessage({
            action: 'config_dom_selector_invalid',
            payload: {
              // eslint-disable-next-line camelcase
              error_msg: errMessage
            }
          });
        }
      });
      return validSelector;
    }
  }]);
  return ConfigLoader;
}()));
;// CONCATENATED MODULE: ./src/content/content_base_decl.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */











var ContentScriptBase = /*#__PURE__*/function () {
  function ContentScriptBase(chrome) {
    classCallCheck_classCallCheck(this, ContentScriptBase);
    defineProperty_defineProperty(this, "chrome", void 0);
    defineProperty_defineProperty(this, "configLoader", void 0);
    this.chrome = chrome;
    var configStorage = new storage_ConfigStorage(chrome.storage);
    this.configLoader = new ConfigLoaderContentScript(chrome, configStorage);
  }
  createClass_createClass(ContentScriptBase, [{
    key: "run",
    value: function () {
      var _run = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
        var _config$disabled_vers;
        var config, version;
        return regenerator.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.configLoader.getCachedConfiguration();
            case 2:
              config = _context.sent;
              if (!(config == null)) {
                _context.next = 6;
                break;
              }
              logger_consoleDebug('Content Script Base run - config is empty. Exiting.');
              return _context.abrupt("return");
            case 6:
              if (!(config.enabled !== true)) {
                _context.next = 9;
                break;
              }
              logger_consoleDebug('Content Script Base run - master killswitch is on. Exiting.');
              return _context.abrupt("return");
            case 9:
              version = this.chrome.runtime.getManifest().version;
              if (!((_config$disabled_vers = config.disabled_versions) !== null && _config$disabled_vers !== void 0 && _config$disabled_vers.includes(version))) {
                _context.next = 13;
                break;
              }
              logger_consoleDebug('Content Script Base run - version killswitch is on. Exiting.');
              return _context.abrupt("return");
            case 13:
              if (this.isFeatureEnabled(config.feature_gating)) {
                _context.next = 16;
                break;
              }
              logger_consoleDebug('Content Script Base run - feature killswitch is on. Exiting.');
              return _context.abrupt("return");
            case 16:
              _context.next = 18;
              return this.preRunInit(config);
            case 18:
              _context.next = 20;
              return this.runImpl();
            case 20:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function run() {
        return _run.apply(this, arguments);
      }
      return run;
    }()
  }, {
    key: "isFeatureEnabled",
    value: function isFeatureEnabled(_featureGating) {
      logger_consoleDebug('Content Script Base isFeatureEnabled - not implemented. Returning false.');
      return false;
    }
  }, {
    key: "preRunInit",
    value: function () {
      var _preRunInit = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(_config) {
        return regenerator.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              logger_consoleDebug('Content Script Base preRunInit - no override.');
            case 1:
            case "end":
              return _context2.stop();
          }
        }, _callee2);
      }));
      function preRunInit(_x) {
        return _preRunInit.apply(this, arguments);
      }
      return preRunInit;
    }()
  }, {
    key: "runImpl",
    value: function () {
      var _runImpl = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee3() {
        return regenerator.wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              logger_consoleDebug('Content Script Base run - not implemented');
            case 1:
            case "end":
              return _context3.stop();
          }
        }, _callee3);
      }));
      function runImpl() {
        return _runImpl.apply(this, arguments);
      }
      return runImpl;
    }()
  }]);
  return ContentScriptBase;
}();
;// CONCATENATED MODULE: ./src/content/content_create_drive_decl.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall data_security_engineering
 *
 */











function content_create_drive_decl_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = content_create_drive_decl_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function content_create_drive_decl_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return content_create_drive_decl_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return content_create_drive_decl_arrayLikeToArray(o, minLen); }
function content_create_drive_decl_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

function content_create_drive_decl_callSuper(t, o, e) { return o = getPrototypeOf_getPrototypeOf(o), possibleConstructorReturn_possibleConstructorReturn(t, content_create_drive_decl_isNativeReflectConstruct() ? Reflect.construct(o, e || [], getPrototypeOf_getPrototypeOf(t).constructor) : o.apply(t, e)); }
function content_create_drive_decl_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (content_create_drive_decl_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }






var ContentScriptCreateDrive = /*#__PURE__*/function (_ContentScriptBase) {
  inherits_inherits(ContentScriptCreateDrive, _ContentScriptBase);
  function ContentScriptCreateDrive(chrome) {
    var _this;
    classCallCheck_classCallCheck(this, ContentScriptCreateDrive);
    _this = content_create_drive_decl_callSuper(this, ContentScriptCreateDrive, [chrome]);
    defineProperty_defineProperty(_assertThisInitialized(_this), "metaFoundAttribute", void 0);
    defineProperty_defineProperty(_assertThisInitialized(_this), "googleCreateDriveDomSelector", void 0);
    defineProperty_defineProperty(_assertThisInitialized(_this), "corpDataTypes", void 0);
    defineProperty_defineProperty(_assertThisInitialized(_this), "state", void 0);
    _this.metaFoundAttribute = "meta-found-".concat(chrome.runtime.id);
    _this.state = {
      sessionUUID: esm_browser_v4(),
      eventListeners: new Map()
    };
    _this.googleCreateDriveDomSelector = DEFAULT_DOM_SELECTOR.google_create_drive;
    return _this;
  }
  createClass_createClass(ContentScriptCreateDrive, [{
    key: "isFeatureEnabled",
    value: function isFeatureEnabled(featureGating) {
      return featureGating.blackbird_data_protection_create_drive_interstitial === true;
    }
  }, {
    key: "preRunInit",
    value: function () {
      var _preRunInit = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(config) {
        return regenerator.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (typeof config.data_types !== 'undefined') {
                this.corpDataTypes = config.data_types;
              }
              if (typeof config.dom_selector !== 'undefined') {
                this.googleCreateDriveDomSelector = config.dom_selector.google_create_drive;
              }
            case 2:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function preRunInit(_x) {
        return _preRunInit.apply(this, arguments);
      }
      return preRunInit;
    }()
  }, {
    key: "runImpl",
    value: function () {
      var _runImpl = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2() {
        return regenerator.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              this.setObserver();
            case 1:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function runImpl() {
        return _runImpl.apply(this, arguments);
      }
      return runImpl;
    }()
  }, {
    key: "setObserver",
    value: function setObserver() {
      var _this2 = this;
      var observer = new MutationObserver(function (mut, _obs) {
        var start = performance.now();
        _this2.handleMutations(mut);
        var timeSpentMs = Math.ceil(performance.now() - start);

        // Log latency of DOM observer, but only if it's above 5 ms
        // given observer runs on every keystroke
        if (timeSpentMs > 5) {
          _this2.chrome.runtime.sendMessage({
            type: 'content_dom_observer_latency_ms',
            payload: {
              latency: timeSpentMs
            }
          });
        }
      });
      observer.observe(document, {
        childList: true,
        subtree: true
      });
    }
  }, {
    key: "handleMutations",
    value: function handleMutations(mutationsList) {
      var _iterator = content_create_drive_decl_createForOfIteratorHelper(mutationsList),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var mutation = _step.value;
          if (mutation.type === 'childList') {
            var _iterator2 = content_create_drive_decl_createForOfIteratorHelper(mutation.addedNodes),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var node = _step2.value;
                if (node instanceof Element) {
                  // Google's native create drive dialog
                  var createDriveDialog = node.querySelector(this.googleCreateDriveDomSelector.create_modal);
                  if (createDriveDialog) {
                    this.detectCreateDriveDialog(createDriveDialog);
                  }
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "detectCreateDriveDialog",
    value: function detectCreateDriveDialog(createDriveDialog) {
      if (createDriveDialog && createDriveDialog.getAttribute(this.metaFoundAttribute) !== 'true') {
        createDriveDialog.setAttribute(this.metaFoundAttribute, 'true');
        this.showCreateDriveInterstitial();
      }
    }
  }, {
    key: "captureCreateDriveClick",
    value: function captureCreateDriveClick(btn) {
      var _this3 = this;
      // Do nothing if element has already been processed (has metaFoundAttribute)
      if (btn.getAttribute(this.metaFoundAttribute) === 'true') {
        return;
      }
      btn.setAttribute(this.metaFoundAttribute, 'true');
      var eventHandler = function eventHandler(event) {
        _this3.openCreateDriveModalHandler(event);
      };
      this.state.eventListeners.set(btn, eventHandler);
      btn === null || btn === void 0 || btn.addEventListener('click', eventHandler);
    }
  }, {
    key: "openCreateDriveModalHandler",
    value: function openCreateDriveModalHandler(event) {
      // Create uuid for this sharing "session"
      this.state.sessionUUID = esm_browser_v4();
      event.preventDefault();
      event.stopPropagation();
    }

    // Split into a separate function to allow easier mocking in tests
  }, {
    key: "showCreateDriveInterstitial",
    value: function showCreateDriveInterstitial() {
      var interstitialElement = document.getElementById(interstitial_create_drive_INTERSTITIAL_DOM_ID);
      if (!interstitialElement) {
        new CreateDriveInterstitial(this.chrome, document, this.state.sessionUUID, this.corpDataTypes, this.googleCreateDriveDomSelector).downloadAndRenderDataProtectionInterstitial().then(function () {
          logger_consoleDebug('Create drive interstitial shown');
        })["catch"](function (error) {
          logger_consoleDebug("Error rendering create drive interstitial", error);
        });
      }
    }
  }]);
  return ContentScriptCreateDrive;
}(ContentScriptBase);
;// CONCATENATED MODULE: ./src/content/content_create_drive.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall data_security_engineering
 *
 */





try {
  logger_consoleDebug('Running sharing script');
  new ContentScriptCreateDrive(chrome).run();
} catch (e) {
  logger_consoleDebug('Error running drive creation content script:', e);
  chrome.runtime.sendMessage({
    type: 'content_script_drive_creation_error',
    payload: {
      // eslint-disable-next-line camelcase
      error_msg: "".concat(e.name, ": ").concat(e.message)
    }
  });
}
})();

/******/ })()
;
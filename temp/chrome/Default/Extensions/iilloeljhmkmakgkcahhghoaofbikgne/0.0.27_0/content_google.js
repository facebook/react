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










function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
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
  var _iterator = _createForOfIteratorHelper(ERROR_TYPE_STRING_KEYWORD),
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
;// CONCATENATED MODULE: ./src/content/content_google_decl.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */












function content_google_decl_callSuper(t, o, e) { return o = getPrototypeOf_getPrototypeOf(o), possibleConstructorReturn_possibleConstructorReturn(t, content_google_decl_isNativeReflectConstruct() ? Reflect.construct(o, e || [], getPrototypeOf_getPrototypeOf(t).constructor) : o.apply(t, e)); }
function content_google_decl_isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (content_google_decl_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }




var ContentScriptGoogle = /*#__PURE__*/function (_ContentScriptBase) {
  inherits_inherits(ContentScriptGoogle, _ContentScriptBase);
  function ContentScriptGoogle(chrome) {
    var _this;
    classCallCheck_classCallCheck(this, ContentScriptGoogle);
    _this = content_google_decl_callSuper(this, ContentScriptGoogle, [chrome]);
    defineProperty_defineProperty(_assertThisInitialized(_this), "enabled", void 0);
    defineProperty_defineProperty(_assertThisInitialized(_this), "googleAccountProfileDomSelector", void 0);
    _this.googleAccountProfileDomSelector = DEFAULT_DOM_SELECTOR.google_account_profile;
    return _this;
  }
  createClass_createClass(ContentScriptGoogle, [{
    key: "isFeatureEnabled",
    value: function isFeatureEnabled(_featureGating) {
      return true;
    }
  }, {
    key: "preRunInit",
    value: function () {
      var _preRunInit = asyncToGenerator_asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(config) {
        return regenerator.wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (typeof config.dom_selector !== 'undefined') {
                this.googleAccountProfileDomSelector = config.dom_selector.google_account_profile;
              }
            case 1:
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
        var emails;
        return regenerator.wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              emails = this.extractAccountEmails(document);
              logger_consoleDebug("Extracted GSuite accounts: ".concat(JSON.stringify(emails)));
              this.sendBackgroundMessage(emails);
            case 3:
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
    key: "sendBackgroundMessage",
    value: function sendBackgroundMessage(emails) {
      this.chrome.runtime.sendMessage({
        type: 'account_extraction',
        payload: {
          emails: emails,
          url: window.location.href,
          // eslint-disable-next-line camelcase
          referrer_url: document.referrer
        }
      });
    }
  }, {
    key: "extractAccountEmails",
    value: function extractAccountEmails(document) {
      var anchorElements = document.querySelectorAll("".concat(this.googleAccountProfileDomSelector.gdoc, ",\n       ").concat(this.googleAccountProfileDomSelector.gdrive, ",\n       ").concat(this.googleAccountProfileDomSelector.pdf_view));
      return Array.from(anchorElements).map(function (element) {
        return element.getAttribute('aria-label') || '';
      }).reduce(function (emails, element) {
        return emails.concat(element.match(EMAIL_REGEX) || []);
      }, []).filter(function (email) {
        return email !== '';
      }).map(function (email) {
        return email.trim().toLowerCase();
      });
    }
  }]);
  return ContentScriptGoogle;
}(ContentScriptBase);
;// CONCATENATED MODULE: ./src/content/content_google.js
/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 * 
 * @oncall blackbird_data_access
 *
 */





try {
  new ContentScriptGoogle(chrome).run();
} catch (e) {
  logger_consoleDebug('Error running Google content script:', e);
  chrome.runtime.sendMessage({
    type: 'content_script_google_error',
    payload: {
      error_msg: "".concat(e.name, ": ").concat(e.message)
    }
  });
}
})();

/******/ })()
;
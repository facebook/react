'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// this will be preserved during build
var VueFactory = require('./factory');

var instances = {};

/**
 * Prepare framework config.
 * Nothing need to do actually, just an interface provided to weex runtime.
 */
function init () {}

/**
 * Reset framework config and clear all registrations.
 */
function reset () {
  clear(instances);
}

/**
 * Delete all keys of an object.
 * @param {object} obj
 */
function clear (obj) {
  for (var key in obj) {
    delete obj[key];
  }
}

/**
 * Create an instance with id, code, config and external data.
 * @param {string} instanceId
 * @param {string} appCode
 * @param {object} config
 * @param {object} data
 * @param {object} env { info, config, services }
 */
function createInstance (
  instanceId,
  appCode,
  config,
  data,
  env
) {
  if ( appCode === void 0 ) appCode = '';
  if ( config === void 0 ) config = {};
  if ( env === void 0 ) env = {};

  var weex = env.weex;
  var document = weex.document;
  var instance = instances[instanceId] = {
    instanceId: instanceId, config: config, data: data,
    document: document
  };

  var timerAPIs = getInstanceTimer(instanceId, weex.requireModule);

  // Each instance has a independent `Vue` module instance
  var Vue = instance.Vue = createVueModuleInstance(instanceId, weex);

  // The function which create a closure the JS Bundle will run in.
  // It will declare some instance variables like `Vue`, HTML5 Timer APIs etc.
  var instanceVars = Object.assign({
    Vue: Vue,
    weex: weex
  }, timerAPIs, env.services);

  appCode = "(function(global){ \n" + appCode + "\n })(Object.create(this))";
  callFunction(instanceVars, appCode);

  return instance
}

/**
 * Destroy an instance with id. It will make sure all memory of
 * this instance released and no more leaks.
 * @param {string} instanceId
 */
function destroyInstance (instanceId) {
  var instance = instances[instanceId];
  if (instance && instance.app instanceof instance.Vue) {
    instance.document.destroy();
    instance.app.$destroy();
    delete instance.document;
    delete instance.app;
  }
  delete instances[instanceId];
}

/**
 * Refresh an instance with id and new top-level component data.
 * It will use `Vue.set` on all keys of the new data. So it's better
 * define all possible meaningful keys when instance created.
 * @param {string} instanceId
 * @param {object} data
 */
function refreshInstance (instanceId, data) {
  var instance = instances[instanceId];
  if (!instance || !(instance.app instanceof instance.Vue)) {
    return new Error(("refreshInstance: instance " + instanceId + " not found!"))
  }
  for (var key in data) {
    instance.Vue.set(instance.app, key, data[key]);
  }
  // Finally `refreshFinish` signal needed.
  instance.document.taskCenter.send('dom', { action: 'refreshFinish' }, []);
}

/**
 * Get the JSON object of the root element.
 * @param {string} instanceId
 */
function getRoot (instanceId) {
  var instance = instances[instanceId];
  if (!instance || !(instance.app instanceof instance.Vue)) {
    return new Error(("getRoot: instance " + instanceId + " not found!"))
  }
  return instance.app.$el.toJSON()
}

/**
 * Create a fresh instance of Vue for each Weex instance.
 */
function createVueModuleInstance (instanceId, weex) {
  var exports = {};
  VueFactory(exports, weex.document);
  var Vue = exports.Vue;

  var instance = instances[instanceId];

  // patch reserved tag detection to account for dynamically registered
  // components
  var weexRegex = /^weex:/i;
  var isReservedTag = Vue.config.isReservedTag || (function () { return false; });
  var isRuntimeComponent = Vue.config.isRuntimeComponent || (function () { return false; });
  Vue.config.isReservedTag = function (name) {
    return (!isRuntimeComponent(name) && weex.supports(("@component/" + name))) ||
      isReservedTag(name) ||
      weexRegex.test(name)
  };
  Vue.config.parsePlatformTagName = function (name) { return name.replace(weexRegex, ''); };

  // expose weex-specific info
  Vue.prototype.$instanceId = instanceId;
  Vue.prototype.$document = instance.document;

  // expose weex native module getter on subVue prototype so that
  // vdom runtime modules can access native modules via vnode.context
  Vue.prototype.$requireWeexModule = weex.requireModule;

  // Hack `Vue` behavior to handle instance information and data
  // before root component created.
  Vue.mixin({
    beforeCreate: function beforeCreate () {
      var options = this.$options;
      // root component (vm)
      if (options.el) {
        // set external data of instance
        var dataOption = options.data;
        var internalData = (typeof dataOption === 'function' ? dataOption() : dataOption) || {};
        options.data = Object.assign(internalData, instance.data);
        // record instance by id
        instance.app = this;
      }
    },
    mounted: function mounted () {
      var options = this.$options;
      // root component (vm)
      if (options.el && weex.document) {
        try {
          // Send "createFinish" signal to native.
          weex.document.taskCenter.send('dom', { action: 'createFinish' }, []);
        } catch (e) {}
      }
    }
  });

  /**
   * @deprecated Just instance variable `weex.config`
   * Get instance config.
   * @return {object}
   */
  Vue.prototype.$getConfig = function () {
    if (instance.app instanceof Vue) {
      return instance.config
    }
  };

  return Vue
}

/**
 * Generate HTML5 Timer APIs. An important point is that the callback
 * will be converted into callback id when sent to native. So the
 * framework can make sure no side effect of the callback happened after
 * an instance destroyed.
 * @param  {[type]} instanceId   [description]
 * @param  {[type]} moduleGetter [description]
 * @return {[type]}              [description]
 */
function getInstanceTimer (instanceId, moduleGetter) {
  var instance = instances[instanceId];
  var timer = moduleGetter('timer');
  var timerAPIs = {
    setTimeout: function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      var handler = function () {
        args[0].apply(args, args.slice(2));
      };

      timer.setTimeout(handler, args[1]);
      return instance.document.taskCenter.callbackManager.lastCallbackId.toString()
    },
    setInterval: function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      var handler = function () {
        args[0].apply(args, args.slice(2));
      };

      timer.setInterval(handler, args[1]);
      return instance.document.taskCenter.callbackManager.lastCallbackId.toString()
    },
    clearTimeout: function (n) {
      timer.clearTimeout(n);
    },
    clearInterval: function (n) {
      timer.clearInterval(n);
    }
  };
  return timerAPIs
}

/**
 * Call a new function body with some global objects.
 * @param  {object} globalObjects
 * @param  {string} code
 * @return {any}
 */
function callFunction (globalObjects, body) {
  var globalKeys = [];
  var globalValues = [];
  for (var key in globalObjects) {
    globalKeys.push(key);
    globalValues.push(globalObjects[key]);
  }
  globalKeys.push(body);

  var result = new (Function.prototype.bind.apply( Function, [ null ].concat( globalKeys) ));
  return result.apply(void 0, globalValues)
}

exports.init = init;
exports.reset = reset;
exports.createInstance = createInstance;
exports.destroyInstance = destroyInstance;
exports.refreshInstance = refreshInstance;
exports.getRoot = getRoot;

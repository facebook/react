/* @flow */

// this will be preserved during build
// $flow-disable-line
const VueFactory = require('./factory')

const instanceOptions: { [key: string]: WeexInstanceOption } = {}

/**
 * Create instance context.
 */
export function createInstanceContext (
  instanceId: string,
  runtimeContext: WeexRuntimeContext,
  data: Object = {}
): WeexInstanceContext {
  const weex: Weex = runtimeContext.weex
  const instance: WeexInstanceOption = instanceOptions[instanceId] = {
    instanceId,
    config: weex.config,
    document: weex.document,
    data
  }

  // Each instance has a independent `Vue` module instance
  const Vue = instance.Vue = createVueModuleInstance(instanceId, weex)

  // DEPRECATED
  const timerAPIs = getInstanceTimer(instanceId, weex.requireModule)

  const instanceContext = Object.assign({ Vue }, timerAPIs)
  Object.freeze(instanceContext)
  return instanceContext
}

/**
 * Destroy an instance with id. It will make sure all memory of
 * this instance released and no more leaks.
 */
export function destroyInstance (instanceId: string): void {
  const instance = instanceOptions[instanceId]
  if (instance && instance.app instanceof instance.Vue) {
    try {
      instance.app.$destroy()
      instance.document.destroy()
    } catch (e) {}
    delete instance.document
    delete instance.app
  }
  delete instanceOptions[instanceId]
}

/**
 * Refresh an instance with id and new top-level component data.
 * It will use `Vue.set` on all keys of the new data. So it's better
 * define all possible meaningful keys when instance created.
 */
export function refreshInstance (
  instanceId: string,
  data: Object
): Error | void {
  const instance = instanceOptions[instanceId]
  if (!instance || !(instance.app instanceof instance.Vue)) {
    return new Error(`refreshInstance: instance ${instanceId} not found!`)
  }
  if (instance.Vue && instance.Vue.set) {
    for (const key in data) {
      instance.Vue.set(instance.app, key, data[key])
    }
  }
  // Finally `refreshFinish` signal needed.
  instance.document.taskCenter.send('dom', { action: 'refreshFinish' }, [])
}

/**
 * Create a fresh instance of Vue for each Weex instance.
 */
function createVueModuleInstance (
  instanceId: string,
  weex: Weex
): GlobalAPI {
  const exports = {}
  VueFactory(exports, weex.document)
  const Vue = exports.Vue

  const instance = instanceOptions[instanceId]

  // patch reserved tag detection to account for dynamically registered
  // components
  const weexRegex = /^weex:/i
  const isReservedTag = Vue.config.isReservedTag || (() => false)
  const isRuntimeComponent = Vue.config.isRuntimeComponent || (() => false)
  Vue.config.isReservedTag = name => {
    return (!isRuntimeComponent(name) && weex.supports(`@component/${name}`)) ||
      isReservedTag(name) ||
      weexRegex.test(name)
  }
  Vue.config.parsePlatformTagName = name => name.replace(weexRegex, '')

  // expose weex-specific info
  Vue.prototype.$instanceId = instanceId
  Vue.prototype.$document = instance.document

  // expose weex native module getter on subVue prototype so that
  // vdom runtime modules can access native modules via vnode.context
  Vue.prototype.$requireWeexModule = weex.requireModule

  // Hack `Vue` behavior to handle instance information and data
  // before root component created.
  Vue.mixin({
    beforeCreate () {
      const options = this.$options
      // root component (vm)
      if (options.el) {
        // set external data of instance
        const dataOption = options.data
        const internalData = (typeof dataOption === 'function' ? dataOption() : dataOption) || {}
        options.data = Object.assign(internalData, instance.data)
        // record instance by id
        instance.app = this
      }
    },
    mounted () {
      const options = this.$options
      // root component (vm)
      if (options.el && weex.document && instance.app === this) {
        try {
          // Send "createFinish" signal to native.
          weex.document.taskCenter.send('dom', { action: 'createFinish' }, [])
        } catch (e) {}
      }
    }
  })

  /**
   * @deprecated Just instance variable `weex.config`
   * Get instance config.
   * @return {object}
   */
  Vue.prototype.$getConfig = function () {
    if (instance.app instanceof Vue) {
      return instance.config
    }
  }

  return Vue
}

/**
 * DEPRECATED
 * Generate HTML5 Timer APIs. An important point is that the callback
 * will be converted into callback id when sent to native. So the
 * framework can make sure no side effect of the callback happened after
 * an instance destroyed.
 */
function getInstanceTimer (
  instanceId: string,
  moduleGetter: Function
): Object {
  const instance = instanceOptions[instanceId]
  const timer = moduleGetter('timer')
  const timerAPIs = {
    setTimeout: (...args) => {
      const handler = function () {
        args[0](...args.slice(2))
      }

      timer.setTimeout(handler, args[1])
      return instance.document.taskCenter.callbackManager.lastCallbackId.toString()
    },
    setInterval: (...args) => {
      const handler = function () {
        args[0](...args.slice(2))
      }

      timer.setInterval(handler, args[1])
      return instance.document.taskCenter.callbackManager.lastCallbackId.toString()
    },
    clearTimeout: (n) => {
      timer.clearTimeout(n)
    },
    clearInterval: (n) => {
      timer.clearInterval(n)
    }
  }
  return timerAPIs
}

/* @flow */

// https://github.com/Hanks10100/weex-native-directive/tree/master/component

import { mergeOptions, isPlainObject, noop } from 'core/util/index'
import Watcher from 'core/observer/watcher'
import { initProxy } from 'core/instance/proxy'
import { initState, getData } from 'core/instance/state'
import { initRender } from 'core/instance/render'
import { initEvents } from 'core/instance/events'
import { initProvide, initInjections } from 'core/instance/inject'
import { initLifecycle, callHook } from 'core/instance/lifecycle'
import { initInternalComponent, resolveConstructorOptions } from 'core/instance/init'
import { registerComponentHook, updateComponentData } from '../../util/index'

let uid = 0

// override Vue.prototype._init
function initVirtualComponent (options: Object = {}) {
  const vm: Component = this
  const componentId = options.componentId

  // virtual component uid
  vm._uid = `virtual-component-${uid++}`

  // a flag to avoid this being observed
  vm._isVue = true
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    initProxy(vm)
  } else {
    vm._renderProxy = vm
  }

  vm._self = vm
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm) // resolve injections before data/props
  initState(vm)
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')

  // send initial data to native
  const data = vm.$options.data
  const params = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (isPlainObject(params)) {
    updateComponentData(componentId, params)
  }

  registerComponentHook(componentId, 'lifecycle', 'attach', () => {
    callHook(vm, 'beforeMount')

    const updateComponent = () => {
      vm._update(vm._vnode, false)
    }
    new Watcher(vm, updateComponent, noop, null, true)

    vm._isMounted = true
    callHook(vm, 'mounted')
  })

  registerComponentHook(componentId, 'lifecycle', 'detach', () => {
    vm.$destroy()
  })
}

// override Vue.prototype._update
function updateVirtualComponent (vnode?: VNode) {
  const vm: Component = this
  const componentId = vm.$options.componentId
  if (vm._isMounted) {
    callHook(vm, 'beforeUpdate')
  }
  vm._vnode = vnode
  if (vm._isMounted && componentId) {
    // TODO: data should be filtered and without bindings
    const data = Object.assign({}, vm._data)
    updateComponentData(componentId, data, () => {
      callHook(vm, 'updated')
    })
  }
}

// listening on native callback
export function resolveVirtualComponent (vnode: MountedComponentVNode): VNode {
  const BaseCtor = vnode.componentOptions.Ctor
  const VirtualComponent = BaseCtor.extend({})
  const cid = VirtualComponent.cid
  VirtualComponent.prototype._init = initVirtualComponent
  VirtualComponent.prototype._update = updateVirtualComponent

  vnode.componentOptions.Ctor = BaseCtor.extend({
    beforeCreate () {
      // const vm: Component = this

      // TODO: listen on all events and dispatch them to the
      // corresponding virtual components according to the componentId.
      // vm._virtualComponents = {}
      const createVirtualComponent = (componentId, propsData) => {
        // create virtual component
        // const subVm =
        new VirtualComponent({
          componentId,
          propsData
        })
        // if (vm._virtualComponents) {
        //   vm._virtualComponents[componentId] = subVm
        // }
      }

      registerComponentHook(cid, 'lifecycle', 'create', createVirtualComponent)
    },
    beforeDestroy () {
      delete this._virtualComponents
    }
  })
}


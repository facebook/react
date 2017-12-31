/* @flow */

import Vue from 'core/index'
import { patch } from 'weex/runtime/patch'
import { mountComponent } from 'core/instance/lifecycle'
import platformDirectives from 'weex/runtime/directives/index'
import platformComponents from 'weex/runtime/components/index'

import {
  query,
  mustUseProp,
  isReservedTag,
  isRuntimeComponent,
  isUnknownElement
} from 'weex/util/element'

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isRuntimeComponent = isRuntimeComponent
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives and components
Vue.options.directives = platformDirectives
Vue.options.components = platformComponents

// install platform patch function
Vue.prototype.__patch__ = patch

// wrap mount
Vue.prototype.$mount = function (
  el?: any,
  hydrating?: boolean
): Component {
  return mountComponent(
    this,
    el && query(el, this.$document),
    hydrating
  )
}

export default Vue

import { warn } from 'core/util/debug'
import { extend, once, noop } from 'shared/util'
import { activeInstance } from 'core/instance/lifecycle'
import { resolveTransition } from 'web/runtime/transition-util'

export default {
  create: enter,
  activate: enter,
  remove: leave
}

function enter (_, vnode) {
  const el = vnode.elm

  // call leave callback now
  if (el._leaveCb) {
    el._leaveCb.cancelled = true
    el._leaveCb()
  }

  const data = resolveTransition(vnode.data.transition)
  if (!data) {
    return
  }

  /* istanbul ignore if */
  if (el._enterCb) {
    return
  }

  const {
    enterClass,
    enterToClass,
    enterActiveClass,
    appearClass,
    appearToClass,
    appearActiveClass,
    beforeEnter,
    enter,
    afterEnter,
    enterCancelled,
    beforeAppear,
    appear,
    afterAppear,
    appearCancelled
  } = data

  let context = activeInstance
  let transitionNode = activeInstance.$vnode
  while (transitionNode && transitionNode.parent) {
    transitionNode = transitionNode.parent
    context = transitionNode.context
  }

  const isAppear = !context._isMounted || !vnode.isRootInsert

  if (isAppear && !appear && appear !== '') {
    return
  }

  const startClass = isAppear ? appearClass : enterClass
  const toClass = isAppear ? appearToClass : enterToClass
  const activeClass = isAppear ? appearActiveClass : enterActiveClass
  const beforeEnterHook = isAppear ? (beforeAppear || beforeEnter) : beforeEnter
  const enterHook = isAppear ? (typeof appear === 'function' ? appear : enter) : enter
  const afterEnterHook = isAppear ? (afterAppear || afterEnter) : afterEnter
  const enterCancelledHook = isAppear ? (appearCancelled || enterCancelled) : enterCancelled

  const userWantsControl =
    enterHook &&
    // enterHook may be a bound method which exposes
    // the length of original fn as _length
    (enterHook._length || enterHook.length) > 1

  const stylesheet = vnode.context.$options.style || {}
  const startState = stylesheet[startClass]
  const transitionProperties = (stylesheet['@TRANSITION'] && stylesheet['@TRANSITION'][activeClass]) || {}
  const endState = getEnterTargetState(el, stylesheet, startClass, toClass, activeClass, vnode.context)
  const needAnimation = Object.keys(endState).length > 0

  const cb = el._enterCb = once(() => {
    if (cb.cancelled) {
      enterCancelledHook && enterCancelledHook(el)
    } else {
      afterEnterHook && afterEnterHook(el)
    }
    el._enterCb = null
  })

  // We need to wait until the native element has been inserted, but currently
  // there's no API to do that. So we have to wait "one frame" - not entirely
  // sure if this is guaranteed to be enough (e.g. on slow devices?)
  setTimeout(() => {
    const parent = el.parentNode
    const pendingNode = parent && parent._pending && parent._pending[vnode.key]
    if (pendingNode &&
      pendingNode.context === vnode.context &&
      pendingNode.tag === vnode.tag &&
      pendingNode.elm._leaveCb
    ) {
      pendingNode.elm._leaveCb()
    }
    enterHook && enterHook(el, cb)

    if (needAnimation) {
      const animation = vnode.context.$requireWeexModule('animation')
      animation.transition(el.ref, {
        styles: endState,
        duration: transitionProperties.duration || 0,
        delay: transitionProperties.delay || 0,
        timingFunction: transitionProperties.timingFunction || 'linear'
      }, userWantsControl ? noop : cb)
    } else if (!userWantsControl) {
      cb()
    }
  }, 16)

  // start enter transition
  beforeEnterHook && beforeEnterHook(el)

  if (startState) {
    if (typeof el.setStyles === 'function') {
      el.setStyles(startState)
    } else {
      for (const key in startState) {
        el.setStyle(key, startState[key])
      }
    }
  }

  if (!needAnimation && !userWantsControl) {
    cb()
  }
}

function leave (vnode, rm) {
  const el = vnode.elm

  // call enter callback now
  if (el._enterCb) {
    el._enterCb.cancelled = true
    el._enterCb()
  }

  const data = resolveTransition(vnode.data.transition)
  if (!data) {
    return rm()
  }

  if (el._leaveCb) {
    return
  }

  const {
    leaveClass,
    leaveToClass,
    leaveActiveClass,
    beforeLeave,
    leave,
    afterLeave,
    leaveCancelled,
    delayLeave
  } = data

  const userWantsControl =
    leave &&
    // leave hook may be a bound method which exposes
    // the length of original fn as _length
    (leave._length || leave.length) > 1

  const stylesheet = vnode.context.$options.style || {}
  const startState = stylesheet[leaveClass]
  const endState = stylesheet[leaveToClass] || stylesheet[leaveActiveClass]
  const transitionProperties = (stylesheet['@TRANSITION'] && stylesheet['@TRANSITION'][leaveActiveClass]) || {}

  const cb = el._leaveCb = once(() => {
    if (el.parentNode && el.parentNode._pending) {
      el.parentNode._pending[vnode.key] = null
    }
    if (cb.cancelled) {
      leaveCancelled && leaveCancelled(el)
    } else {
      rm()
      afterLeave && afterLeave(el)
    }
    el._leaveCb = null
  })

  if (delayLeave) {
    delayLeave(performLeave)
  } else {
    performLeave()
  }

  function performLeave () {
    const animation = vnode.context.$requireWeexModule('animation')
    // the delayed leave may have already been cancelled
    if (cb.cancelled) {
      return
    }
    // record leaving element
    if (!vnode.data.show) {
      (el.parentNode._pending || (el.parentNode._pending = {}))[vnode.key] = vnode
    }
    beforeLeave && beforeLeave(el)

    if (startState) {
      animation.transition(el.ref, {
        styles: startState
      }, next)
    } else {
      next()
    }

    function next () {
      animation.transition(el.ref, {
        styles: endState,
        duration: transitionProperties.duration || 0,
        delay: transitionProperties.delay || 0,
        timingFunction: transitionProperties.timingFunction || 'linear'
      }, userWantsControl ? noop : cb)
    }

    leave && leave(el, cb)
    if (!endState && !userWantsControl) {
      cb()
    }
  }
}

// determine the target animation style for an entering transition.
function getEnterTargetState (el, stylesheet, startClass, endClass, activeClass, vm) {
  const targetState = {}
  const startState = stylesheet[startClass]
  const endState = stylesheet[endClass]
  const activeState = stylesheet[activeClass]
  // 1. fallback to element's default styling
  if (startState) {
    for (const key in startState) {
      targetState[key] = el.style[key]
      if (
        process.env.NODE_ENV !== 'production' &&
        targetState[key] == null &&
        (!activeState || activeState[key] == null) &&
        (!endState || endState[key] == null)
      ) {
        warn(
          `transition property "${key}" is declared in enter starting class (.${startClass}), ` +
          `but not declared anywhere in enter ending class (.${endClass}), ` +
          `enter active cass (.${activeClass}) or the element's default styling. ` +
          `Note in Weex, CSS properties need explicit values to be transitionable.`
        )
      }
    }
  }
  // 2. if state is mixed in active state, extract them while excluding
  //    transition properties
  if (activeState) {
    for (const key in activeState) {
      if (key.indexOf('transition') !== 0) {
        targetState[key] = activeState[key]
      }
    }
  }
  // 3. explicit endState has highest priority
  if (endState) {
    extend(targetState, endState)
  }
  return targetState
}

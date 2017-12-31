import { warn, extend } from 'core/util/index'
import { transitionProps, extractTransitionData } from './transition'

const props = extend({
  tag: String,
  moveClass: String
}, transitionProps)

delete props.mode

export default {
  props,

  created () {
    const dom = this.$requireWeexModule('dom')
    this.getPosition = el => new Promise((resolve, reject) => {
      dom.getComponentRect(el.ref, res => {
        if (!res.result) {
          reject(new Error(`failed to get rect for element: ${el.tag}`))
        } else {
          resolve(res.size)
        }
      })
    })

    const animation = this.$requireWeexModule('animation')
    this.animate = (el, options) => new Promise(resolve => {
      animation.transition(el.ref, options, resolve)
    })
  },

  render (h) {
    const tag = this.tag || this.$vnode.data.tag || 'span'
    const map = Object.create(null)
    const prevChildren = this.prevChildren = this.children
    const rawChildren = this.$slots.default || []
    const children = this.children = []
    const transitionData = extractTransitionData(this)

    for (let i = 0; i < rawChildren.length; i++) {
      const c = rawChildren[i]
      if (c.tag) {
        if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
          children.push(c)
          map[c.key] = c
          ;(c.data || (c.data = {})).transition = transitionData
        } else if (process.env.NODE_ENV !== 'production') {
          const opts = c.componentOptions
          const name = opts
            ? (opts.Ctor.options.name || opts.tag)
            : c.tag
          warn(`<transition-group> children must be keyed: <${name}>`)
        }
      }
    }

    if (prevChildren) {
      const kept = []
      const removed = []
      prevChildren.forEach(c => {
        c.data.transition = transitionData

        // TODO: record before patch positions

        if (map[c.key]) {
          kept.push(c)
        } else {
          removed.push(c)
        }
      })
      this.kept = h(tag, null, kept)
      this.removed = removed
    }

    return h(tag, null, children)
  },

  beforeUpdate () {
    // force removing pass
    this.__patch__(
      this._vnode,
      this.kept,
      false, // hydrating
      true // removeOnly (!important, avoids unnecessary moves)
    )
    this._vnode = this.kept
  },

  updated () {
    const children = this.prevChildren
    const moveClass = this.moveClass || ((this.name || 'v') + '-move')
    const moveData = children.length && this.getMoveData(children[0].context, moveClass)
    if (!moveData) {
      return
    }

    // TODO: finish implementing move animations once
    // we have access to sync getComponentRect()

    // children.forEach(callPendingCbs)

    // Promise.all(children.map(c => {
    //   const oldPos = c.data.pos
    //   const newPos = c.data.newPos
    //   const dx = oldPos.left - newPos.left
    //   const dy = oldPos.top - newPos.top
    //   if (dx || dy) {
    //     c.data.moved = true
    //     return this.animate(c.elm, {
    //       styles: {
    //         transform: `translate(${dx}px,${dy}px)`
    //       }
    //     })
    //   }
    // })).then(() => {
    //   children.forEach(c => {
    //     if (c.data.moved) {
    //       this.animate(c.elm, {
    //         styles: {
    //           transform: ''
    //         },
    //         duration: moveData.duration || 0,
    //         delay: moveData.delay || 0,
    //         timingFunction: moveData.timingFunction || 'linear'
    //       })
    //     }
    //   })
    // })
  },

  methods: {
    getMoveData (context, moveClass) {
      const stylesheet = context.$options.style || {}
      return stylesheet['@TRANSITION'] && stylesheet['@TRANSITION'][moveClass]
    }
  }
}

// function callPendingCbs (c) {
//   /* istanbul ignore if */
//   if (c.elm._moveCb) {
//     c.elm._moveCb()
//   }
//   /* istanbul ignore if */
//   if (c.elm._enterCb) {
//     c.elm._enterCb()
//   }
// }

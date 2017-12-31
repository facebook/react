/* @flow */

/**
 * In SSR, the vdom tree is generated only once and never patched, so
 * we can optimize most element / trees into plain string render functions.
 * The SSR optimizer walks the AST tree to detect optimizable elements and trees.
 *
 * The criteria for SSR optimizability is quite a bit looser than static tree
 * detection (which is designed for client re-render). In SSR we bail only for
 * components/slots/custom directives.
 */

import { no, makeMap, isBuiltInTag } from 'shared/util'

// optimizability constants
export const optimizability = {
  FALSE: 0,    // whole sub tree un-optimizable
  FULL: 1,     // whole sub tree optimizable
  SELF: 2,     // self optimizable but has some un-optimizable children
  CHILDREN: 3, // self un-optimizable but have fully optimizable children
  PARTIAL: 4   // self un-optimizable with some un-optimizable children
}

let isPlatformReservedTag

export function optimize (root: ?ASTElement, options: CompilerOptions) {
  if (!root) return
  isPlatformReservedTag = options.isReservedTag || no
  walk(root, true)
}

function walk (node: ASTNode, isRoot?: boolean) {
  if (isUnOptimizableTree(node)) {
    node.ssrOptimizability = optimizability.FALSE
    return
  }
  // root node or nodes with custom directives should always be a VNode
  const selfUnoptimizable = isRoot || hasCustomDirective(node)
  const check = child => {
    if (child.ssrOptimizability !== optimizability.FULL) {
      node.ssrOptimizability = selfUnoptimizable
        ? optimizability.PARTIAL
        : optimizability.SELF
    }
  }
  if (selfUnoptimizable) {
    node.ssrOptimizability = optimizability.CHILDREN
  }
  if (node.type === 1) {
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      walk(child)
      check(child)
    }
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block
        walk(block, isRoot)
        check(block)
      }
    }
    if (node.ssrOptimizability == null ||
      (!isRoot && (node.attrsMap['v-html'] || node.attrsMap['v-text']))
    ) {
      node.ssrOptimizability = optimizability.FULL
    } else {
      node.children = optimizeSiblings(node)
    }
  } else {
    node.ssrOptimizability = optimizability.FULL
  }
}

function optimizeSiblings (el) {
  const children = el.children
  const optimizedChildren = []

  let currentOptimizableGroup = []
  const pushGroup = () => {
    if (currentOptimizableGroup.length) {
      optimizedChildren.push({
        type: 1,
        parent: el,
        tag: 'template',
        attrsList: [],
        attrsMap: {},
        children: currentOptimizableGroup,
        ssrOptimizability: optimizability.FULL
      })
    }
    currentOptimizableGroup = []
  }

  for (let i = 0; i < children.length; i++) {
    const c = children[i]
    if (c.ssrOptimizability === optimizability.FULL) {
      currentOptimizableGroup.push(c)
    } else {
      // wrap fully-optimizable adjacent siblings inside a template tag
      // so that they can be optimized into a single ssrNode by codegen
      pushGroup()
      optimizedChildren.push(c)
    }
  }
  pushGroup()
  return optimizedChildren
}

function isUnOptimizableTree (node: ASTNode): boolean {
  if (node.type === 2 || node.type === 3) { // text or expression
    return false
  }
  return (
    isBuiltInTag(node.tag) || // built-in (slot, component)
    !isPlatformReservedTag(node.tag) || // custom component
    !!node.component || // "is" component
    isSelectWithModel(node) // <select v-model> requires runtime inspection
  )
}

const isBuiltInDir = makeMap('text,html,show,on,bind,model,pre,cloak,once')

function hasCustomDirective (node: ASTNode): ?boolean {
  return (
    node.type === 1 &&
    node.directives &&
    node.directives.some(d => !isBuiltInDir(d.name))
  )
}

// <select v-model> cannot be optimized because it requires a runtime check
// to determine proper selected option
function isSelectWithModel (node: ASTNode): boolean {
  return (
    node.type === 1 &&
    node.tag === 'select' &&
    node.directives != null &&
    node.directives.some(d => d.name === 'model')
  )
}

/* @flow */

// import { warn } from 'core/util/index'

// this will be preserved during build
// $flow-disable-line
const acorn = require('acorn') // $flow-disable-line
const walk = require('acorn/dist/walk') // $flow-disable-line
const escodegen = require('escodegen')

export function nodeToBinding (node: Object): any {
  switch (node.type) {
    case 'Literal': return node.value
    case 'Identifier':
    case 'UnaryExpression':
    case 'BinaryExpression':
    case 'LogicalExpression':
    case 'ConditionalExpression':
    case 'MemberExpression': return { '@binding': escodegen.generate(node) }
    case 'ArrayExpression': return node.elements.map(_ => nodeToBinding(_))
    case 'ObjectExpression': {
      const object = {}
      node.properties.forEach(prop => {
        if (!prop.key || prop.key.type !== 'Identifier') {
          return
        }
        const key = escodegen.generate(prop.key)
        const value = nodeToBinding(prop.value)
        if (key && value) {
          object[key] = value
        }
      })
      return object
    }
    default: {
      // warn(`Not support ${node.type}: "${escodegen.generate(node)}"`)
      return ''
    }
  }
}

export function generateBinding (exp: ?string): any {
  if (exp && typeof exp === 'string') {
    let ast = null
    try {
      ast = acorn.parse(`(${exp})`)
    } catch (e) {
      // warn(`Failed to parse the expression: "${exp}"`)
      return ''
    }

    let output = ''
    walk.simple(ast, {
      Expression (node) {
        output = nodeToBinding(node)
      }
    })
    return output
  }
}

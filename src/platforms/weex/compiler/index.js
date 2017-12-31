/* @flow */

import { genStaticKeys } from 'shared/util'
import { createCompiler } from 'compiler/index'

import modules from './modules/index'
import directives from './directives/index'

import {
  isUnaryTag,
  mustUseProp,
  isReservedTag,
  canBeLeftOpenTag,
  getTagNamespace
} from '../util/element'

export const baseOptions: WeexCompilerOptions = {
  modules,
  directives,
  isUnaryTag,
  mustUseProp,
  canBeLeftOpenTag,
  isReservedTag,
  getTagNamespace,
  preserveWhitespace: false,
  recyclable: false,
  staticKeys: genStaticKeys(modules)
}

const compiler = createCompiler(baseOptions)

export function compile (
  template: string,
  options?: WeexCompilerOptions
): WeexCompiledResult {
  let generateAltRender = false
  if (options && options.recyclable === true) {
    generateAltRender = true
    options.recyclable = false
  }
  const result = compiler.compile(template, options)

  // generate @render function for <recycle-list>
  if (options && generateAltRender) {
    options.recyclable = true
    // disable static optimizations
    options.optimize = false
    const { render } = compiler.compile(template, options)
    result['@render'] = render
  }
  return result
}

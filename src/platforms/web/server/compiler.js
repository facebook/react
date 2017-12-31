/* @flow */

import { baseOptions } from '../compiler/options'
import { createCompiler } from 'server/optimizing-compiler/index'

const { compile, compileToFunctions } = createCompiler(baseOptions)

export {
  compile as ssrCompile,
  compileToFunctions as ssrCompileToFunctions
}

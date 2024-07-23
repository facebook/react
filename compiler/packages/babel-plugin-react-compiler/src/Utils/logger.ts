/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import generate from '@babel/generator';
import * as t from '@babel/types';
import chalk from 'chalk';
import {HIR, HIRFunction, ReactiveFunction} from '../HIR/HIR';
import {printFunctionWithOutlined, printHIR} from '../HIR/PrintHIR';
import {CodegenFunction} from '../ReactiveScopes';
import {printReactiveFunctionWithOutlined} from '../ReactiveScopes/PrintReactiveFunction';

let ENABLED: boolean = false;

let lastLogged: string;

export function toggleLogging(enabled: boolean): void {
  ENABLED = enabled;
}

export function logDebug(step: string, value: string): void {
  if (ENABLED) {
    process.stdout.write(`${chalk.green(step)}:\n${value}\n\n`);
  }
}

export function logHIR(step: string, ir: HIR): void {
  if (ENABLED) {
    const printed = printHIR(ir);
    if (printed !== lastLogged) {
      lastLogged = printed;
      process.stdout.write(`${chalk.green(step)}:\n${printed}\n\n`);
    } else {
      process.stdout.write(`${chalk.blue(step)}: (no change)\n\n`);
    }
  }
}

export function logCodegenFunction(step: string, fn: CodegenFunction): void {
  if (ENABLED) {
    let printed: string | null = null;
    try {
      const node = t.functionDeclaration(
        fn.id,
        fn.params,
        fn.body,
        fn.generator,
        fn.async,
      );
      const ast = generate(node);
      printed = ast.code;
    } catch (e) {
      let errMsg: string;
      if (
        typeof e === 'object' &&
        e != null &&
        'message' in e &&
        typeof e.message === 'string'
      ) {
        errMsg = e.message.toString();
      } else {
        errMsg = '[empty]';
      }
      console.log('Error formatting AST: ' + errMsg);
    }
    if (printed === null) {
      return;
    }
    if (printed !== lastLogged) {
      lastLogged = printed;
      process.stdout.write(`${chalk.green(step)}:\n${printed}\n\n`);
    } else {
      process.stdout.write(`${chalk.blue(step)}: (no change)\n\n`);
    }
  }
}

export function logHIRFunction(step: string, fn: HIRFunction): void {
  if (ENABLED) {
    const printed = printFunctionWithOutlined(fn);
    if (printed !== lastLogged) {
      lastLogged = printed;
      process.stdout.write(`${chalk.green(step)}:\n${printed}\n\n`);
    } else {
      process.stdout.write(`${chalk.blue(step)}: (no change)\n\n`);
    }
  }
}

export function logReactiveFunction(step: string, fn: ReactiveFunction): void {
  if (ENABLED) {
    const printed = printReactiveFunctionWithOutlined(fn);
    if (printed !== lastLogged) {
      lastLogged = printed;
      process.stdout.write(`${chalk.green(step)}:\n${printed}\n\n`);
    } else {
      process.stdout.write(`${chalk.blue(step)}: (no change)\n\n`);
    }
  }
}

export function log(fn: () => string): void {
  if (ENABLED) {
    const message = fn();
    process.stdout.write(message.trim() + '\n\n');
  }
}
